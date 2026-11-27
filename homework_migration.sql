-- Homework Assignments Table Migration
-- Run this in Supabase Dashboard -> SQL Editor

CREATE TABLE IF NOT EXISTS public.homework_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL,
  teacher_id uuid NOT NULL,
  student_id uuid NOT NULL,
  group_id text,
  class_title text,
  title text NOT NULL,
  instructions text,
  due_date date,
  attachment_url text,
  attachment_name text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'needs_revision', 'reviewed')),
  student_response text,
  submission_file_url text,
  submission_file_name text,
  submitted_at timestamptz,
  teacher_feedback text,
  grade text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_homework_student_status ON public.homework_assignments (student_id, status);
CREATE INDEX IF NOT EXISTS idx_homework_teacher_status ON public.homework_assignments (teacher_id, status);
CREATE INDEX IF NOT EXISTS idx_homework_class_id ON public.homework_assignments (class_id);

ALTER TABLE public.homework_assignments ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own homework rows (API uses service role for writes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'homework_assignments' AND policyname = 'homework_select_own'
  ) THEN
    CREATE POLICY homework_select_own ON public.homework_assignments
      FOR SELECT
      TO authenticated
      USING (auth.uid() = student_id OR auth.uid() = teacher_id);
  END IF;
END $$;
