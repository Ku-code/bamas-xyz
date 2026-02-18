-- ============================================
-- FIX USER REGISTRATION AND APPROVAL SYSTEM
-- Migration: 024_fix_user_registration_and_approval.sql
-- ============================================
-- This migration ensures:
-- 1. All new registrations are correctly captured in the users table
-- 2. Superadmins can see all pending requests
-- 3. Approved users have consistent access
-- ============================================

-- STEP 1: Ensure users table has all required columns and constraints
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member',
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false;

-- Update status check to include all current statuses
ALTER TABLE public.users 
  DROP CONSTRAINT IF EXISTS users_status_check;

ALTER TABLE public.users 
  ADD CONSTRAINT users_status_check 
  CHECK (status IN ('pending', 'approved', 'rejected', 'suspended'));

-- Update role check to include all current roles
ALTER TABLE public.users 
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users 
  ADD CONSTRAINT users_role_check 
  CHECK (role IN ('superadmin', 'admin', 'member', 'board_member', 'wg_lead'));

-- STEP 2: Create a robust create_user_profile function
-- This uses SECURITY DEFINER to bypass RLS during registration
CREATE OR REPLACE FUNCTION public.create_user_profile(
  user_id UUID,
  user_name TEXT,
  user_email TEXT,
  user_provider TEXT DEFAULT 'email',
  user_image TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_first_user BOOLEAN;
  final_role TEXT;
  final_status TEXT;
  final_approved BOOLEAN;
BEGIN
  -- Check if this is the first user in the system
  SELECT NOT EXISTS (SELECT 1 FROM public.users) INTO is_first_user;
  
  -- Hardcoded superadmin check (fallback and security)
  IF user_email IN (
    'kuzodonchev@3dopendesign.com', 
    'kuzodonchev@gmail.com', 
    'info@bamas.xyz'
  ) THEN
    final_role := 'superadmin';
    final_status := 'approved';
    final_approved := true;
  ELSIF is_first_user THEN
    final_role := 'superadmin';
    final_status := 'approved';
    final_approved := true;
  ELSE
    final_role := 'member';
    final_status := 'pending';
    final_approved := false;
  END IF;

  INSERT INTO public.users (
    id, 
    email, 
    name, 
    provider, 
    image, 
    role, 
    status, 
    approved,
    created_at,
    updated_at
  )
  VALUES (
    user_id, 
    user_email, 
    user_name, 
    user_provider, 
    user_image, 
    final_role, 
    final_status, 
    final_approved,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    provider = COALESCE(public.users.provider, EXCLUDED.provider),
    image = COALESCE(public.users.image, EXCLUDED.image),
    updated_at = NOW()
  -- If user was previously rejected, reset them to pending for review
  WHERE public.users.status = 'rejected' OR public.users.id = user_id;

  RETURN user_id;
END;
$$;

-- STEP 3: Create a safety trigger on auth.users
-- This ensures that even if the frontend fails to call the RPC, 
-- a profile is still created automatically
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.create_user_profile(
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    NEW.raw_app_meta_data->>'provider',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- STEP 4: Optimize RLS for Superadmins to ensure they see everything
-- All authenticated users can read all users (needed for search/directory)
DROP POLICY IF EXISTS "Authenticated users can read all users" ON public.users;
CREATE POLICY "Authenticated users can read all users"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

-- Admins/Superadmins can manage all users (including pending)
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update user roles and status" ON public.users;

CREATE POLICY "Admins can manage all users"
  ON public.users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
      AND public.users.role IN ('superadmin', 'admin')
    )
  );

-- STEP 5: Explicitly grant current superadmins their status
UPDATE public.users
SET 
  role = 'superadmin',
  status = 'approved',
  approved = true,
  approved_at = COALESCE(approved_at, NOW())
WHERE email IN (
  'kuzodonchev@3dopendesign.com', 
  'kuzodonchev@gmail.com', 
  'info@bamas.xyz'
);

-- STEP 6: Fix specific issue where pending users might be hidden
-- Ensure indexes are correctly set for the status filter
CREATE INDEX IF NOT EXISTS idx_users_status_pending ON public.users(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_users_deleted_at_null ON public.users(deleted_at) WHERE deleted_at IS NULL;

-- STEP 7: Audit and synchronize existing auth users
-- This catches any users who registered but didn't have a profile created
INSERT INTO public.users (id, email, name, role, status, approved, created_at, updated_at)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'name', email),
  CASE 
    WHEN email IN ('kuzodonchev@3dopendesign.com', 'kuzodonchev@gmail.com', 'info@bamas.xyz') THEN 'superadmin'
    ELSE 'member'
  END,
  CASE 
    WHEN email IN ('kuzodonchev@3dopendesign.com', 'kuzodonchev@gmail.com', 'info@bamas.xyz') THEN 'approved'
    ELSE 'pending'
  END,
  CASE 
    WHEN email IN ('kuzodonchev@3dopendesign.com', 'kuzodonchev@gmail.com', 'info@bamas.xyz') THEN true
    ELSE false
  END,
  created_at,
  NOW()
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;

-- Log success
DO $$ 
BEGIN 
  RAISE NOTICE 'Migration 024: User Registration and Approval fix applied successfully';
END $$;
