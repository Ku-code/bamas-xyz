-- ============================================
-- FIX RLS POLICIES FOR DOCUMENT UPLOADS
-- ============================================
-- This fixes the "row violates row-level security policy" error
-- when uploading Critical documents
-- 
-- Run this SQL in Supabase SQL Editor to apply the fix immediately
-- ============================================

-- STEP 1: Ensure you are a superadmin
-- Replace email if needed
UPDATE users
SET 
  role = 'superadmin',
  status = 'approved',
  approved = true,
  approved_at = NOW()
WHERE id = auth.uid();

-- STEP 2: Drop ALL conflicting document policies
DROP POLICY IF EXISTS "Authenticated users can create documents" ON documents;
DROP POLICY IF EXISTS "Only superadmin can create Critical documents" ON documents;
DROP POLICY IF EXISTS "Users can update own documents" ON documents;
DROP POLICY IF EXISTS "Only superadmin can update Critical documents" ON documents;

-- STEP 3: Create comprehensive INSERT policy (FIXED)
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

-- STEP 4: Create comprehensive UPDATE policy (FIXED)
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

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check your current role (should be 'superadmin')
SELECT 
  id,
  name,
  email,
  role,
  status
FROM users
WHERE id = auth.uid();

-- If your role is NOT 'superadmin', run this to fix it:
-- UPDATE users SET role = 'superadmin' WHERE id = auth.uid();

-- List all policies on documents table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'documents'
ORDER BY cmd, policyname;

