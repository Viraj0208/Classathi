-- Classathi - Robustness Improvements Migration
-- Addresses: RLS gaps, payment state machine, WhatsApp opt-out, idempotency
-- Run after 006_whatsapp_wamid.sql

-- ============================================================
-- PART 1: Fix fee_ledger RLS — allow teachers to access their own entries
-- ============================================================
CREATE POLICY "Teachers can access own fee_ledger"
  ON fee_ledger FOR ALL
  USING (
    teacher_id IN (
      SELECT id FROM institute_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    teacher_id IN (
      SELECT id FROM institute_members WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- PART 2: Fix students RLS — use student_teachers junction table
--         instead of the legacy students.teacher_id column
-- ============================================================
DROP POLICY IF EXISTS "Members can access students" ON students;

-- Owners: full access to all students in their institute
CREATE POLICY "Owners can access students"
  ON students FOR ALL
  USING (
    institute_id IN (
      SELECT id FROM institutes WHERE owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    institute_id IN (
      SELECT id FROM institutes WHERE owner_user_id = auth.uid()
    )
  );

-- Teachers: access students they are linked to via student_teachers
CREATE POLICY "Teachers can access own students"
  ON students FOR SELECT
  USING (
    id IN (
      SELECT st.student_id FROM student_teachers st
      JOIN institute_members im ON st.teacher_id = im.id
      WHERE im.user_id = auth.uid()
    )
  );

-- Teachers: can insert/update students in their institute
CREATE POLICY "Teachers can manage own students"
  ON students FOR INSERT
  WITH CHECK (
    institute_id IN (
      SELECT institute_id FROM institute_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update own students"
  ON students FOR UPDATE
  USING (
    id IN (
      SELECT st.student_id FROM student_teachers st
      JOIN institute_members im ON st.teacher_id = im.id
      WHERE im.user_id = auth.uid()
    )
  )
  WITH CHECK (
    institute_id IN (
      SELECT institute_id FROM institute_members WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- PART 3: Payment status state machine
--         Expand from (pending, paid) to full lifecycle
-- ============================================================
-- Step 1: Drop old constraint so we can migrate data
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;

-- Step 2: Migrate existing 'paid' rows to 'captured' BEFORE adding the new constraint
UPDATE payments SET status = 'captured' WHERE status = 'paid';

-- Step 3: Add new constraint with full lifecycle statuses
ALTER TABLE payments ADD CONSTRAINT payments_status_check
  CHECK (status IN ('pending', 'captured', 'failed', 'refunded', 'expired'));

-- Add razorpay_event_id for webhook idempotency
ALTER TABLE payments ADD COLUMN IF NOT EXISTS razorpay_event_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_razorpay_event_id
  ON payments(razorpay_event_id) WHERE razorpay_event_id IS NOT NULL;

-- Add razorpay_payment_id to track the actual Razorpay payment
ALTER TABLE payments ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;

-- ============================================================
-- PART 4: WhatsApp opt-out management
-- ============================================================
ALTER TABLE students ADD COLUMN IF NOT EXISTS whatsapp_opt_out BOOLEAN NOT NULL DEFAULT false;

-- ============================================================
-- PART 4b: Expand payments source constraint to include 'session'
-- ============================================================
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_source_check;
ALTER TABLE payments ADD CONSTRAINT payments_source_check
  CHECK (source IN ('razorpay', 'manual', 'session'));

-- ============================================================
-- PART 5: Activity log type expansion for new payment statuses
-- ============================================================
ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS activity_logs_type_check;
ALTER TABLE activity_logs ADD CONSTRAINT activity_logs_type_check
  CHECK (type IN (
    'reminder_sent', 'payment_received', 'manual_payment',
    'broadcast_sent', 'payment_failed', 'payment_refunded',
    'payment_expired'
  ));

-- ============================================================
-- PART 6: Fix payments RLS — use student_teachers for teachers
-- ============================================================
DROP POLICY IF EXISTS "Members can access payments" ON payments;

CREATE POLICY "Owners can access payments"
  ON payments FOR ALL
  USING (
    institute_id IN (
      SELECT id FROM institutes WHERE owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    institute_id IN (
      SELECT id FROM institutes WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can access own payments"
  ON payments FOR ALL
  USING (
    teacher_id IN (
      SELECT id FROM institute_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    teacher_id IN (
      SELECT id FROM institute_members WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- PART 7: Fix whatsapp_logs RLS — same pattern
-- ============================================================
DROP POLICY IF EXISTS "Members can access whatsapp_logs" ON whatsapp_logs;

CREATE POLICY "Owners can access whatsapp_logs"
  ON whatsapp_logs FOR ALL
  USING (
    institute_id IN (
      SELECT id FROM institutes WHERE owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    institute_id IN (
      SELECT id FROM institutes WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can access own whatsapp_logs"
  ON whatsapp_logs FOR ALL
  USING (
    teacher_id IN (
      SELECT id FROM institute_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    teacher_id IN (
      SELECT id FROM institute_members WHERE user_id = auth.uid()
    )
  );
