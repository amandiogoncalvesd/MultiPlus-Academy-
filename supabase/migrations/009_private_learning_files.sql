-- =============================================================
-- 009: Arquivos privados de materiais e submissões de aluno
-- =============================================================

ALTER TABLE public.materials
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS file_name TEXT,
  ADD COLUMN IF NOT EXISTS file_size BIGINT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT;

ALTER TABLE public.assignment_submissions
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS file_name TEXT,
  ADD COLUMN IF NOT EXISTS file_size BIGINT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB NOT NULL DEFAULT '{"in_app": true, "email_certificates": false}'::jsonb;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES
  ('course-materials', 'course-materials', false, 52428800),
  ('student-submissions', 'student-submissions', false, 52428800)
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = EXCLUDED.file_size_limit;

CREATE INDEX IF NOT EXISTS idx_materials_storage_path ON public.materials(storage_path) WHERE storage_path IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_storage_path ON public.assignment_submissions(storage_path) WHERE storage_path IS NOT NULL;
