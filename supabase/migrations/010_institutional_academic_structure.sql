-- =============================================================
-- 010: Estrutura acadêmica institucional
--
-- Termos, turmas/seções, equipes docentes, matrículas governadas
-- por seção e calendário acadêmico. Esta migration é aditiva: não
-- altera os fluxos de cursos e matrículas já publicados.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.academic_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  enrollment_opens_on DATE,
  enrollment_closes_on DATE,
  status TEXT NOT NULL DEFAULT 'PLANNED',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT academic_terms_dates_check CHECK (ends_on >= starts_on),
  CONSTRAINT academic_terms_enrollment_dates_check CHECK (
    enrollment_opens_on IS NULL
    OR enrollment_closes_on IS NULL
    OR enrollment_closes_on >= enrollment_opens_on
  ),
  CONSTRAINT academic_terms_status_check CHECK (status IN ('PLANNED', 'ACTIVE', 'CLOSED', 'ARCHIVED'))
);

CREATE TABLE IF NOT EXISTS public.course_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  academic_term_id UUID NOT NULL REFERENCES public.academic_terms(id) ON DELETE RESTRICT,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  primary_teacher_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  modality TEXT NOT NULL DEFAULT 'ONLINE',
  location TEXT,
  meeting_url TEXT,
  capacity INTEGER,
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT course_sections_code_per_term UNIQUE (academic_term_id, code),
  CONSTRAINT course_sections_capacity_check CHECK (capacity IS NULL OR capacity > 0),
  CONSTRAINT course_sections_dates_check CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at >= starts_at),
  CONSTRAINT course_sections_modality_check CHECK (modality IN ('ONLINE', 'PRESENCIAL', 'HIBRIDO')),
  CONSTRAINT course_sections_status_check CHECK (status IN ('DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED'))
);

CREATE TABLE IF NOT EXISTS public.section_instructors (
  section_id UUID NOT NULL REFERENCES public.course_sections(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'INSTRUCTOR',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (section_id, instructor_id),
  CONSTRAINT section_instructors_role_check CHECK (role IN ('INSTRUCTOR', 'CO_INSTRUCTOR', 'ASSISTANT'))
);

CREATE TABLE IF NOT EXISTS public.section_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.course_sections(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'PENDING',
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  UNIQUE (section_id, student_id),
  CONSTRAINT section_enrollments_status_check CHECK (status IN ('PENDING', 'ACTIVE', 'WAITLISTED', 'CANCELLED', 'COMPLETED'))
);

CREATE TABLE IF NOT EXISTS public.academic_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_term_id UUID REFERENCES public.academic_terms(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.course_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'ACADEMIC',
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE,
  all_day BOOLEAN NOT NULL DEFAULT false,
  visibility TEXT NOT NULL DEFAULT 'INSTITUTION',
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT academic_calendar_events_dates_check CHECK (ends_at IS NULL OR ends_at >= starts_at),
  CONSTRAINT academic_calendar_events_type_check CHECK (event_type IN ('ACADEMIC', 'HOLIDAY', 'ENROLLMENT', 'ASSESSMENT', 'MEETING')),
  CONSTRAINT academic_calendar_events_visibility_check CHECK (visibility IN ('INSTITUTION', 'TERM', 'SECTION')),
  CONSTRAINT academic_calendar_events_scope_check CHECK (
    (visibility = 'INSTITUTION' AND academic_term_id IS NULL AND section_id IS NULL)
    OR (visibility = 'TERM' AND academic_term_id IS NOT NULL AND section_id IS NULL)
    OR (visibility = 'SECTION' AND section_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_academic_terms_status_dates ON public.academic_terms(status, starts_on, ends_on);
CREATE INDEX IF NOT EXISTS idx_course_sections_course_term ON public.course_sections(course_id, academic_term_id);
CREATE INDEX IF NOT EXISTS idx_course_sections_teacher ON public.course_sections(primary_teacher_id);
CREATE INDEX IF NOT EXISTS idx_section_instructors_instructor ON public.section_instructors(instructor_id);
CREATE INDEX IF NOT EXISTS idx_section_enrollments_student_status ON public.section_enrollments(student_id, status);
CREATE INDEX IF NOT EXISTS idx_section_enrollments_section_status ON public.section_enrollments(section_id, status);
CREATE INDEX IF NOT EXISTS idx_academic_calendar_events_dates ON public.academic_calendar_events(starts_at, ends_at);

CREATE OR REPLACE FUNCTION public.is_section_instructor(p_section_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT public.get_user_role(p_user_id) = 'ADMIN'
    OR EXISTS (
      SELECT 1 FROM public.course_sections s
      WHERE s.id = p_section_id AND s.primary_teacher_id = p_user_id
    )
    OR EXISTS (
      SELECT 1 FROM public.section_instructors si
      WHERE si.section_id = p_section_id AND si.instructor_id = p_user_id
    );
$$;

CREATE OR REPLACE FUNCTION public.can_view_section(p_section_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT public.is_section_instructor(p_section_id, p_user_id)
    OR EXISTS (
      SELECT 1 FROM public.section_enrollments se
      WHERE se.section_id = p_section_id
        AND se.student_id = p_user_id
        AND se.status IN ('ACTIVE', 'COMPLETED')
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_section_instructor(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_section(UUID, UUID) TO authenticated;

ALTER TABLE public.academic_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY academic_terms_select_authenticated ON public.academic_terms
  FOR SELECT TO authenticated USING (true);
CREATE POLICY academic_terms_admin_manage ON public.academic_terms
  FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'ADMIN')
  WITH CHECK (public.get_user_role(auth.uid()) = 'ADMIN');

CREATE POLICY course_sections_select_scoped ON public.course_sections
  FOR SELECT TO authenticated USING (
    status = 'PUBLISHED' OR public.can_view_section(id) OR public.get_user_role(auth.uid()) = 'ADMIN'
  );
CREATE POLICY course_sections_admin_manage ON public.course_sections
  FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'ADMIN')
  WITH CHECK (public.get_user_role(auth.uid()) = 'ADMIN');

CREATE POLICY section_instructors_select_scoped ON public.section_instructors
  FOR SELECT TO authenticated USING (public.can_view_section(section_id));
CREATE POLICY section_instructors_admin_manage ON public.section_instructors
  FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'ADMIN')
  WITH CHECK (public.get_user_role(auth.uid()) = 'ADMIN');

CREATE POLICY section_enrollments_select_scoped ON public.section_enrollments
  FOR SELECT TO authenticated USING (
    student_id = auth.uid() OR public.is_section_instructor(section_id)
  );
CREATE POLICY section_enrollments_admin_manage ON public.section_enrollments
  FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'ADMIN')
  WITH CHECK (public.get_user_role(auth.uid()) = 'ADMIN');

CREATE POLICY academic_calendar_events_select_scoped ON public.academic_calendar_events
  FOR SELECT TO authenticated USING (
    visibility = 'INSTITUTION'
    OR (visibility = 'TERM' AND EXISTS (
      SELECT 1 FROM public.course_sections s WHERE s.academic_term_id = academic_calendar_events.academic_term_id AND public.can_view_section(s.id)
    ))
    OR (visibility = 'SECTION' AND public.can_view_section(section_id))
    OR public.get_user_role(auth.uid()) = 'ADMIN'
  );
CREATE POLICY academic_calendar_events_admin_manage ON public.academic_calendar_events
  FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'ADMIN')
  WITH CHECK (public.get_user_role(auth.uid()) = 'ADMIN');
