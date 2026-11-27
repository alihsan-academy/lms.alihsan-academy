-- ============================================================
-- AL-IHSAN LMS: SYLLABUS BANK
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.syllabus_files (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  folder        TEXT NOT NULL CHECK (folder IN (
                  'Year 1','Year 2','Year 3','Year 4','Year 5',
                  'Year 6','Year 7','Year 8','Year 9','Year 10',
                  'Miscellaneous'
                )),
  name          TEXT NOT NULL,
  file_url      TEXT NOT NULL,
  storage_path  TEXT NOT NULL,
  file_type     TEXT NOT NULL,   -- e.g. 'pdf', 'image', 'doc'
  file_size     BIGINT,
  uploaded_by   TEXT,            -- admin email
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast folder queries
CREATE INDEX IF NOT EXISTS idx_syllabus_files_folder
  ON public.syllabus_files(folder);

CREATE INDEX IF NOT EXISTS idx_syllabus_files_created_at
  ON public.syllabus_files(created_at DESC);

-- RLS: Enable but allow service-role full access
ALTER TABLE public.syllabus_files ENABLE ROW LEVEL SECURITY;

-- Teachers and students can read all files (read-only)
CREATE POLICY "Teachers and students can read syllabus files"
  ON public.syllabus_files
  FOR SELECT
  USING (true);

-- Only service role can insert/update/delete (handled via API with service key)
-- No additional INSERT/UPDATE/DELETE policies needed — service role bypasses RLS

ANALYZE public.syllabus_files;
