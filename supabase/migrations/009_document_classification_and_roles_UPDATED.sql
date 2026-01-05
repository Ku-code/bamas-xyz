-- ============================================
-- DOCUMENT CLASSIFICATION & DIGITAL SIGNATURES
-- Migration: 009_document_classification_and_roles.sql
-- Version: 2.0 (Updated for DocuSeal Integration)
-- ============================================
-- 
-- This migration implements:
-- 1. Extended user roles (board_member, wg_lead)
-- 2. Document classification system (GENERAL, PROCEDURAL, CRITICAL)
-- 3. Digital signature workflow with DocuSeal integration
-- 4. Signature tracking and status management
-- 5. Row Level Security policies for signatures
--
-- SAFE TO RUN: All operations use IF NOT EXISTS or are additive
-- ============================================

-- ============================================
-- STEP 1: EXTEND USER ROLES
-- ============================================
-- Add 'board_member' and 'wg_lead' roles for signature authority
-- NOTE: DROP CONSTRAINT is intentional - we're replacing with expanded version

ALTER TABLE users 
  DROP CONSTRAINT IF EXISTS users_role_check;
  
ALTER TABLE users
  ADD CONSTRAINT users_role_check 
  CHECK (role IN ('superadmin', 'admin', 'member', 'board_member', 'wg_lead'));

-- Add comment for documentation
COMMENT ON CONSTRAINT users_role_check ON users IS 
  'User roles: superadmin (full access), admin (management), member (standard), board_member (signatures), wg_lead (working group lead with signatures)';

-- ============================================
-- STEP 2: DOCUMENT CLASSIFICATION FIELDS
-- ============================================
-- Add classification and signature tracking to documents table

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS classification TEXT DEFAULT 'GENERAL' 
    CHECK (classification IN ('GENERAL', 'PROCEDURAL', 'CRITICAL')),
  ADD COLUMN IF NOT EXISTS signature_status TEXT DEFAULT 'NONE' 
    CHECK (signature_status IN ('NONE', 'PENDING', 'COMPLETED')),
  ADD COLUMN IF NOT EXISTS docuseal_template_id TEXT,
  ADD COLUMN IF NOT EXISTS docuseal_submission_id TEXT,
  ADD COLUMN IF NOT EXISTS signed_pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS required_signers JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS signatures JSONB DEFAULT '[]'::jsonb;

-- Add column comments for documentation
COMMENT ON COLUMN documents.classification IS 
  'Document classification: GENERAL (public), PROCEDURAL (internal), CRITICAL (requires signatures)';
COMMENT ON COLUMN documents.signature_status IS 
  'Signature status: NONE (not required), PENDING (awaiting signatures), COMPLETED (all signed)';
COMMENT ON COLUMN documents.required_signers IS 
  'JSONB array of user IDs or role identifiers (all_board_members, all_wg_leads) who must sign';
COMMENT ON COLUMN documents.signatures IS 
  'JSONB array of signature records (legacy, use document_signatures table instead)';

-- Ensure existing documents have valid defaults
UPDATE documents 
SET classification = 'GENERAL' 
WHERE classification IS NULL;

UPDATE documents 
SET signature_status = 'NONE' 
WHERE signature_status IS NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_classification 
  ON documents(classification);
CREATE INDEX IF NOT EXISTS idx_documents_signature_status 
  ON documents(signature_status);
CREATE INDEX IF NOT EXISTS idx_documents_docuseal_template_id 
  ON documents(docuseal_template_id) 
  WHERE docuseal_template_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_docuseal_submission_id 
  ON documents(docuseal_submission_id) 
  WHERE docuseal_submission_id IS NOT NULL;

-- Index for filtering Critical documents with pending signatures
CREATE INDEX IF NOT EXISTS idx_documents_critical_pending 
  ON documents(classification, signature_status) 
  WHERE classification = 'CRITICAL' AND signature_status = 'PENDING';

-- ============================================
-- STEP 3: DOCUMENT SIGNATURES TRACKING TABLE
-- ============================================
-- Individual signature tracking for audit trail and workflow

CREATE TABLE IF NOT EXISTS document_signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  docuseal_submission_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'completed', 'declined')),
  signed_at TIMESTAMPTZ,
  signed_pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  UNIQUE(document_id, user_id)
);

-- Add table comment
COMMENT ON TABLE document_signatures IS 
  'Individual signature records for Critical documents. Tracks who needs to sign and signature status.';

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_document_signatures_document_id 
  ON document_signatures(document_id);
CREATE INDEX IF NOT EXISTS idx_document_signatures_user_id 
  ON document_signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_document_signatures_status 
  ON document_signatures(status);
CREATE INDEX IF NOT EXISTS idx_document_signatures_docuseal_submission_id 
  ON document_signatures(docuseal_submission_id) 
  WHERE docuseal_submission_id IS NOT NULL;

-- Index for finding pending signatures by user
CREATE INDEX IF NOT EXISTS idx_document_signatures_user_pending 
  ON document_signatures(user_id, status) 
  WHERE status = 'pending';

-- ============================================
-- STEP 4: TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
-- (Assumes update_updated_at_column() exists from migration 001)
DROP TRIGGER IF EXISTS update_document_signatures_updated_at ON document_signatures;
CREATE TRIGGER update_document_signatures_updated_at
  BEFORE UPDATE ON document_signatures
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 5: ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on document_signatures table
ALTER TABLE document_signatures ENABLE ROW LEVEL SECURITY;

-- ============================================
-- DOCUMENT_SIGNATURES POLICIES
-- ============================================

-- Policy: Users can view their own signature records + admins + document creators
DROP POLICY IF EXISTS "Users can view their own signature records" ON document_signatures;
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

-- Policy: Users can create signature records when they're required signers
DROP POLICY IF EXISTS "Users can create their own signature records" ON document_signatures;
CREATE POLICY "Users can create their own signature records"
  ON document_signatures FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_signatures.document_id
      AND documents.classification = 'CRITICAL'
      AND (
        -- User ID explicitly in required_signers
        documents.required_signers @> jsonb_build_array(auth.uid()::text)
        -- Or user is board member and all board members required
        OR (documents.required_signers @> '["all_board_members"]'::jsonb 
            AND EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'board_member'))
        -- Or user is WG lead and all WG leads required
        OR (documents.required_signers @> '["all_wg_leads"]'::jsonb 
            AND EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'wg_lead'))
      )
    )
  );

-- Policy: Admins and document creators can create signature records
DROP POLICY IF EXISTS "Admins can create signature records" ON document_signatures;
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

-- Policy: Users can update their own signature status
DROP POLICY IF EXISTS "Users can update their own signature status" ON document_signatures;
CREATE POLICY "Users can update their own signature status"
  ON document_signatures FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can update any signature record
DROP POLICY IF EXISTS "Admins can update any signature record" ON document_signatures;
CREATE POLICY "Admins can update any signature record"
  ON document_signatures FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'admin')
    )
  );

-- Policy: Admins and document creators can delete signature records
DROP POLICY IF EXISTS "Admins can delete signature records" ON document_signatures;
CREATE POLICY "Admins can delete signature records"
  ON document_signatures FOR DELETE
  USING (
    EXISTS (
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

-- ============================================
-- HELPER VIEWS (Optional but useful)
-- ============================================

-- View: Pending signatures by user
CREATE OR REPLACE VIEW pending_signatures_by_user AS
SELECT 
  ds.id as signature_id,
  ds.document_id,
  d.title as document_title,
  d.classification,
  ds.user_id,
  u.name as user_name,
  u.email as user_email,
  u.role as user_role,
  ds.status,
  ds.created_at,
  d.created_by as document_creator_id,
  creator.name as document_creator_name
FROM document_signatures ds
JOIN documents d ON d.id = ds.document_id
JOIN users u ON u.id = ds.user_id
JOIN users creator ON creator.id = d.created_by
WHERE ds.status = 'pending'
  AND d.signature_status = 'PENDING';

COMMENT ON VIEW pending_signatures_by_user IS 
  'Shows all pending signatures with user and document details for easy monitoring';

-- View: Document signature progress
CREATE OR REPLACE VIEW document_signature_progress AS
SELECT 
  d.id as document_id,
  d.title,
  d.classification,
  d.signature_status,
  COUNT(ds.id) as total_signers,
  COUNT(CASE WHEN ds.status = 'completed' THEN 1 END) as completed_signatures,
  COUNT(CASE WHEN ds.status = 'pending' THEN 1 END) as pending_signatures,
  COUNT(CASE WHEN ds.status = 'declined' THEN 1 END) as declined_signatures,
  ROUND(
    100.0 * COUNT(CASE WHEN ds.status = 'completed' THEN 1 END) / NULLIF(COUNT(ds.id), 0),
    2
  ) as completion_percentage
FROM documents d
LEFT JOIN document_signatures ds ON ds.document_id = d.id
WHERE d.classification = 'CRITICAL'
GROUP BY d.id, d.title, d.classification, d.signature_status;

COMMENT ON VIEW document_signature_progress IS 
  'Shows signature completion progress for all Critical documents';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the migration worked correctly

-- Check extended user roles
-- SELECT role, COUNT(*) FROM users GROUP BY role;

-- Check document classifications
-- SELECT classification, COUNT(*) FROM documents GROUP BY classification;

-- Check signature statuses
-- SELECT signature_status, COUNT(*) FROM documents GROUP BY signature_status;

-- View pending signatures
-- SELECT * FROM pending_signatures_by_user LIMIT 10;

-- View signature progress
-- SELECT * FROM document_signature_progress;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Log successful migration
DO $$ 
BEGIN 
  RAISE NOTICE 'Migration 009 completed successfully';
  RAISE NOTICE 'Extended user roles: board_member, wg_lead';
  RAISE NOTICE 'Document classification system enabled';
  RAISE NOTICE 'Digital signature tracking ready';
  RAISE NOTICE 'DocuSeal integration prepared';
END $$;

