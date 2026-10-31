-- ==============================================================================
-- AL-IHSAN LMS: PRODUCTION DATABASE PERFORMANCE & 500+ USER CONCURRENCY INDEXES
-- Run this script in the Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- 1. Classes Table Indexes (Prevents sequential scans on class queries)
CREATE INDEX IF NOT EXISTS idx_classes_student_id 
  ON public.classes(student_id);

CREATE INDEX IF NOT EXISTS idx_classes_teacher_id 
  ON public.classes(teacher_id);

CREATE INDEX IF NOT EXISTS idx_classes_scheduled_at 
  ON public.classes(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_classes_status 
  ON public.classes(status);

-- Composite index for rapid lookup of a student's upcoming/past classes
CREATE INDEX IF NOT EXISTS idx_classes_student_scheduled 
  ON public.classes(student_id, scheduled_at ASC);

-- Composite index for teacher's class roster
CREATE INDEX IF NOT EXISTS idx_classes_teacher_scheduled 
  ON public.classes(teacher_id, scheduled_at ASC);


-- 2. Attendance Table Indexes (Accelerates summary metrics & exports)
CREATE INDEX IF NOT EXISTS idx_attendance_student_id 
  ON public.attendance(student_id);

CREATE INDEX IF NOT EXISTS idx_attendance_class_id 
  ON public.attendance(class_id);

CREATE INDEX IF NOT EXISTS idx_attendance_marked_at 
  ON public.attendance(marked_at DESC);

-- Composite index for rapid attendance history per student
CREATE INDEX IF NOT EXISTS idx_attendance_student_marked 
  ON public.attendance(student_id, marked_at DESC);


-- 3. Student Profiles Table Indexes (Accelerates teacher rosters & admin filters)
CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id 
  ON public.student_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_student_profiles_teacher_id 
  ON public.student_profiles(teacher_id);

CREATE INDEX IF NOT EXISTS idx_student_profiles_enrolment_status 
  ON public.student_profiles(enrolment_status);

CREATE INDEX IF NOT EXISTS idx_student_profiles_year_term 
  ON public.student_profiles(year, term);


-- 4. Teacher Profiles Table Indexes
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_user_id 
  ON public.teacher_profiles(user_id);


-- 5. Profiles Table Indexes (Role-based queries)
CREATE INDEX IF NOT EXISTS idx_profiles_role 
  ON public.profiles(role);


-- ==============================================================================
-- ANALYZE TABLES TO UPDATE QUERY PLANNER STATISTICS IMMEDIATELY
-- ==============================================================================
ANALYZE public.classes;
ANALYZE public.attendance;
ANALYZE public.student_profiles;
ANALYZE public.teacher_profiles;
ANALYZE public.profiles;
