-- Classathi - Plan & Institute Members Migration
-- Run for existing databases. Adds pro/enterprise plans and institute_members.

-- Add plan to institutes
ALTER TABLE institutes ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'pro' CHECK (plan IN ('pro', 'enterprise'));

-- Create institute_members table
CREATE TABLE IF NOT EXISTS institute_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'teacher')),
  name TEXT NOT NULL,
  subject TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(institute_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_members_institute_id ON institute_members(institute_id);
CREATE INDEX IF NOT EXISTS idx_members_user_id ON institute_members(user_id);

-- Add teacher_id to students, payments, whatsapp_logs
ALTER TABLE students ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES institute_members(id) ON DELETE SET NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES institute_members(id) ON DELETE SET NULL;
ALTER TABLE whatsapp_logs ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES institute_members(id) ON DELETE SET NULL;

-- Enable RLS on institute_members
ALTER TABLE institute_members ENABLE ROW LEVEL SECURITY;

-- institute_members RLS
CREATE POLICY "Owners can manage members"
  ON institute_members FOR ALL
  USING (institute_id IN (SELECT id FROM institutes WHERE owner_user_id = auth.uid()))
  WITH CHECK (institute_id IN (SELECT id FROM institutes WHERE owner_user_id = auth.uid()));

CREATE POLICY "Teachers can read members"
  ON institute_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR institute_id IN (SELECT id FROM institutes WHERE owner_user_id = auth.uid())
  );

-- Drop and replace students RLS
DROP POLICY IF EXISTS "Owners can manage students" ON students;
CREATE POLICY "Members can access students"
  ON students FOR ALL
  USING (
    institute_id IN (SELECT institute_id FROM institute_members WHERE user_id = auth.uid())
    AND (
      institute_id IN (SELECT id FROM institutes WHERE owner_user_id = auth.uid())
      OR teacher_id IN (SELECT id FROM institute_members WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    institute_id IN (SELECT institute_id FROM institute_members WHERE user_id = auth.uid())
    AND (
      institute_id IN (SELECT id FROM institutes WHERE owner_user_id = auth.uid())
      OR teacher_id IN (SELECT id FROM institute_members WHERE user_id = auth.uid())
    )
  );

-- Drop and replace payments RLS
DROP POLICY IF EXISTS "Owners can manage payments" ON payments;
CREATE POLICY "Members can access payments"
  ON payments FOR ALL
  USING (
    institute_id IN (SELECT institute_id FROM institute_members WHERE user_id = auth.uid())
    AND (
      institute_id IN (SELECT id FROM institutes WHERE owner_user_id = auth.uid())
      OR teacher_id IN (SELECT id FROM institute_members WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    institute_id IN (SELECT institute_id FROM institute_members WHERE user_id = auth.uid())
    AND (
      institute_id IN (SELECT id FROM institutes WHERE owner_user_id = auth.uid())
      OR teacher_id IN (SELECT id FROM institute_members WHERE user_id = auth.uid())
    )
  );

-- Drop and replace whatsapp_logs RLS
DROP POLICY IF EXISTS "Owners can manage whatsapp_logs" ON whatsapp_logs;
CREATE POLICY "Members can access whatsapp_logs"
  ON whatsapp_logs FOR ALL
  USING (
    institute_id IN (SELECT institute_id FROM institute_members WHERE user_id = auth.uid())
    AND (
      institute_id IN (SELECT id FROM institutes WHERE owner_user_id = auth.uid())
      OR teacher_id IN (SELECT id FROM institute_members WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    institute_id IN (SELECT institute_id FROM institute_members WHERE user_id = auth.uid())
    AND (
      institute_id IN (SELECT id FROM institutes WHERE owner_user_id = auth.uid())
      OR teacher_id IN (SELECT id FROM institute_members WHERE user_id = auth.uid())
    )
  );

-- Update fee_ledger RLS to allow teachers (owner OR teacher with matching student)
DROP POLICY IF EXISTS "Owners can manage fee_ledger" ON fee_ledger;
CREATE POLICY "Members can access fee_ledger"
  ON fee_ledger FOR ALL
  USING (
    institute_id IN (SELECT institute_id FROM institute_members WHERE user_id = auth.uid())
    AND (
      institute_id IN (SELECT id FROM institutes WHERE owner_user_id = auth.uid())
      OR student_id IN (SELECT id FROM students WHERE teacher_id IN (SELECT id FROM institute_members WHERE user_id = auth.uid()))
    )
  )
  WITH CHECK (
    institute_id IN (SELECT institute_id FROM institute_members WHERE user_id = auth.uid())
    AND (
      institute_id IN (SELECT id FROM institutes WHERE owner_user_id = auth.uid())
      OR student_id IN (SELECT id FROM students WHERE teacher_id IN (SELECT id FROM institute_members WHERE user_id = auth.uid()))
    )
  );

-- Update activity_logs RLS to allow teachers
DROP POLICY IF EXISTS "Owners can manage activity_logs" ON activity_logs;
CREATE POLICY "Members can access activity_logs"
  ON activity_logs FOR ALL
  USING (
    institute_id IN (SELECT institute_id FROM institute_members WHERE user_id = auth.uid())
    AND (
      institute_id IN (SELECT id FROM institutes WHERE owner_user_id = auth.uid())
      OR student_id IS NULL
      OR student_id IN (SELECT id FROM students WHERE teacher_id IN (SELECT id FROM institute_members WHERE user_id = auth.uid()))
    )
  )
  WITH CHECK (
    institute_id IN (SELECT institute_id FROM institute_members WHERE user_id = auth.uid())
    AND (
      institute_id IN (SELECT id FROM institutes WHERE owner_user_id = auth.uid())
      OR student_id IS NULL
      OR student_id IN (SELECT id FROM students WHERE teacher_id IN (SELECT id FROM institute_members WHERE user_id = auth.uid()))
    )
  );

-- Backfill: Create owner rows in institute_members for existing institutes
INSERT INTO institute_members (institute_id, user_id, role, name, subject)
SELECT id, owner_user_id, 'owner', name, NULL
FROM institutes
WHERE NOT EXISTS (
  SELECT 1 FROM institute_members im WHERE im.institute_id = institutes.id AND im.user_id = institutes.owner_user_id
);
