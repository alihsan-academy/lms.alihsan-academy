-- ============================================================
-- AL-IHSAN LMS: QURAN & HIFZ ASSIGNMENTS MODULE
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.quran_assignments (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_name      TEXT,
  class_name        TEXT,
  assignment_type   TEXT NOT NULL DEFAULT 'hifz' CHECK (assignment_type IN ('hifz', 'reading', 'tajweed')),
  surah_number      INT NOT NULL CHECK (surah_number BETWEEN 1 AND 114),
  surah_name_en     TEXT NOT NULL,
  surah_name_ar     TEXT NOT NULL,
  from_ayah         INT NOT NULL CHECK (from_ayah >= 1),
  to_ayah           INT NOT NULL CHECK (to_ayah >= from_ayah),
  default_reciter   TEXT DEFAULT 'Husary_Muallim_128kbps',
  target_repeats    INT DEFAULT 3 CHECK (target_repeats BETWEEN 1 AND 15),
  teacher_note      TEXT,
  due_date          TIMESTAMPTZ,
  status            TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'practicing', 'completed')),
  listened_count    INT DEFAULT 0,
  last_practiced_at TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_quran_assignments_student_id
  ON public.quran_assignments(student_id, status);

CREATE INDEX IF NOT EXISTS idx_quran_assignments_teacher_id
  ON public.quran_assignments(teacher_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quran_assignments_due_date
  ON public.quran_assignments(due_date);

-- Enable RLS
ALTER TABLE public.quran_assignments ENABLE ROW LEVEL SECURITY;

-- Students can read their own assignments
CREATE POLICY "Students can read their own assignments"
  ON public.quran_assignments
  FOR SELECT
  USING (auth.uid() = student_id);

-- Teachers can read assignments they created
CREATE POLICY "Teachers can read their created assignments"
  ON public.quran_assignments
  FOR SELECT
  USING (auth.uid() = teacher_id);

-- Teachers can insert assignments
CREATE POLICY "Teachers can insert assignments"
  ON public.quran_assignments
  FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

-- Teachers can update their assignments
CREATE POLICY "Teachers can update their assignments"
  ON public.quran_assignments
  FOR UPDATE
  USING (auth.uid() = teacher_id);

-- Teachers can delete their assignments
CREATE POLICY "Teachers can delete their assignments"
  ON public.quran_assignments
  FOR DELETE
  USING (auth.uid() = teacher_id);

-- Students can update practice/completion status of their own assignments
CREATE POLICY "Students can update their assignment practice progress"
  ON public.quran_assignments
  FOR UPDATE
  USING (auth.uid() = student_id);

ANALYZE public.quran_assignments;
