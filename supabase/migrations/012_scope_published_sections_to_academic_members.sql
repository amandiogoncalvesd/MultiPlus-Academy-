-- =============================================================
-- 012: Restringir turmas publicadas ao vínculo acadêmico
-- Cursos publicados podem aparecer no catálogo; turmas não são
-- catálogo público e só devem ser visíveis a administração, equipe
-- docente da turma e estudantes com matrícula ativa/concluída.
-- =============================================================

DROP POLICY IF EXISTS course_sections_select_scoped ON public.course_sections;

CREATE POLICY course_sections_select_scoped ON public.course_sections
  FOR SELECT TO authenticated
  USING (
    public.get_user_role(auth.uid()) = 'ADMIN'
    OR public.can_view_section(id)
  );
