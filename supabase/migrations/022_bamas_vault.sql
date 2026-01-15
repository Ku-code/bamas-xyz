-- =====================================================
-- BAMAS Vault Migration
-- Secure document storage with password protection
-- =====================================================

-- Enable crypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create vault_documents table
CREATE TABLE IF NOT EXISTS vault_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT, -- Supabase Storage path
  file_name TEXT,
  file_size BIGINT,
  mime_type TEXT,
  category TEXT DEFAULT 'General',
  
  -- Security fields
  access_level TEXT DEFAULT 'board' CHECK (access_level IN ('superadmin', 'board', 'custom')),
  allowed_users UUID[] DEFAULT '{}', -- For custom access level
  
  -- Metadata
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by_name TEXT NOT NULL,
  created_by_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vault_access table for tracking access and shared passwords
CREATE TABLE IF NOT EXISTS vault_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_password_hash TEXT NOT NULL, -- Hashed vault password
  password_hint TEXT, -- Optional hint for board members
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vault_access_log table for audit trail
CREATE TABLE IF NOT EXISTS vault_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL, -- 'access_granted', 'document_viewed', 'document_uploaded', 'document_deleted'
  document_id UUID REFERENCES vault_documents(id) ON DELETE SET NULL,
  document_title TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vault_documents_created_by ON vault_documents(created_by);
CREATE INDEX IF NOT EXISTS idx_vault_documents_access_level ON vault_documents(access_level);
CREATE INDEX IF NOT EXISTS idx_vault_documents_category ON vault_documents(category);
CREATE INDEX IF NOT EXISTS idx_vault_access_log_user ON vault_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_vault_access_log_created ON vault_access_log(created_at DESC);

-- Enable Row Level Security
ALTER TABLE vault_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_access_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vault_documents
-- Superadmin: Full access
CREATE POLICY vault_documents_superadmin_all ON vault_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'superadmin'
    )
  );

-- Board members: Read-only access (password verified at application level)
CREATE POLICY vault_documents_board_read ON vault_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('superadmin', 'board_member', 'wg_lead')
      AND users.status = 'approved'
    )
  );

-- RLS Policies for vault_access (password management)
-- Only superadmin can manage vault passwords
CREATE POLICY vault_access_superadmin_all ON vault_access
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'superadmin'
    )
  );

-- Board members can read vault_access for password verification
CREATE POLICY vault_access_board_read ON vault_access
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('superadmin', 'board_member', 'wg_lead')
      AND users.status = 'approved'
    )
  );

-- RLS Policies for vault_access_log
-- Superadmin: Full access to audit logs
CREATE POLICY vault_access_log_superadmin_all ON vault_access_log
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'superadmin'
    )
  );

-- Board members can insert their own access logs
CREATE POLICY vault_access_log_board_insert ON vault_access_log
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('superadmin', 'board_member', 'wg_lead')
      AND users.status = 'approved'
    )
  );

-- Function to hash vault password
CREATE OR REPLACE FUNCTION hash_vault_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf', 10));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify vault password
CREATE OR REPLACE FUNCTION verify_vault_password(password TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  SELECT vault_password_hash INTO stored_hash FROM vault_access LIMIT 1;
  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN stored_hash = crypt(password, stored_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set/update vault password (superadmin only)
CREATE OR REPLACE FUNCTION set_vault_password(new_password TEXT, hint TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  is_superadmin BOOLEAN;
BEGIN
  -- Check if user is superadmin
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'superadmin'
  ) INTO is_superadmin;
  
  IF NOT is_superadmin THEN
    RAISE EXCEPTION 'Only superadmin can set vault password';
  END IF;
  
  -- Delete existing password entry and insert new one
  DELETE FROM vault_access;
  INSERT INTO vault_access (vault_password_hash, password_hint, updated_by, updated_at)
  VALUES (hash_vault_password(new_password), hint, auth.uid(), NOW());
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default vault password (superadmin should change this)
-- Default password: 'bamas2026' - CHANGE THIS IN PRODUCTION
INSERT INTO vault_access (vault_password_hash, password_hint, updated_at)
VALUES (crypt('bamas2026', gen_salt('bf', 10)), 'Default hint: Association name + year', NOW())
ON CONFLICT DO NOTHING;

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_vault_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS vault_documents_updated_at ON vault_documents;
CREATE TRIGGER vault_documents_updated_at
  BEFORE UPDATE ON vault_documents
  FOR EACH ROW EXECUTE FUNCTION update_vault_documents_updated_at();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON vault_documents TO authenticated;
GRANT ALL ON vault_access TO authenticated;
GRANT ALL ON vault_access_log TO authenticated;
GRANT EXECUTE ON FUNCTION verify_vault_password TO authenticated;
GRANT EXECUTE ON FUNCTION set_vault_password TO authenticated;
