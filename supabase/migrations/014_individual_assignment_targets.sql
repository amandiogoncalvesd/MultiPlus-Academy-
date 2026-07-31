-- =============================================================
-- 014: Avaliações direcionadas a alunos específicos
-- Uma avaliação sem destinatários continua disponível à turma ativa.
-- Quando há destinatários, somente os alunos alvo podem visualizá-la.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.assignment_targets (
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (assignment_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_assignment_targets_student ON public.assignment_targets(student_id, assignment_id);

ALTER TABLE public.assignment_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY assignment_targets_select_scoped ON public.assignment_targets FOR SELECT TO authenticated
USING (
  student_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND public.is_course_manager(a.course_id))
);

CREATE POLICY assignment_targets_manage_course ON public.assignment_targets FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND public.is_course_manager(a.course_id)))
WITH CHECK (EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND public.is_course_manager(a.course_id)));

DROP POLICY IF EXISTS assignments_select_scoped ON public.assignments;
CREATE POLICY assignments_select_scoped ON public.assignments FOR SELECT
USING (
  public.is_course_manager(course_id)
  OR (
    status = 'PUBLISHED'
    AND public.is_course_student(course_id)
    AND (
      NOT EXISTS (SELECT 1 FROM public.assignment_targets t WHERE t.assignment_id = assignments.id)
      OR EXISTS (SELECT 1 FROM public.assignment_targets t WHERE t.assignment_id = assignments.id AND t.student_id = auth.uid())
    )
  )
);
