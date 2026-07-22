-- =============================================================
-- 008: Certificados PDF privados
-- O ficheiro não é mais entregue por URL pública. A emissão e o download
-- passam pela Edge Function certificate-files, que valida papel, matrícula
-- e escopo do curso antes de criar URLs assinadas de curta duração.
-- =============================================================

ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS file_name TEXT,
  ADD COLUMN IF NOT EXISTS file_size BIGINT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT;

CREATE INDEX IF NOT EXISTS idx_certificates_student_course ON public.certificates(student_id, course_id);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'certificates',
  'certificates',
  false,
  10485760,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Certificate files are only handled through the Edge Function. Service role
-- bypasses RLS after server-side authorization; no browser policy is created.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'certificate_direct_browser_access'
  ) THEN
    DROP POLICY certificate_direct_browser_access ON storage.objects;
  END IF;
END $$;
