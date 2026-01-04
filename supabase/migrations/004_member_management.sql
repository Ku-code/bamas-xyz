-- ============================================
-- MEMBER MANAGEMENT ENHANCEMENTS
-- ============================================
-- This migration adds suspended status and tracking fields
-- for enhanced member management by superadmins

-- Update status constraint to include 'suspended'
ALTER TABLE users 
  DROP CONSTRAINT IF EXISTS users_status_check;

ALTER TABLE users 
  ADD CONSTRAINT users_status_check 
  CHECK (status IN ('pending', 'approved', 'rejected', 'suspended'));

-- Add suspension tracking fields
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Add soft delete tracking (optional, for audit purposes)
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_users_suspended_at ON users(suspended_at) WHERE suspended_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_status_suspended ON users(status) WHERE status = 'suspended';

-- Add comment for documentation
COMMENT ON COLUMN users.suspended_at IS 'Timestamp when member was suspended';
COMMENT ON COLUMN users.suspended_by IS 'User ID of admin who suspended this member';
COMMENT ON COLUMN users.suspension_reason IS 'Reason for suspension';
COMMENT ON COLUMN users.deleted_at IS 'Timestamp when member was soft deleted';
COMMENT ON COLUMN users.deleted_by IS 'User ID of admin who deleted this member';
COMMENT ON COLUMN users.deletion_reason IS 'Reason for deletion';

