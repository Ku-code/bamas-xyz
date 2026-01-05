-- ============================================
-- COMPLETE RLS FIX FOR DOCUMENT UPLOADS
-- ============================================
-- This script:
-- 1. Verifies and sets your user as superadmin
-- 2. Completely replaces document INSERT policies
-- 3. Fixes all RLS issues for Critical document uploads
-- ============================================

-- STEP 1: Check your current user and role
SELECT 
  id,
  email,
  name,
  role,
  status,
  approved
FROM users
WHERE id = auth.uid();

-- STEP 2: Make yourself a superadmin (CRITICAL!)
-- Replace 'kuzodonchev@gmail.com' with your actual email if different
UPDATE users
SET 
  role = 'superadmin',
  status = 'approved',
  approved = true,
  approved_at = NOW()
WHERE id = auth.uid();

-- Verify the update worked
SELECT 
  id,
  email,
  name,
  role,
  status
FROM users
WHERE id = auth.uid();

-- STEP 3: Drop ALL existing INSERT policies on documents
DROP POLICY IF EXISTS "Authenticated users can create documents" ON documents;
DROP POLICY IF EXISTS "Only superadmin can create Critical documents" ON documents;

-- STEP 4: Create a single, comprehensive INSERT policy
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

-- STEP 5: Fix UPDATE policies as well
DROP POLICY IF EXISTS "Users can update own documents" ON documents;
DROP POLICY IF EXISTS "Admins can update any document" ON documents;
DROP POLICY IF EXISTS "Only superadmin can update Critical documents" ON documents;

-- Create comprehensive UPDATE policy for document owners
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

-- Create admin override policy for updates
CREATE POLICY "Admins can update any document"
  ON documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'admin')
    )
  );

-- STEP 6: Verify all policies are correct
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'documents'
ORDER BY cmd, policyname;

-- STEP 7: Test query (should return your user as superadmin)
SELECT 
  'You are a ' || role || ' with status ' || status as result,
  CASE 
    WHEN role = 'superadmin' THEN '✅ You can create Critical documents'
    ELSE '❌ You CANNOT create Critical documents - check your role'
  END as can_create_critical
FROM users
WHERE id = auth.uid();

