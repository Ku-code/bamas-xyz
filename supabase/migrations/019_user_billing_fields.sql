-- ============================================
-- USER BILLING FIELDS
-- Migration 019: Add billing status and payment tracking
-- ============================================
-- Every member must pay their yearly subscription fee
-- Track: payment status, amount, date, due date (1 year from payment)
-- ============================================

-- Add billing status enum type
DO $$ BEGIN
  CREATE TYPE billing_status AS ENUM ('paid', 'pending', 'overdue', 'exempt');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add billing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS billing_status billing_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS billing_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS billing_currency VARCHAR(3) DEFAULT 'BGN',
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS billing_due_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS invoice_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);

-- Create index for billing queries
CREATE INDEX IF NOT EXISTS idx_users_billing_status ON users(billing_status);
CREATE INDEX IF NOT EXISTS idx_users_billing_due_date ON users(billing_due_date);

-- ============================================
-- BILLING HISTORY TABLE
-- ============================================
-- Track all payments for audit purposes

CREATE TABLE IF NOT EXISTS billing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BGN',
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  payment_method VARCHAR(50),
  invoice_id VARCHAR(100),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on billing_history
ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;

-- Policies for billing_history
CREATE POLICY "Users can view own billing history"
  ON billing_history FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'admin')
    )
  );

CREATE POLICY "Admins can insert billing records"
  ON billing_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'admin')
    )
  );

CREATE POLICY "Admins can update billing records"
  ON billing_history FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'admin')
    )
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to record a payment and update user billing status
CREATE OR REPLACE FUNCTION record_payment(
  p_user_id UUID,
  p_amount DECIMAL(10,2),
  p_currency VARCHAR(3) DEFAULT 'BGN',
  p_payment_method VARCHAR(50) DEFAULT NULL,
  p_invoice_id VARCHAR(100) DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_billing_id UUID;
  v_period_start TIMESTAMPTZ := NOW();
  v_period_end TIMESTAMPTZ := NOW() + INTERVAL '1 year';
BEGIN
  -- Insert billing history record
  INSERT INTO billing_history (
    user_id, amount, currency, payment_date, 
    period_start, period_end, payment_method, 
    invoice_id, notes, created_by
  )
  VALUES (
    p_user_id, p_amount, p_currency, NOW(),
    v_period_start, v_period_end, p_payment_method,
    p_invoice_id, p_notes, auth.uid()
  )
  RETURNING id INTO v_billing_id;

  -- Update user billing status
  UPDATE users
  SET 
    billing_status = 'paid',
    billing_amount = p_amount,
    billing_currency = p_currency,
    last_payment_date = NOW(),
    billing_due_date = v_period_end,
    invoice_id = p_invoice_id
  WHERE id = p_user_id;

  RETURN v_billing_id;
END;
$$;

-- Function to check and update overdue billing statuses
CREATE OR REPLACE FUNCTION update_overdue_billing()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users
  SET billing_status = 'overdue'
  WHERE billing_status = 'paid'
    AND billing_due_date < NOW()
    AND billing_status != 'exempt';
END;
$$;

-- ============================================
-- VIEW: User Billing Summary
-- ============================================
CREATE OR REPLACE VIEW user_billing_summary 
WITH (security_invoker = true)
AS
SELECT 
  u.id,
  u.name,
  u.email,
  u.role,
  u.company_name,
  u.billing_status,
  u.billing_amount,
  u.billing_currency,
  u.last_payment_date,
  u.billing_due_date,
  u.invoice_id,
  CASE 
    WHEN u.billing_status = 'exempt' THEN 'N/A'
    WHEN u.billing_due_date IS NULL THEN 'Never Paid'
    WHEN u.billing_due_date < NOW() THEN 'Overdue'
    WHEN u.billing_due_date < NOW() + INTERVAL '30 days' THEN 'Due Soon'
    ELSE 'Current'
  END as payment_status_label,
  EXTRACT(DAY FROM (u.billing_due_date - NOW())) as days_until_due
FROM users u
WHERE u.status = 'approved';

COMMENT ON VIEW user_billing_summary IS 
  'Summary of user billing status with computed fields. SECURITY INVOKER - respects RLS.';

-- ============================================
-- INITIAL DATA: Set superadmins as exempt
-- ============================================
UPDATE users
SET billing_status = 'exempt'
WHERE role = 'superadmin';

-- ============================================
-- VERIFICATION
-- ============================================
-- Run these to verify the migration worked:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name LIKE 'billing%';
-- SELECT * FROM user_billing_summary LIMIT 10;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
