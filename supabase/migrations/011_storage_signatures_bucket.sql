-- Create signatures storage bucket and policies for native signature system

-- Create signatures bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'signatures',
  'signatures',
  false,
  5242880, -- 5MB limit for signature images
  ARRAY['image/png', 'image/jpeg']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects for signatures bucket
-- (RLS is already enabled globally, but we ensure it's enforced)

-- Policy: Users can upload their own signature images
CREATE POLICY IF NOT EXISTS "Users can upload own signatures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'signatures'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can view their own signatures
CREATE POLICY IF NOT EXISTS "Users can view own signatures"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'signatures'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Admins can view all signatures
CREATE POLICY IF NOT EXISTS "Admins can view all signatures"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'signatures'
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('superadmin', 'admin')
  )
);

-- Policy: Users can delete their own signatures (for re-signing)
CREATE POLICY IF NOT EXISTS "Users can delete own signatures"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'signatures'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Update documents bucket policy for signed PDFs
-- Allow signers to download signed PDFs
CREATE POLICY IF NOT EXISTS "Signers can download signed PDFs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND name LIKE 'signed/%'
  AND (
    -- User is a signer of this document
    EXISTS (
      SELECT 1 FROM document_signatures ds
      JOIN documents d ON d.id = ds.document_id
      WHERE d.signed_file_path = name
      AND ds.user_id = auth.uid()
    )
    -- OR user is admin
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'admin')
    )
  )
);

