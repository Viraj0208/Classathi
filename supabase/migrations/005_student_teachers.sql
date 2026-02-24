-- Classathi - Student-Teachers (multi-teacher per student) Migration
-- Run after 004_batches.sql

-- ============================================================
-- PART 1: student_teachers junction table
-- ============================================================
CREATE TABLE IF NOT EXISTS student_teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES institute_members(id) ON DELETE CASCADE,
  institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
  monthly_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  fee_due_day INTEGER NOT NULL DEFAULT 1 CHECK (fee_due_day >= 1 AND fee_due_day <= 31),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, teacher_id)
);

CREATE INDEX IF NOT EXISTS idx_student_teachers_student_id
  ON student_teachers(student_id);
CREATE INDEX IF NOT EXISTS idx_student_teachers_teacher_id
  ON student_teachers(teacher_id);
CREATE INDEX IF NOT EXISTS idx_student_teachers_institute_id
  ON student_teachers(institute_id);

-- ============================================================
-- PART 2: RLS
-- ============================================================
ALTER TABLE student_teachers ENABLE ROW LEVEL SECURITY;

-- Owners see all student_teachers for their institute
-- Teachers see only their own rows
CREATE POLICY "Members can access student_teachers"
  ON student_teachers FOR ALL
  USING (
    institute_id IN (
      SELECT institute_id FROM institute_members WHERE user_id = auth.uid()
    )
    AND (
      institute_id IN (
        SELECT id FROM institutes WHERE owner_user_id = auth.uid()
      )
      OR teacher_id IN (
        SELECT id FROM institute_members WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    institute_id IN (
      SELECT institute_id FROM institute_members WHERE user_id = auth.uid()
    )
    AND (
      institute_id IN (
        SELECT id FROM institutes WHERE owner_user_id = auth.uid()
      )
      OR teacher_id IN (
        SELECT id FROM institute_members WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================
-- PART 3: Backfill existing students into student_teachers
-- ============================================================
INSERT INTO student_teachers (student_id, teacher_id, institute_id, monthly_fee, fee_due_day)
SELECT
  s.id,
  s.teacher_id,
  s.institute_id,
  COALESCE(s.monthly_fee, 0),
  COALESCE(s.fee_due_day, 1)
FROM students s
WHERE s.teacher_id IS NOT NULL
ON CONFLICT (student_id, teacher_id) DO NOTHING;

-- ============================================================
-- PART 4: Add teacher_id column to fee_ledger for per-teacher entries
-- ============================================================
ALTER TABLE fee_ledger ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES institute_members(id) ON DELETE SET NULL;

-- Drop old unique constraint (one entry per student per month)
-- and replace with one that allows one entry per student per teacher per month
ALTER TABLE fee_ledger DROP CONSTRAINT IF EXISTS fee_ledger_institute_id_student_id_month_key;
ALTER TABLE fee_ledger ADD CONSTRAINT fee_ledger_student_teacher_month_key
  UNIQUE(institute_id, student_id, teacher_id, month);

CREATE INDEX IF NOT EXISTS idx_fee_ledger_teacher_id ON fee_ledger(teacher_id);
