-- =============================================================
-- 005: Reconciliação do schema usado pela aplicação React/Supabase
--
-- Esta migration é aditiva e pode ser aplicada sobre bancos que já
-- receberam as migrations 001–004. Ela elimina referências do código
-- a tabelas/colunas sem definition versionada.
--
-- A revisão de autorização fina (RLS por curso, matrícula e papel) é
-- feita na migration de segurança subsequente. As policies abaixo são
-- apenas o mínimo necessário e compatível para as novas entidades.
-- =============================================================

-- -----------------------------------------------------------------
-- 1. Colunas que o frontend já consome
-- -----------------------------------------------------------------
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS notif_email_certificados BOOLEAN NOT NULL DEFAULT false;

UPDATE public.users
SET status = 'ACTIVE'
WHERE status IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_status_check'
      AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_status_check
      CHECK (status IN ('ACTIVE', 'SUSPENDED', 'INACTIVE'));
  END IF;
END $$;

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS price NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS data_inicio TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  ADD COLUMN IF NOT EXISTS progress_percent INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES public.modules(id) ON DELETE SET NULL;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'info',
  ADD COLUMN IF NOT EXISTS link TEXT;

ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS final_grade NUMERIC(5, 2),
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS revoked_reason TEXT;

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'SENT',
  ADD COLUMN IF NOT EXISTS forwarded_from UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS voice_data JSONB;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'messages_status_check'
      AND conrelid = 'public.messages'::regclass
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_status_check
      CHECK (status IN ('SENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED'));
  END IF;
END $$;

-- -----------------------------------------------------------------
-- 2. Entidades do website e configuração institucional
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  modalidade TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT applications_status_check CHECK (status IN ('PENDING', 'CONTACTED', 'APPROVED', 'REJECTED', 'ARCHIVED'))
);

CREATE TABLE IF NOT EXISTS public.institution_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  nome TEXT NOT NULL DEFAULT 'MultiPlus Academy',
  dominio TEXT,
  contacto TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

INSERT INTO public.institution_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- -----------------------------------------------------------------
-- 3. Entidades persistentes utilizadas pelo chat e presença
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_presence (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'OFFLINE',
  typing_in_conversation UUID REFERENCES public.users(id) ON DELETE SET NULL,
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT user_presence_status_check CHECK (status IN ('ONLINE', 'OFFLINE', 'TYPING', 'AWAY'))
);

CREATE TABLE IF NOT EXISTS public.message_deletions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (user_id, message_id)
);

CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  emoji TEXT NOT NULL CHECK (char_length(emoji) BETWEEN 1 AND 32),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (message_id, user_id, emoji)
);

CREATE TABLE IF NOT EXISTS public.pinned_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_key TEXT NOT NULL,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  pinned_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (conversation_key, message_id)
);

CREATE TABLE IF NOT EXISTS public.chat_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'audio', 'document', 'voice')),
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL CHECK (file_size >= 0),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  width INTEGER,
  height INTEGER,
  duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- -----------------------------------------------------------------
-- 4. Índices para as consultas já usadas na interface
-- -----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_applications_status_created_at ON public.applications(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_status ON public.enrollments(student_id, status);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_status ON public.enrollments(course_id, status);
CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON public.lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created_at ON public.notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_at ON public.messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread ON public.messages(receiver_id, lido, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_media_message_id ON public.chat_media(message_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id, created_at DESC);

-- -----------------------------------------------------------------
-- 5. RLS mínimo para as novas tabelas
-- -----------------------------------------------------------------
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_deletions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pinned_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_media ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Candidatura pública: somente inserir; leitura/gestão será administrativa.
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'applications' AND policyname = 'applications_public_insert') THEN
    CREATE POLICY applications_public_insert ON public.applications FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'applications' AND policyname = 'applications_admin_select') THEN
    CREATE POLICY applications_admin_select ON public.applications FOR SELECT USING (public.get_user_role(auth.uid()) = 'ADMIN');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'institution_settings' AND policyname = 'institution_settings_staff_select') THEN
    CREATE POLICY institution_settings_staff_select ON public.institution_settings FOR SELECT USING (public.get_user_role(auth.uid()) IN ('ADMIN', 'PROFESSOR'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'institution_settings' AND policyname = 'institution_settings_admin_manage') THEN
    CREATE POLICY institution_settings_admin_manage ON public.institution_settings FOR ALL USING (public.get_user_role(auth.uid()) = 'ADMIN') WITH CHECK (public.get_user_role(auth.uid()) = 'ADMIN');
  END IF;

  -- Logs são escritos por Edge Functions/admin service role. A interface só pode ler se for admin.
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'audit_logs' AND policyname = 'audit_logs_admin_select') THEN
    CREATE POLICY audit_logs_admin_select ON public.audit_logs FOR SELECT USING (public.get_user_role(auth.uid()) = 'ADMIN');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_presence' AND policyname = 'presence_authenticated_select') THEN
    CREATE POLICY presence_authenticated_select ON public.user_presence FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_presence' AND policyname = 'presence_own_insert') THEN
    CREATE POLICY presence_own_insert ON public.user_presence FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_presence' AND policyname = 'presence_own_update') THEN
    CREATE POLICY presence_own_update ON public.user_presence FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'message_deletions' AND policyname = 'message_deletions_own_manage') THEN
    CREATE POLICY message_deletions_own_manage ON public.message_deletions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'message_reactions' AND policyname = 'message_reactions_participant_select') THEN
    CREATE POLICY message_reactions_participant_select ON public.message_reactions FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.messages m WHERE m.id = message_id AND auth.uid() IN (m.sender_id, m.receiver_id))
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'message_reactions' AND policyname = 'message_reactions_own_insert') THEN
    CREATE POLICY message_reactions_own_insert ON public.message_reactions FOR INSERT WITH CHECK (
      auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.messages m WHERE m.id = message_id AND auth.uid() IN (m.sender_id, m.receiver_id))
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'message_reactions' AND policyname = 'message_reactions_own_delete') THEN
    CREATE POLICY message_reactions_own_delete ON public.message_reactions FOR DELETE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pinned_messages' AND policyname = 'pinned_messages_own_manage') THEN
    CREATE POLICY pinned_messages_own_manage ON public.pinned_messages FOR ALL USING (auth.uid() = pinned_by) WITH CHECK (auth.uid() = pinned_by);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'chat_media' AND policyname = 'chat_media_participant_select') THEN
    CREATE POLICY chat_media_participant_select ON public.chat_media FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.messages m WHERE m.id = message_id AND auth.uid() IN (m.sender_id, m.receiver_id))
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'chat_media' AND policyname = 'chat_media_sender_insert') THEN
    CREATE POLICY chat_media_sender_insert ON public.chat_media FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM public.messages m WHERE m.id = message_id AND m.sender_id = auth.uid())
    );
  END IF;
END $$;

-- -----------------------------------------------------------------
-- 6. Buckets compatíveis com o frontend atual
--
-- `media` e `chat-media` ainda são públicos porque o cliente atual grava
-- URLs públicas. A próxima fase migra certificados e materiais sensíveis
-- para buckets privados + signed URLs, sem quebrar o deploy em andamento.
-- -----------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES
  ('media', 'media', true, 52428800),
  ('avatars', 'avatars', true, 5242880),
  ('chat-media', 'chat-media', true, 52428800)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'legacy_media_authenticated_insert') THEN
    CREATE POLICY legacy_media_authenticated_insert ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id IN ('media', 'avatars', 'chat-media'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'legacy_media_owner_delete') THEN
    CREATE POLICY legacy_media_owner_delete ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id IN ('media', 'avatars', 'chat-media') AND owner_id = auth.uid());
  END IF;
END $$;

-- Realtime is required by notifications, messages and presence subscriptions.
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
