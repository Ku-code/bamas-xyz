-- ============================================
-- AGENDA & HISTORY MANAGEMENT POLICIES
-- ============================================
-- This migration adds RLS policies to allow:
-- 1. Superadmins to update/delete any agenda items
-- 2. Superadmins to delete history entries

-- ============================================
-- AGENDA ITEMS TABLE - SUPERADMIN POLICIES
-- ============================================

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Superadmins can update any agenda items" ON agenda_items;
DROP POLICY IF EXISTS "Superadmins can delete any agenda items" ON agenda_items;

-- Superadmins can update any agenda items
CREATE POLICY "Superadmins can update any agenda items"
  ON agenda_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id::text = auth.uid()::text
      AND role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id::text = auth.uid()::text
      AND role = 'superadmin'
    )
  );

-- Superadmins can delete any agenda items
CREATE POLICY "Superadmins can delete any agenda items"
  ON agenda_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id::text = auth.uid()::text
      AND role = 'superadmin'
    )
  );

-- ============================================
-- ACTIVITY HISTORY TABLE - SUPERADMIN POLICIES
-- ============================================

-- Drop existing policy if it exists (for idempotency)
DROP POLICY IF EXISTS "Superadmins can delete history" ON activity_history;

-- Superadmins can delete any history entries
CREATE POLICY "Superadmins can delete history"
  ON activity_history FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id::text = auth.uid()::text
      AND role = 'superadmin'
    )
  );

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- This migration enables:
-- 1. Superadmins to edit/delete any agenda items (not just their own)
-- 2. Superadmins to delete history entries (individual or all)
-- 
-- Regular users can still only manage their own agenda items.
-- All users can still read history, but only superadmins can delete it.

