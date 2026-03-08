-- Batches table
CREATE TABLE IF NOT EXISTS batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES institute_members(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('group', 'one_to_one')),
  session_fee DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_batches_institute_id ON batches(institute_id);
CREATE INDEX IF NOT EXISTS idx_batches_teacher_id ON batches(teacher_id);

-- Student-batch join table (many-to-many)
CREATE TABLE IF NOT EXISTS student_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, batch_id)
);

CREATE INDEX IF NOT EXISTS idx_student_batches_student_id ON student_batches(student_id);
CREATE INDEX IF NOT EXISTS idx_student_batches_batch_id ON student_batches(batch_id);

-- Add batch_id to attendance (nullable for backward compat)
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES batches(id) ON DELETE SET NULL;

-- RLS for batches
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can access batches"
  ON batches FOR ALL
  USING (
    institute_id IN (
      SELECT institute_id FROM institute_members WHERE user_id = auth.uid()
    )
    AND (
      institute_id IN (SELECT id FROM institutes WHERE owner_user_id = auth.uid())
      OR teacher_id IN (SELECT id FROM institute_members WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    institute_id IN (
      SELECT institute_id FROM institute_members WHERE user_id = auth.uid()
    )
    AND (
      institute_id IN (SELECT id FROM institutes WHERE owner_user_id = auth.uid())
      OR teacher_id IN (SELECT id FROM institute_members WHERE user_id = auth.uid())
    )
  );

-- RLS for student_batches
ALTER TABLE student_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can access student_batches"
  ON student_batches FOR ALL
  USING (
    institute_id IN (
      SELECT institute_id FROM institute_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    institute_id IN (
      SELECT institute_id FROM institute_members WHERE user_id = auth.uid()
    )
  );
