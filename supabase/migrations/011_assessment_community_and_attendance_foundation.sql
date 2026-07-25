-- =============================================================
-- 011: Avaliação institucional, comunidade e registros letivos
-- Gradebook, rubricas, presença, syllabus, objetivos e fóruns
-- vinculados exclusivamente a turmas/seções acadêmicas.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.section_syllabi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL UNIQUE REFERENCES public.course_sections(id) ON DELETE CASCADE,
  overview TEXT,
  learning_methodology TEXT,
  assessment_policy TEXT,
  attendance_policy TEXT,
  late_work_policy TEXT,
  accessibility_statement TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.learning_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (course_id, code),
  CONSTRAINT learning_outcomes_status_check CHECK (status IN ('ACTIVE', 'ARCHIVED'))
);

CREATE TABLE IF NOT EXISTS public.grade_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.course_sections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  weight NUMERIC(5,2) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  drop_lowest_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (section_id, name),
  CONSTRAINT grade_categories_weight_check CHECK (weight >= 0 AND weight <= 100),
  CONSTRAINT grade_categories_drop_lowest_check CHECK (drop_lowest_count >= 0)
);

CREATE TABLE IF NOT EXISTS public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.course_sections(id) ON DELETE CASCADE,
  assignment_id UUID UNIQUE REFERENCES public.assignments(id) ON DELETE SET NULL,
  grade_category_id UUID REFERENCES public.grade_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  instructions TEXT,
  due_at TIMESTAMP WITH TIME ZONE,
  available_from TIMESTAMP WITH TIME ZONE,
  available_until TIMESTAMP WITH TIME ZONE,
  points_possible NUMERIC(8,2) NOT NULL DEFAULT 100,
  allowed_attempts INTEGER NOT NULL DEFAULT 1,
  late_policy TEXT NOT NULL DEFAULT 'ACCEPT',
  status TEXT NOT NULL DEFAULT 'DRAFT',
  published_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT assessments_points_check CHECK (points_possible > 0),
  CONSTRAINT assessments_attempts_check CHECK (allowed_attempts > 0),
  CONSTRAINT assessments_dates_check CHECK (available_until IS NULL OR available_from IS NULL OR available_until >= available_from),
  CONSTRAINT assessments_late_policy_check CHECK (late_policy IN ('ACCEPT', 'PENALIZE', 'REJECT')),
  CONSTRAINT assessments_status_check CHECK (status IN ('DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED'))
);

CREATE TABLE IF NOT EXISTS public.assessment_outcomes (
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  learning_outcome_id UUID NOT NULL REFERENCES public.learning_outcomes(id) ON DELETE CASCADE,
  PRIMARY KEY (assessment_id, learning_outcome_id)
);

CREATE TABLE IF NOT EXISTS public.rubrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.course_sections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (section_id, name)
);

CREATE TABLE IF NOT EXISTS public.rubric_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rubric_id UUID NOT NULL REFERENCES public.rubrics(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  points_possible NUMERIC(8,2) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  levels JSONB NOT NULL DEFAULT '[]'::jsonb,
  CONSTRAINT rubric_criteria_points_check CHECK (points_possible > 0)
);

CREATE TABLE IF NOT EXISTS public.assessment_rubrics (
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  rubric_id UUID NOT NULL REFERENCES public.rubrics(id) ON DELETE RESTRICT,
  PRIMARY KEY (assessment_id, rubric_id)
);

CREATE TABLE IF NOT EXISTS public.grade_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  score NUMERIC(8,2),
  feedback TEXT,
  rubric_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'PENDING',
  published_at TIMESTAMP WITH TIME ZONE,
  graded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  graded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (assessment_id, student_id),
  CONSTRAINT grade_entries_score_check CHECK (score IS NULL OR score >= 0),
  CONSTRAINT grade_entries_status_check CHECK (status IN ('PENDING', 'GRADED', 'EXCUSED', 'PUBLISHED'))
);

CREATE TABLE IF NOT EXISTS public.attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.course_sections(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
  title TEXT NOT NULL,
  duration_minutes INTEGER,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT attendance_sessions_duration_check CHECK (duration_minutes IS NULL OR duration_minutes > 0)
);

CREATE TABLE IF NOT EXISTS public.attendance_records (
  attendance_session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'PRESENT',
  note TEXT,
  recorded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (attendance_session_id, student_id),
  CONSTRAINT attendance_records_status_check CHECK (status IN ('PRESENT', 'LATE', 'EXCUSED', 'ABSENT'))
);

CREATE TABLE IF NOT EXISTS public.discussion_forums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.course_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_graded BOOLEAN NOT NULL DEFAULT false,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.discussion_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_id UUID NOT NULL REFERENCES public.discussion_forums(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.discussion_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.discussion_threads(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_assessments_section_status ON public.assessments(section_id, status, due_at);
CREATE INDEX IF NOT EXISTS idx_grade_entries_student ON public.grade_entries(student_id, assessment_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_section ON public.attendance_sessions(section_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student ON public.attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_discussion_forums_section ON public.discussion_forums(section_id);
CREATE INDEX IF NOT EXISTS idx_discussion_threads_forum ON public.discussion_threads(forum_id, is_pinned DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussion_posts_thread ON public.discussion_posts(thread_id, created_at);

ALTER TABLE public.section_syllabi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubric_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY section_syllabi_select_scoped ON public.section_syllabi FOR SELECT TO authenticated USING (public.can_view_section(section_id));
CREATE POLICY section_syllabi_manage_staff ON public.section_syllabi FOR ALL TO authenticated USING (public.is_section_instructor(section_id)) WITH CHECK (public.is_section_instructor(section_id));

CREATE POLICY learning_outcomes_select_scoped ON public.learning_outcomes FOR SELECT TO authenticated USING (
  public.get_user_role(auth.uid()) = 'ADMIN' OR EXISTS (SELECT 1 FROM public.course_sections s WHERE s.course_id = learning_outcomes.course_id AND public.can_view_section(s.id))
);
CREATE POLICY learning_outcomes_manage_admin ON public.learning_outcomes FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'ADMIN') WITH CHECK (public.get_user_role(auth.uid()) = 'ADMIN');

CREATE POLICY grade_categories_select_scoped ON public.grade_categories FOR SELECT TO authenticated USING (public.can_view_section(section_id));
CREATE POLICY grade_categories_manage_staff ON public.grade_categories FOR ALL TO authenticated USING (public.is_section_instructor(section_id)) WITH CHECK (public.is_section_instructor(section_id));
CREATE POLICY assessments_select_scoped ON public.assessments FOR SELECT TO authenticated USING (public.can_view_section(section_id));
CREATE POLICY assessments_manage_staff ON public.assessments FOR ALL TO authenticated USING (public.is_section_instructor(section_id)) WITH CHECK (public.is_section_instructor(section_id));
CREATE POLICY assessment_outcomes_select_scoped ON public.assessment_outcomes FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.assessments a WHERE a.id = assessment_id AND public.can_view_section(a.section_id)));
CREATE POLICY assessment_outcomes_manage_staff ON public.assessment_outcomes FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.assessments a WHERE a.id = assessment_id AND public.is_section_instructor(a.section_id))) WITH CHECK (EXISTS (SELECT 1 FROM public.assessments a WHERE a.id = assessment_id AND public.is_section_instructor(a.section_id)));
CREATE POLICY rubrics_select_scoped ON public.rubrics FOR SELECT TO authenticated USING (public.can_view_section(section_id));
CREATE POLICY rubrics_manage_staff ON public.rubrics FOR ALL TO authenticated USING (public.is_section_instructor(section_id)) WITH CHECK (public.is_section_instructor(section_id));
CREATE POLICY rubric_criteria_select_scoped ON public.rubric_criteria FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.rubrics r WHERE r.id = rubric_id AND public.can_view_section(r.section_id)));
CREATE POLICY rubric_criteria_manage_staff ON public.rubric_criteria FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.rubrics r WHERE r.id = rubric_id AND public.is_section_instructor(r.section_id))) WITH CHECK (EXISTS (SELECT 1 FROM public.rubrics r WHERE r.id = rubric_id AND public.is_section_instructor(r.section_id)));
CREATE POLICY assessment_rubrics_select_scoped ON public.assessment_rubrics FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.assessments a WHERE a.id = assessment_id AND public.can_view_section(a.section_id)));
CREATE POLICY assessment_rubrics_manage_staff ON public.assessment_rubrics FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.assessments a WHERE a.id = assessment_id AND public.is_section_instructor(a.section_id))) WITH CHECK (EXISTS (SELECT 1 FROM public.assessments a WHERE a.id = assessment_id AND public.is_section_instructor(a.section_id)));

CREATE POLICY grade_entries_select_scoped ON public.grade_entries FOR SELECT TO authenticated USING (
  (student_id = auth.uid() AND status = 'PUBLISHED') OR EXISTS (SELECT 1 FROM public.assessments a WHERE a.id = assessment_id AND public.is_section_instructor(a.section_id))
);
CREATE POLICY grade_entries_manage_staff ON public.grade_entries FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.assessments a WHERE a.id = assessment_id AND public.is_section_instructor(a.section_id))) WITH CHECK (EXISTS (SELECT 1 FROM public.assessments a WHERE a.id = assessment_id AND public.is_section_instructor(a.section_id)));

CREATE POLICY attendance_sessions_select_scoped ON public.attendance_sessions FOR SELECT TO authenticated USING (public.can_view_section(section_id));
CREATE POLICY attendance_sessions_manage_staff ON public.attendance_sessions FOR ALL TO authenticated USING (public.is_section_instructor(section_id)) WITH CHECK (public.is_section_instructor(section_id));
CREATE POLICY attendance_records_select_scoped ON public.attendance_records FOR SELECT TO authenticated USING (student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.attendance_sessions s WHERE s.id = attendance_session_id AND public.is_section_instructor(s.section_id)));
CREATE POLICY attendance_records_manage_staff ON public.attendance_records FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.attendance_sessions s WHERE s.id = attendance_session_id AND public.is_section_instructor(s.section_id))) WITH CHECK (EXISTS (SELECT 1 FROM public.attendance_sessions s WHERE s.id = attendance_session_id AND public.is_section_instructor(s.section_id)));

CREATE POLICY discussion_forums_select_scoped ON public.discussion_forums FOR SELECT TO authenticated USING (public.can_view_section(section_id));
CREATE POLICY discussion_forums_manage_staff ON public.discussion_forums FOR ALL TO authenticated USING (public.is_section_instructor(section_id)) WITH CHECK (public.is_section_instructor(section_id));
CREATE POLICY discussion_threads_select_scoped ON public.discussion_threads FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.discussion_forums f WHERE f.id = forum_id AND public.can_view_section(f.section_id)));
CREATE POLICY discussion_threads_insert_participant ON public.discussion_threads FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid() AND EXISTS (SELECT 1 FROM public.discussion_forums f WHERE f.id = forum_id AND NOT f.is_locked AND public.can_view_section(f.section_id)));
CREATE POLICY discussion_threads_update_author_or_staff ON public.discussion_threads FOR UPDATE TO authenticated USING (author_id = auth.uid() OR EXISTS (SELECT 1 FROM public.discussion_forums f WHERE f.id = forum_id AND public.is_section_instructor(f.section_id))) WITH CHECK (author_id = auth.uid() OR EXISTS (SELECT 1 FROM public.discussion_forums f WHERE f.id = forum_id AND public.is_section_instructor(f.section_id)));
CREATE POLICY discussion_posts_select_scoped ON public.discussion_posts FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.discussion_threads t JOIN public.discussion_forums f ON f.id = t.forum_id WHERE t.id = thread_id AND public.can_view_section(f.section_id)));
CREATE POLICY discussion_posts_insert_participant ON public.discussion_posts FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid() AND EXISTS (SELECT 1 FROM public.discussion_threads t JOIN public.discussion_forums f ON f.id = t.forum_id WHERE t.id = thread_id AND NOT t.is_locked AND NOT f.is_locked AND public.can_view_section(f.section_id)));
CREATE POLICY discussion_posts_update_author_or_staff ON public.discussion_posts FOR UPDATE TO authenticated USING (author_id = auth.uid() OR EXISTS (SELECT 1 FROM public.discussion_threads t JOIN public.discussion_forums f ON f.id = t.forum_id WHERE t.id = thread_id AND public.is_section_instructor(f.section_id))) WITH CHECK (author_id = auth.uid() OR EXISTS (SELECT 1 FROM public.discussion_threads t JOIN public.discussion_forums f ON f.id = t.forum_id WHERE t.id = thread_id AND public.is_section_instructor(f.section_id)));
