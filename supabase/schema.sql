-- Classathi - Multi-tenant SaaS Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- institutes table
CREATE TABLE institutes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_user_id)
);

-- students table
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  parent_name TEXT NOT NULL,
  parent_phone TEXT NOT NULL,
  monthly_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  fee_due_day INTEGER NOT NULL CHECK (fee_due_day >= 1 AND fee_due_day <= 31),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_link_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- whatsapp_logs table
CREATE TABLE whatsapp_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('fee', 'homework', 'absent', 'test')),
  status TEXT NOT NULL DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_students_institute_id ON students(institute_id);
CREATE INDEX idx_payments_institute_id ON payments(institute_id);
CREATE INDEX idx_payments_student_id ON payments(student_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);
CREATE INDEX idx_whatsapp_logs_institute_id ON whatsapp_logs(institute_id);

-- Row Level Security (RLS)
ALTER TABLE institutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own institute data

-- institutes: owner can do everything on their institute
CREATE POLICY "Owners can manage own institute"
  ON institutes FOR ALL
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

-- students: owner can manage students of their institute
CREATE POLICY "Owners can manage students"
  ON students FOR ALL
  USING (
    institute_id IN (SELECT id FROM institutes WHERE owner_user_id = auth.uid())
  )
  WITH CHECK (
    institute_id IN (SELECT id FROM institutes WHERE owner_user_id = auth.uid())
  );

-- payments: owner can manage payments of their institute
CREATE POLICY "Owners can manage payments"
  ON payments FOR ALL
  USING (
    institute_id IN (SELECT id FROM institutes WHERE owner_user_id = auth.uid())
  )
  WITH CHECK (
    institute_id IN (SELECT id FROM institutes WHERE owner_user_id = auth.uid())
  );

-- whatsapp_logs: owner can manage logs of their institute
CREATE POLICY "Owners can manage whatsapp_logs"
  ON whatsapp_logs FOR ALL
  USING (
    institute_id IN (SELECT id FROM institutes WHERE owner_user_id = auth.uid())
  )
  WITH CHECK (
    institute_id IN (SELECT id FROM institutes WHERE owner_user_id = auth.uid())
  );

-- Enable RLS for service role (bypass) - webhooks need to insert
-- Razorpay webhook runs with service role, so it bypasses RLS
-- For API routes using anon key with user session, RLS applies
