-- DATABASE MIGRATE / INITIAL SCHEMA: MULTIPLUS ACADEMY
-- Target platform: Supabase PostgreSQL (auth-integrated)

-- 1. Create public.users table (links to Supabase Auth auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    nome_completo TEXT,
    telefone TEXT,
    foto_perfil TEXT,
    role TEXT CHECK (role IN ('ADMIN', 'PROFESSOR', 'ALUNO')) DEFAULT 'ALUNO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create public.profiles table (detailed academic metadata)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    biografia TEXT,
    data_nascimento DATE,
    endereco TEXT,
    nivel_ingles TEXT,
    objetivos TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create public.courses table
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    descricao TEXT,
    imagem TEXT,
    categoria TEXT,
    duracao TEXT,
    status TEXT CHECK (status IN ('ACTIVE', 'DRAFT', 'ARCHIVED')) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create public.enrollments table (linking students with courses)
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    status TEXT CHECK (status IN ('ACTIVE', 'COMPLETED', 'SUSPENDED')) DEFAULT 'ACTIVE',
    data_inicio TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (student_id, course_id)
);

-- 5. Create public.lessons table
CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    titulo TEXT NOT NULL,
    descricao TEXT,
    video_url TEXT,
    ordem INTEGER NOT NULL,
    duracao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create public.materials table (files annexed under lessons)
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
    titulo TEXT NOT NULL,
    arquivo_url TEXT NOT NULL,
    tipo TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Create public.messages table (academic communication log)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    texto TEXT NOT NULL,
    lido BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Create public.announcements table (board announcements)
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    titulo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    destinatarios TEXT CHECK (destinatarios IN ('ALL', 'ALUNO', 'PROFESSOR')) DEFAULT 'ALL' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Create public.certificates table (academic validations)
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    codigo_validacao TEXT UNIQUE NOT NULL,
    emitido_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS for all newly created tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Helper SQL Function: Fetch active custom user role safely
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Users Table Policies:
-- 1. All authenticated users can read basic information
CREATE POLICY "Permitir leitura de utilizadores para todos" 
ON public.users FOR SELECT 
USING (true);

-- 2. Authenticated user can initialize their profile record
CREATE POLICY "Permitir insercao da propria conta auth" 
ON public.users FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 3. Authenticated user can change their profile details, admins can manage all
CREATE POLICY "Permitir atualizacao da propria conta ou administador" 
ON public.users FOR UPDATE 
USING (auth.uid() = id OR public.get_user_role(auth.uid()) = 'ADMIN');

-- 4. Admins are permitted full deletion tasks
CREATE POLICY "Permitir remocao total para admins" 
ON public.users FOR DELETE 
USING (public.get_user_role(auth.uid()) = 'ADMIN');


-- Profiles Table Policies:
CREATE POLICY "Leitura livre de perfis academicos" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Insercao de perfil proprio" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Atualizacao de perfil de si proprio ou por admin" ON public.profiles FOR UPDATE USING (auth.uid() = user_id OR public.get_user_role(auth.uid()) = 'ADMIN');
CREATE POLICY "Remocao de perfis por admin" ON public.profiles FOR DELETE USING (public.get_user_role(auth.uid()) = 'ADMIN');


-- Courses Table Policies:
CREATE POLICY "Cursos sao visiveis publicamente" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Cursos administrados por formadores ou admins" ON public.courses FOR ALL USING (public.get_user_role(auth.uid()) IN ('PROFESSOR', 'ADMIN'));


-- Enrollments Table Policies:
CREATE POLICY "Alunos visualizam suas matriculas, admins/professores visualizam tudo" 
ON public.enrollments FOR SELECT 
USING (auth.uid() = student_id OR public.get_user_role(auth.uid()) IN ('PROFESSOR', 'ADMIN'));

CREATE POLICY "Controle de matricula por professores ou admins" 
ON public.enrollments FOR ALL 
USING (public.get_user_role(auth.uid()) IN ('PROFESSOR', 'ADMIN') OR auth.uid() = student_id);


-- Lessons Table Policies:
CREATE POLICY "Leitura de aulas para matriculados ou docentes" 
ON public.lessons FOR SELECT 
USING (
    public.get_user_role(auth.uid()) IN ('PROFESSOR', 'ADMIN') OR 
    EXISTS (SELECT 1 FROM public.enrollments WHERE student_id = auth.uid() AND course_id = lessons.course_id)
);

CREATE POLICY "Docentes ou administradores gerenciam aulas" 
ON public.lessons FOR ALL 
USING (public.get_user_role(auth.uid()) IN ('PROFESSOR', 'ADMIN'));


-- Materials Table Policies:
CREATE POLICY "Leitura de materiais se matriculado na aula ou docente" 
ON public.materials FOR SELECT 
USING (
    public.get_user_role(auth.uid()) IN ('PROFESSOR', 'ADMIN') OR 
    EXISTS (
        SELECT 1 FROM public.lessons l 
        JOIN public.enrollments e ON e.course_id = l.course_id 
        WHERE l.id = materials.lesson_id AND e.student_id = auth.uid()
    )
);

CREATE POLICY "Docentes ou administradores gerenciam materiais" 
ON public.materials FOR ALL 
USING (public.get_user_role(auth.uid()) IN ('PROFESSOR', 'ADMIN'));


-- Messages Table Policies:
CREATE POLICY "Leitura das proprias mensagens enviadas ou recebidas" 
ON public.messages FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR public.get_user_role(auth.uid()) = 'ADMIN');

CREATE POLICY "Enviar mensagem de forma autorizada" 
ON public.messages FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Marcar mensagem lida" 
ON public.messages FOR UPDATE 
USING (auth.uid() = receiver_id OR auth.uid() = sender_id);


-- Announcements Table Policies:
CREATE POLICY "Leitura de avisos direcionados ou geral" 
ON public.announcements FOR SELECT 
USING (
    destinatarios = 'ALL' OR 
    destinatarios = public.get_user_role(auth.uid()) OR 
    public.get_user_role(auth.uid()) = 'ADMIN'
);

CREATE POLICY "Avisos criados por docentes ou administradores" 
ON public.announcements FOR ALL 
USING (public.get_user_role(auth.uid()) IN ('PROFESSOR', 'ADMIN'));


-- Certificates Table Policies:
CREATE POLICY "Ver certificados do proprio formando, professores, adm" 
ON public.certificates FOR SELECT 
USING (auth.uid() = student_id OR public.get_user_role(auth.uid()) IN ('PROFESSOR', 'ADMIN'));

CREATE POLICY "Criar certificados por professores, adm" 
ON public.certificates FOR ALL 
USING (public.get_user_role(auth.uid()) IN ('PROFESSOR', 'ADMIN'));


-- =========================================================================
-- AUTOMATIC AUTH PROFILE CREATION SYNC
-- =========================================================================

-- Create trigger function to mirror Supabase Auth user register directly inside public.users and public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, nome_completo, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'nome_completo', COALESCE(new.raw_user_meta_data->>'firstName', '') || ' ' || COALESCE(new.raw_user_meta_data->>'lastName', ''), new.email),
    COALESCE(new.raw_user_meta_data->>'role', 'ALUNO')
  );
  
  INSERT INTO public.profiles (user_id)
  VALUES (new.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Map trigger on auth.users inserts
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================================
-- CREATE COMPREHENSIVE PERFORMANCE INDEXES
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_course ON public.lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_materials_lesson ON public.materials(lesson_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_certificates_student ON public.certificates(student_id);
