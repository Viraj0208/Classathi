-- Past Papers table
-- Teachers (and owners) upload old exam papers for students to access

CREATE TABLE past_papers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES institute_members(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'image')),
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_past_papers_institute_id ON past_papers(institute_id);
CREATE INDEX idx_past_papers_uploaded_by ON past_papers(uploaded_by);

ALTER TABLE past_papers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can access past_papers"
  ON past_papers FOR ALL
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
