-- ============================================================
-- MULTIPLUS ACADEMY — MIGRATION 002: LMS PREMIUM FEATURES
-- ============================================================

-- 1. Extensao da tabela lessons
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS quiz JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')) DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
-- NOTA: o link de video Cloudinary usa a coluna "video_url" que ja existe. Nao criar coluna nova.

-- 2. Tabela de alvos da aula (aluno especifico em curso especifico)
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

CREATE POLICY "lesson_targets_select_own_or_staff" ON public.lesson_targets FOR SELECT
USING (auth.uid() = student_id OR public.get_user_role(auth.uid()) IN ('PROFESSOR', 'ADMIN'));

CREATE POLICY "lesson_targets_manage_staff" ON public.lesson_targets FOR ALL
USING (public.get_user_role(auth.uid()) IN ('PROFESSOR', 'ADMIN'));

-- 3. Respostas de quiz dos alunos
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

CREATE POLICY "quiz_submissions_select_own_or_staff" ON public.quiz_submissions FOR SELECT
USING (auth.uid() = student_id OR public.get_user_role(auth.uid()) IN ('PROFESSOR', 'ADMIN'));

CREATE POLICY "quiz_submissions_insert_own" ON public.quiz_submissions FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "quiz_submissions_update_own" ON public.quiz_submissions FOR UPDATE
USING (auth.uid() = student_id);

-- 4. Certificados: anexar arquivo PDF e quem emitiu
ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS certificate_pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS issued_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- 5. Mural de avisos (broadcast institucional, separado do chat 1:1)
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  destinatarios TEXT CHECK (destinatarios IN ('ALL', 'ALUNO', 'PROFESSOR')) DEFAULT 'ALL',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "announcements_select_all" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "announcements_manage_staff" ON public.announcements FOR ALL
USING (public.get_user_role(auth.uid()) IN ('PROFESSOR', 'ADMIN'));

-- 6. Regras de permissao de mensagens por papel
DROP POLICY IF EXISTS "Enviar mensagem de forma autorizada" ON public.messages;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Enviar mensagem conforme regras de papel" ON public.messages FOR INSERT
WITH CHECK (auth.uid() = sender_id AND public.can_send_message(sender_id, receiver_id));

-- 7. Notificacao automatica: nova mensagem
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.notifications (user_id, text) VALUES (NEW.receiver_id, 'Nova mensagem recebida');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_new_message ON public.messages;
CREATE TRIGGER trg_notify_new_message AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();

-- 8. Notificacao automatica: aula agendada para o aluno
CREATE OR REPLACE FUNCTION public.notify_lesson_target()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.notifications (user_id, text) VALUES (NEW.student_id, 'Nova aula agendada para você');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_lesson_target ON public.lesson_targets;
CREATE TRIGGER trg_notify_lesson_target AFTER INSERT ON public.lesson_targets
FOR EACH ROW EXECUTE FUNCTION public.notify_lesson_target();

-- 9. Notificacao automatica: certificado emitido
CREATE OR REPLACE FUNCTION public.notify_certificate_issued()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.notifications (user_id, text) VALUES (NEW.student_id, 'Você recebeu um novo certificado');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_certificate ON public.certificates;
CREATE TRIGGER trg_notify_certificate AFTER INSERT ON public.certificates
FOR EACH ROW EXECUTE FUNCTION public.notify_certificate_issued();

-- 10. Indices de performance
CREATE INDEX IF NOT EXISTS idx_lessons_status ON public.lessons(status);
CREATE INDEX IF NOT EXISTS idx_lessons_scheduled_at ON public.lessons(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_announcements_destinatarios ON public.announcements(destinatarios);

-- 11. View opcional de progresso agregado (usada na Fase 8)
CREATE OR REPLACE VIEW public.vw_student_progress AS
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
