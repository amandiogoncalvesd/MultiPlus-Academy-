-- =============================================================
-- 013: Pontuação automática por rubrica e anexos privados do fórum
-- =============================================================

CREATE OR REPLACE FUNCTION public.calculate_rubric_score(p_scores JSONB)
RETURNS NUMERIC
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT COALESCE(SUM((entry.value->>'score')::NUMERIC), 0)
  FROM jsonb_each(COALESCE(p_scores, '{}'::jsonb)) AS entry;
$$;

CREATE OR REPLACE FUNCTION public.apply_rubric_score_to_grade_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.rubric_scores IS NOT NULL AND NEW.rubric_scores <> '{}'::jsonb THEN
    NEW.score := public.calculate_rubric_score(NEW.rubric_scores);
  END IF;
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_rubric_score_to_grade_entry ON public.grade_entries;
CREATE TRIGGER trg_apply_rubric_score_to_grade_entry
BEFORE INSERT OR UPDATE OF rubric_scores ON public.grade_entries
FOR EACH ROW EXECUTE FUNCTION public.apply_rubric_score_to_grade_entry();

CREATE TABLE IF NOT EXISTS public.discussion_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES public.discussion_threads(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.discussion_posts(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL CHECK (file_size >= 0 AND file_size <= 20971520),
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT discussion_attachments_parent_check CHECK (
    (thread_id IS NOT NULL AND post_id IS NULL)
    OR (thread_id IS NULL AND post_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_discussion_attachments_thread ON public.discussion_attachments(thread_id);
CREATE INDEX IF NOT EXISTS idx_discussion_attachments_post ON public.discussion_attachments(post_id);

ALTER TABLE public.discussion_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY discussion_attachments_select_scoped ON public.discussion_attachments
  FOR SELECT TO authenticated
  USING (
    (thread_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.discussion_threads t
      JOIN public.discussion_forums f ON f.id = t.forum_id
      WHERE t.id = discussion_attachments.thread_id AND public.can_view_section(f.section_id)
    ))
    OR (post_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.discussion_posts p
      JOIN public.discussion_threads t ON t.id = p.thread_id
      JOIN public.discussion_forums f ON f.id = t.forum_id
      WHERE p.id = discussion_attachments.post_id AND public.can_view_section(f.section_id)
    ))
  );

INSERT INTO storage.buckets (id, name, public)
VALUES ('discussion-attachments', 'discussion-attachments', false)
ON CONFLICT (id) DO UPDATE SET public = false;
