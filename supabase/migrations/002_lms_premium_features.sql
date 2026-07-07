-- ATENCAO: a tabela "student_progress" do schema original (001)
-- foi RENOMEADA para "lesson_progress" em producao, porque o
-- codigo em academicService.ts (getCompletedLessons,
-- markLessonComplete) ja consulta "lesson_progress" com as
-- colunas student_id, lesson_id, completed. Se qualquer outro
-- arquivo do projeto ainda referenciar "student_progress",
-- precisa ser atualizado para "lesson_progress".

ALTER TABLE public.student_progress RENAME TO lesson_progress;
ALTER TABLE public.lesson_progress ALTER COLUMN course_id DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.fill_lesson_progress_course_id()
RETURNS trigger AS $$
BEGIN
  IF NEW.course_id IS NULL THEN
    SELECT course_id INTO NEW.course_id FROM public.lessons WHERE id = NEW.lesson_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_fill_lesson_progress_course_id ON public.lesson_progress;
CREATE TRIGGER trg_fill_lesson_progress_course_id
BEFORE INSERT ON public.lesson_progress
FOR EACH ROW EXECUTE FUNCTION public.fill_lesson_progress_course_id();

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS quiz JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')) DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
-- Nota: o link de video Cloudinary usa a coluna "video_url" que
-- ja existe desde o schema 001. Nao criar coluna nova para isso.

CREATE TABLE IF NOT EXISTS public.lesson_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (lesson_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_lesson_targets_student ON public.lesson_targets(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_targets_lesson ON public.lesson_targets(lesson_id);
ALTER TABLE public.lesson_targets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lesson_targets_select_own_or_staff" ON public.lesson_targets;
CREATE POLICY "lesson_targets_select_own_or_staff" ON public.lesson_targets FOR SELECT
USING (auth.uid() = student_id OR public.get_user_role(auth.uid()) IN ('PROFESSOR', 'ADMIN'));

DROP POLICY IF EXISTS "lesson_targets_manage_staff" ON public.lesson_targets;
CREATE POLICY "lesson_targets_manage_staff" ON public.lesson_targets FOR ALL
USING (public.get_user_role(auth.uid()) IN ('PROFESSOR', 'ADMIN'));

CREATE TABLE IF NOT EXISTS public.quiz_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  score NUMERIC,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (lesson_id, student_id)
);
ALTER TABLE public.quiz_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quiz_submissions_select_own_or_staff" ON public.quiz_submissions;
CREATE POLICY "quiz_submissions_select_own_or_staff" ON public.quiz_submissions FOR SELECT
USING (auth.uid() = student_id OR public.get_user_role(auth.uid()) IN ('PROFESSOR', 'ADMIN'));

DROP POLICY IF EXISTS "quiz_submissions_insert_own" ON public.quiz_submissions;
CREATE POLICY "quiz_submissions_insert_own" ON public.quiz_submissions FOR INSERT
WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "quiz_submissions_update_own" ON public.quiz_submissions;
CREATE POLICY "quiz_submissions_update_own" ON public.quiz_submissions FOR UPDATE
USING (auth.uid() = student_id);

ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS certificate_pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS issued_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  destinatarios TEXT CHECK (destinatarios IN ('ALL', 'ALUNO', 'PROFESSOR')) DEFAULT 'ALL',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "announcements_select_all" ON public.announcements;
CREATE POLICY "announcements_select_all" ON public.announcements FOR SELECT USING (true);

DROP POLICY IF EXISTS "announcements_manage_staff" ON public.announcements;
CREATE POLICY "announcements_manage_staff" ON public.announcements FOR ALL
USING (public.get_user_role(auth.uid()) IN ('PROFESSOR', 'ADMIN'));

DROP POLICY IF EXISTS "Enviar mensagem de forma autorizada" ON public.messages;
DROP POLICY IF EXISTS "Enviar mensagem conforme regras de papel" ON public.messages;

CREATE OR REPLACE FUNCTION public.can_send_message(p_sender_id UUID, p_receiver_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  sender_role TEXT := public.get_user_role(p_sender_id);
  receiver_role TEXT := public.get_user_role(p_receiver_id);
BEGIN
  IF sender_role = 'ADMIN' THEN
    RETURN TRUE;
  ELSIF sender_role = 'PROFESSOR' THEN
    RETURN receiver_role IN ('ADMIN', 'PROFESSOR', 'ALUNO');
  ELSIF sender_role = 'ALUNO' THEN
    RETURN receiver_role = 'PROFESSOR';
  END IF;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE POLICY "Enviar mensagem conforme regras de papel" ON public.messages FOR INSERT
WITH CHECK (auth.uid() = sender_id AND public.can_send_message(sender_id, receiver_id));

CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.notifications (user_id, text) VALUES (NEW.receiver_id, 'Nova mensagem recebida');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notify_new_message ON public.messages;
CREATE TRIGGER trg_notify_new_message AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();

CREATE OR REPLACE FUNCTION public.notify_lesson_target()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.notifications (user_id, text) VALUES (NEW.student_id, 'Nova aula agendada para voce');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notify_lesson_target ON public.lesson_targets;
CREATE TRIGGER trg_notify_lesson_target AFTER INSERT ON public.lesson_targets
FOR EACH ROW EXECUTE FUNCTION public.notify_lesson_target();

CREATE OR REPLACE FUNCTION public.notify_certificate_issued()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.notifications (user_id, text) VALUES (NEW.student_id, 'Voce recebeu um novo certificado');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notify_certificate ON public.certificates;
CREATE TRIGGER trg_notify_certificate AFTER INSERT ON public.certificates
FOR EACH ROW EXECUTE FUNCTION public.notify_certificate_issued();

CREATE INDEX IF NOT EXISTS idx_lessons_status ON public.lessons(status);
CREATE INDEX IF NOT EXISTS idx_lessons_scheduled_at ON public.lessons(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_announcements_destinatarios ON public.announcements(destinatarios);

-- View de progresso agregado. Criada com security_invoker = true
-- de proposito: sem isso, a view ignora o RLS das tabelas de
-- origem e qualquer aluno autenticado consegue ver o progresso
-- de TODOS os outros alunos. Isso foi um erro real, encontrado
-- e corrigido pelo Advisor de seguranca do Supabase antes de ir
-- para producao.
CREATE OR REPLACE VIEW public.vw_student_progress
WITH (security_invoker = true)
AS
SELECT
  e.student_id,
  e.course_id,
  c.title AS course_title,
  count(DISTINCT l.id) AS total_lessons,
  count(DISTINCT lp.lesson_id) FILTER (WHERE lp.completed) AS completed_lessons,
  CASE WHEN count(DISTINCT l.id) = 0 THEN 0
       ELSE round(count(DISTINCT lp.lesson_id) FILTER (WHERE lp.completed)::numeric / count(DISTINCT l.id) * 100)
  END AS progress_percent,
  avg(qs.score) AS avg_quiz_score,
  max(lp.created_at) AS last_activity
FROM public.enrollments e
JOIN public.courses c ON c.id = e.course_id
LEFT JOIN public.lessons l ON l.course_id = e.course_id
LEFT JOIN public.lesson_progress lp ON lp.lesson_id = l.id AND lp.student_id = e.student_id
LEFT JOIN public.quiz_submissions qs ON qs.lesson_id = l.id AND qs.student_id = e.student_id
GROUP BY e.student_id, e.course_id, c.title;

ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.get_user_role(uuid) SET search_path = public;
