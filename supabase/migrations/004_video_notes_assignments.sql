-- =============================================================
-- MIGRATION 004: Suporte a videoaulas, apontamentos, 
--                 progresso de vídeo e link de reunião
-- =============================================================

-- 1. Adicionar campo de progresso do vídeo na tabela lesson_progress
ALTER TABLE public.lesson_progress
  ADD COLUMN IF NOT EXISTS video_progress_seconds INTEGER DEFAULT 0;

-- 2. Adicionar campo de link de reunião (Google Meet, Zoom, etc.) na tabela lessons
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS meeting_url TEXT;

-- 3. Criar tabela de apontamentos/notas do aluno
CREATE TABLE IF NOT EXISTS public.lesson_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  video_timestamp INTEGER DEFAULT 0, -- Segundos do vídeo quando a nota foi criada
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.lesson_notes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_lesson_notes_student ON public.lesson_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_notes_lesson ON public.lesson_notes(lesson_id);

-- RLS: Aluno pode ver e criar suas próprias notas; Professor/Admin podem ver de alunos dos seus cursos
DROP POLICY IF EXISTS "lesson_notes_select_own" ON public.lesson_notes;
CREATE POLICY "lesson_notes_select_own" ON public.lesson_notes FOR SELECT
USING (auth.uid() = student_id OR public.get_user_role(auth.uid()) IN ('PROFESSOR', 'ADMIN'));

DROP POLICY IF EXISTS "lesson_notes_insert_own" ON public.lesson_notes;
CREATE POLICY "lesson_notes_insert_own" ON public.lesson_notes FOR INSERT
WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "lesson_notes_update_own" ON public.lesson_notes;
CREATE POLICY "lesson_notes_update_own" ON public.lesson_notes FOR UPDATE
USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "lesson_notes_delete_own" ON public.lesson_notes;
CREATE POLICY "lesson_notes_delete_own" ON public.lesson_notes FOR DELETE
USING (auth.uid() = student_id);

-- 4. Criar tabela de assignments (para substituir dados fictícios do StudentTasksTab)
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  teacher_id UUID REFERENCES public.users(id) ON DELETE SET NULL NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('DRAFT', 'PUBLISHED', 'CLOSED')) DEFAULT 'PUBLISHED',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assignments_select_published" ON public.assignments;
CREATE POLICY "assignments_select_published" ON public.assignments FOR SELECT
USING (
  (status = 'PUBLISHED' AND EXISTS (
    SELECT 1 FROM public.enrollments e WHERE e.student_id = auth.uid() AND e.course_id = assignments.course_id
  )) OR public.get_user_role(auth.uid()) IN ('PROFESSOR', 'ADMIN')
);

DROP POLICY IF EXISTS "assignments_manage_staff" ON public.assignments;
CREATE POLICY "assignments_manage_staff" ON public.assignments FOR ALL
USING (public.get_user_role(auth.uid()) IN ('PROFESSOR', 'ADMIN'));

-- 5. Criar tabela de submissões de tarefas
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  submission_url TEXT,
  submission_text TEXT,
  feedback TEXT,
  grade NUMERIC,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (assignment_id, student_id)
);
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assignment_submissions_select_own" ON public.assignment_submissions;
CREATE POLICY "assignment_submissions_select_own" ON public.assignment_submissions FOR SELECT
USING (auth.uid() = student_id OR public.get_user_role(auth.uid()) IN ('PROFESSOR', 'ADMIN'));

DROP POLICY IF EXISTS "assignment_submissions_insert_own" ON public.assignment_submissions;
CREATE POLICY "assignment_submissions_insert_own" ON public.assignment_submissions FOR INSERT
WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "assignment_submissions_update_own" ON public.assignment_submissions;
CREATE POLICY "assignment_submissions_update_own" ON public.assignment_submissions FOR UPDATE
USING (auth.uid() = student_id OR public.get_user_role(auth.uid()) IN ('PROFESSOR', 'ADMIN'));

-- 6. Trigger para notificar alunos sobre novas tarefas
CREATE OR REPLACE FUNCTION public.notify_new_assignment()
RETURNS trigger AS $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN 
    SELECT student_id FROM public.enrollments 
    WHERE course_id = NEW.course_id AND status = 'ACTIVE'
  LOOP
    INSERT INTO public.notifications (user_id, text) 
    VALUES (rec.student_id, 'Nova tarefa atribuída: ' || NEW.titulo);
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notify_new_assignment ON public.assignments;
CREATE TRIGGER trg_notify_new_assignment AFTER INSERT ON public.assignments
FOR EACH ROW EXECUTE FUNCTION public.notify_new_assignment();
