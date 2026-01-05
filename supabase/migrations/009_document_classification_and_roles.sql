-- ============================================
-- DOCUMENT CLASSIFICATION & ROLE EXTENSIONS
-- Migration: 009_document_classification_and_roles.sql
-- ============================================
-- This migration:
-- 1. Extends user roles to include 'board_member' and 'wg_lead'
-- 2. Adds document classification and signature tracking fields
-- 3. Creates document_signatures table for tracking individual signatures
-- 4. Sets up RLS policies for document signatures
--
-- NOTE: The DROP CONSTRAINT operation is intentional and safe.
-- We are replacing the existing role constraint with an extended one.
-- ============================================

-- Step 1: Extend User Roles
-- Add 'board_member' and 'wg_lead' roles to users table
-- This operation is safe: we're only expanding the allowed role values
ALTER TABLE users 
  DROP CONSTRAINT IF EXISTS users_role_check;
  
ALTER TABLE users
  ADD CONSTRAINT users_role_check 
  CHECK (role IN ('superadmin', 'admin', 'member', 'board_member', 'wg_lead'));

-- Step 2: Add Classification and Signature Fields to Documents Table
-- These columns are nullable or have defaults, so existing documents are unaffected
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS classification TEXT DEFAULT 'GENERAL' CHECK (classification IN ('GENERAL', 'PROCEDURAL', 'CRITICAL')),
  ADD COLUMN IF NOT EXISTS signature_status TEXT DEFAULT 'NONE' CHECK (signature_status IN ('NONE', 'PENDING', 'COMPLETED')),
  ADD COLUMN IF NOT EXISTS docuseal_template_id TEXT,
  ADD COLUMN IF NOT EXISTS docuseal_submission_id TEXT,
  ADD COLUMN IF NOT EXISTS signed_pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS required_signers JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS signatures JSONB DEFAULT '[]'::jsonb;

-- Update existing documents to have default classification
UPDATE documents 
SET classification = 'GENERAL' 
WHERE classification IS NULL;

UPDATE documents 
SET signature_status = 'NONE' 
WHERE signature_status IS NULL;

-- Indexes for new document fields
CREATE INDEX IF NOT EXISTS idx_documents_classification ON documents(classification);
CREATE INDEX IF NOT EXISTS idx_documents_signature_status ON documents(signature_status);
CREATE INDEX IF NOT EXISTS idx_documents_docuseal_template_id ON documents(docuseal_template_id);

-- Step 3: Create Document Signatures Tracking Table
-- This is a new table, so no existing data is affected
CREATE TABLE IF NOT EXISTS document_signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  docuseal_submission_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'declined')),
  signed_at TIMESTAMPTZ,
  signed_pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  UNIQUE(document_id, user_id)
);

-- Indexes for document_signatures table
CREATE INDEX IF NOT EXISTS idx_document_signatures_document_id ON document_signatures(document_id);
CREATE INDEX IF NOT EXISTS idx_document_signatures_user_id ON document_signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_document_signatures_status ON document_signatures(status);
CREATE INDEX IF NOT EXISTS idx_document_signatures_docuseal_submission_id ON document_signatures(docuseal_submission_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at timestamp for document_signatures
-- The function update_updated_at_column() already exists from initial schema
CREATE TRIGGER update_document_signatures_updated_at
  BEFORE UPDATE ON document_signatures
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on document_signatures
ALTER TABLE document_signatures ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own signature records
CREATE POLICY "Users can view their own signature records"
  ON document_signatures FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'admin')
    )
    OR EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_signatures.document_id
      AND documents.created_by = auth.uid()
    )
  );

-- Policy: Users can create their own signature records when required to sign
CREATE POLICY "Users can create their own signature records"
  ON document_signatures FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_signatures.document_id
      AND documents.classification = 'CRITICAL'
      AND (
        documents.required_signers @> jsonb_build_array(auth.uid()::text)
        OR (documents.required_signers @> '["all_board_members"]'::jsonb 
            AND EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'board_member'))
        OR (documents.required_signers @> '["all_wg_leads"]'::jsonb 
            AND EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'wg_lead'))
      )
    )
  );

-- Policy: Admins and document creators can create signature records
CREATE POLICY "Admins can create signature records"
  ON document_signatures FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'admin')
    )
    OR EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_signatures.document_id
      AND documents.created_by = auth.uid()
      AND documents.classification = 'CRITICAL'
    )
  );

-- Policy: Users can update their own signature status when signing
CREATE POLICY "Users can update their own signature status"
  ON document_signatures FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can update any signature record
CREATE POLICY "Admins can update any signature record"
  ON document_signatures FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'admin')
    )
  );

-- ============================================
-- DOCUMENTS TABLE RLS POLICY UPDATES
-- ============================================
-- Replace existing document policies with classification-aware versions

-- Drop ALL existing INSERT/UPDATE policies that will be replaced
DROP POLICY IF EXISTS "Authenticated users can create documents" ON documents;
DROP POLICY IF EXISTS "Only superadmin can create Critical documents" ON documents;
DROP POLICY IF EXISTS "Users can update own documents" ON documents;
DROP POLICY IF EXISTS "Only superadmin can update Critical documents" ON documents;

-- Policy: Comprehensive INSERT policy with classification rules
CREATE POLICY "Users can create documents with classification rules"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User must be the creator
    auth.uid() = created_by
    AND
    (
      -- Allow non-Critical documents for all authenticated users
      (classification IS NULL OR classification IN ('GENERAL', 'PROCEDURAL'))
      OR
      -- Allow Critical documents only for superadmins
      (
        classification = 'CRITICAL'
        AND EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role = 'superadmin'
        )
      )
    )
  );

-- Policy: Comprehensive UPDATE policy for document owners
CREATE POLICY "Users can update own documents with classification rules"
  ON documents FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (
    auth.uid() = created_by
    AND
    (
      -- Allow updating non-Critical documents
      (classification IS NULL OR classification IN ('GENERAL', 'PROCEDURAL'))
      OR
      -- Allow updating Critical documents only if user is superadmin
      (
        classification = 'CRITICAL'
        AND EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role = 'superadmin'
        )
      )
    )
  );

-- Note: "Admins can update any document" and "Admins can delete any document" 
-- policies from initial migration remain in effect

