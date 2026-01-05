-- ============================================
-- FIX RLS POLICIES FOR DOCUMENT UPLOADS
-- ============================================
-- This fixes the "row violates row-level security policy" error
-- when uploading Critical documents
-- 
-- Run this SQL in Supabase SQL Editor to apply the fix immediately
-- ============================================

-- Policy: Only superadmin can create Critical documents (FIXED)
DROP POLICY IF EXISTS "Only superadmin can create Critical documents" ON documents;
CREATE POLICY "Only superadmin can create Critical documents"
  ON documents FOR INSERT
  WITH CHECK (
    -- Allow if NOT Critical
    (classification IS NULL OR classification != 'CRITICAL')
    OR
    -- OR if Critical, user must be superadmin AND must be the creator
    (
      classification = 'CRITICAL'
      AND auth.uid()::text = created_by::text
      AND EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'superadmin'
      )
    )
  );

-- Policy: Only superadmin can update Critical documents (FIXED)
DROP POLICY IF EXISTS "Only superadmin can update Critical documents" ON documents;
CREATE POLICY "Only superadmin can update Critical documents"
  ON documents FOR UPDATE
  USING (
    -- Allow if NOT Critical
    (classification IS NULL OR classification != 'CRITICAL')
    OR
    -- OR if Critical, user must be superadmin
    (
      classification = 'CRITICAL'
      AND EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'superadmin'
      )
    )
  )
  WITH CHECK (
    -- Allow if NOT Critical
    (classification IS NULL OR classification != 'CRITICAL')
    OR
    -- OR if Critical, user must be superadmin
    (
      classification = 'CRITICAL'
      AND EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'superadmin'
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

