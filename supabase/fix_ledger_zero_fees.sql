-- One-time fix: Update existing fee_ledger entries that have amount_due = 0
-- but should have the actual fee from student_teachers.
-- Run this in Supabase SQL Editor after deploying the code fixes.

-- Fix ledger entries that have a matching teacher_id
UPDATE fee_ledger fl
SET amount_due = st.monthly_fee
FROM student_teachers st
WHERE fl.student_id = st.student_id
  AND fl.teacher_id = st.teacher_id
  AND fl.amount_due = 0
  AND st.monthly_fee > 0;

-- Fix ledger entries without teacher_id (created before migration 005)
-- using the first matching student_teacher record
UPDATE fee_ledger fl
SET amount_due = sub.monthly_fee,
    teacher_id = sub.teacher_id
FROM (
  SELECT DISTINCT ON (student_id)
    student_id,
    teacher_id,
    monthly_fee
  FROM student_teachers
  WHERE monthly_fee > 0
  ORDER BY student_id, created_at ASC
) sub
WHERE fl.student_id = sub.student_id
  AND fl.teacher_id IS NULL
  AND fl.amount_due = 0;
