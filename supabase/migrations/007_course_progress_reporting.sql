-- =============================================================
-- 007: Relatório de progresso por curso, aluno e aula
-- A RPC só devolve dados se o solicitante for responsável pelo curso
-- ou administrador. Ela evita que o front-end precise agregar dados de
-- outros cursos para montar o painel docente.
-- =============================================================

CREATE OR REPLACE FUNCTION public.get_course_lesson_progress(p_course_id UUID)
RETURNS TABLE (
  student_id UUID,
  student_name TEXT,
  student_email TEXT,
  lesson_id UUID,
  lesson_title TEXT,
  lesson_order INTEGER,
  access_starts_at TIMESTAMP WITH TIME ZONE,
  access_ends_at TIMESTAMP WITH TIME ZONE,
  completed BOOLEAN,
  video_progress_seconds INTEGER,
  last_activity TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    u.id AS student_id,
    u.nome_completo AS student_name,
    u.email AS student_email,
    l.id AS lesson_id,
    l.titulo AS lesson_title,
    l.ordem AS lesson_order,
    l.access_starts_at,
    l.access_ends_at,
    COALESCE(lp.completed, false) AS completed,
    COALESCE(lp.video_progress_seconds, 0) AS video_progress_seconds,
    lp.created_at AS last_activity
  FROM public.enrollments e
  JOIN public.users u ON u.id = e.student_id
  JOIN public.lessons l ON l.course_id = e.course_id
  LEFT JOIN public.lesson_progress lp
    ON lp.student_id = e.student_id
   AND lp.lesson_id = l.id
  WHERE e.course_id = p_course_id
    AND e.status = 'ACTIVE'
    AND public.is_course_manager(p_course_id)
  ORDER BY u.nome_completo, l.ordem;
$$;

GRANT EXECUTE ON FUNCTION public.get_course_lesson_progress(UUID) TO authenticated;
