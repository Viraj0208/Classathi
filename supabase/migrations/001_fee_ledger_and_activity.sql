-- Classathi - Fee Ledger & Activity Logs Migration
-- Run after initial schema. Does NOT drop existing tables.

-- ============================================================
-- PART 1: fee_ledger table
-- ============================================================
CREATE TABLE IF NOT EXISTS fee_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  amount_due DECIMAL(10, 2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(institute_id, student_id, month)
);

CREATE INDEX IF NOT EXISTS idx_fee_ledger_institute_id ON fee_ledger(institute_id);
CREATE INDEX IF NOT EXISTS idx_fee_ledger_student_id ON fee_ledger(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_ledger_month ON fee_ledger(month);

-- ============================================================
-- Update payments table
-- ============================================================
ALTER TABLE payments ADD COLUMN IF NOT EXISTS ledger_id UUID REFERENCES fee_ledger(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'razorpay' CHECK (source IN ('razorpay', 'manual'));

-- ============================================================
-- PART 4: activity_logs table
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('reminder_sent', 'payment_received', 'manual_payment', 'broadcast_sent')),
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_institute_id ON activity_logs(institute_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- ============================================================
-- PART 7: RLS for new tables
-- ============================================================
ALTER TABLE fee_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage fee_ledger"
  ON fee_ledger FOR ALL
  USING (
    institute_id IN (SELECT id FROM institutes WHERE owner_user_id = auth.uid())
  )
  WITH CHECK (
    institute_id IN (SELECT id FROM institutes WHERE owner_user_id = auth.uid())
  );

CREATE POLICY "Owners can manage activity_logs"
  ON activity_logs FOR ALL
  USING (
    institute_id IN (SELECT id FROM institutes WHERE owner_user_id = auth.uid())
  )
  WITH CHECK (
    institute_id IN (SELECT id FROM institutes WHERE owner_user_id = auth.uid())
  );
