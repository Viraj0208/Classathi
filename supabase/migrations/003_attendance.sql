CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES institute_members(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_institute_id ON attendance(institute_id);
CREATE INDEX IF NOT EXISTS idx_attendance_teacher_id ON attendance(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Owners see all attendance for their institute
-- Teachers see only their own attendance records
CREATE POLICY "Members can access attendance"
  ON attendance FOR ALL
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
