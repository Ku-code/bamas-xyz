-- Migration: Replace DocuSeal with Native Signature System
-- Removes DocuSeal columns and adds native signature support

-- Drop DocuSeal-related columns from documents table
ALTER TABLE documents 
DROP COLUMN IF EXISTS docuseal_template_id,
DROP COLUMN IF EXISTS docuseal_submission_id;

-- Add signed PDF storage path
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS signed_file_path TEXT;

-- Drop DocuSeal index
DROP INDEX IF EXISTS idx_documents_docuseal_template_id;

-- Update document_signatures table - remove DocuSeal column
ALTER TABLE document_signatures
DROP COLUMN IF EXISTS docuseal_submission_id;

-- Add signature image storage fields
ALTER TABLE document_signatures
ADD COLUMN IF NOT EXISTS signature_image_path TEXT,
ADD COLUMN IF NOT EXISTS signature_data_url TEXT; -- Base64 for quick access

-- Add index for signed file path lookups
CREATE INDEX IF NOT EXISTS idx_documents_signed_file_path 
ON documents(signed_file_path) WHERE signed_file_path IS NOT NULL;

-- Add index for signature images
CREATE INDEX IF NOT EXISTS idx_document_signatures_image_path 
ON document_signatures(signature_image_path) WHERE signature_image_path IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN documents.signed_file_path IS 'Path to the final signed PDF in storage (generated when all signatures are collected)';
COMMENT ON COLUMN document_signatures.signature_image_path IS 'Path to signature image PNG in storage';
COMMENT ON COLUMN document_signatures.signature_data_url IS 'Base64 data URL of signature for quick display';

