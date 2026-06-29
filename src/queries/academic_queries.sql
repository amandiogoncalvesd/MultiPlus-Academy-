-- ADDITIONAL DATABASE SCHEMA ADDITIONS & COMPLEX ACADEMIC QUERIES
-- MultiPlus Academy Phase 3 Implementation SQL queries

-- 1. Create public.modules table (for structured course content planning)
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    titulo TEXT NOT NULL,
    ordem INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (course_id, ordem)
);

-- Enable RLS on modules
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- 2. Create public.lesson_progress table (for tracking lesson completion)
CREATE TABLE IF NOT EXISTS public.lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
    completed BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (student_id, lesson_id)
);

-- Enable RLS on lesson_progress
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;


-- =========================================================================
-- ROW LEVEL SECURITY POLICIES (RLS) FOR NEW TABLES
-- =========================================================================

-- Modules Table Policies:
CREATE POLICY "Leitura de modulos por qualquer pessoa autenticada"
ON public.modules FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Professores e administradores gerenciam modulos"
ON public.modules FOR ALL
USING (public.get_user_role(auth.uid()) IN ('PROFESSOR', 'ADMIN'));


-- Lesson Progress Table Policies:
CREATE POLICY "Leitura do proprio progresso ou docentes/admin"
ON public.lesson_progress FOR SELECT
USING (
    auth.uid() = student_id OR
    public.get_user_role(auth.uid()) IN ('PROFESSOR', 'ADMIN')
);

CREATE POLICY "Estudantes marcam o proprio progresso"
ON public.lesson_progress FOR ALL
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);


-- =========================================================================
-- EXAMPLES OF REUSABLE RELATIONAL QUERIES FOR DASHBOARDS
-- =========================================================================

-- Query: Retrieve student progress percentage dynamically (calculated on lessons vs completed lessons count)
-- SELECT 
--     e.course_id,
--     COUNT(lp.id) as lessons_completed_count,
--     (SELECT COUNT(*) FROM public.lessons WHERE course_id = e.course_id) as total_lessons_count,
--     ROUND((COUNT(lp.id)::float / NULLIF((SELECT COUNT(*) FROM public.lessons WHERE course_id = e.course_id), 0)::float) * 100) as computed_percentage
-- FROM public.enrollments e
-- LEFT JOIN public.lessons l ON l.course_id = e.course_id
-- LEFT JOIN public.lesson_progress lp ON lp.lesson_id = l.id AND lp.student_id = e.student_id AND lp.completed = true
-- WHERE e.student_id = 'YOUR_STUDENT_UUID'
-- GROUP BY e.course_id, e.student_id;
