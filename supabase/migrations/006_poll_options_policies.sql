-- ============================================
-- POLL OPTIONS TABLE - INSERT/UPDATE/DELETE POLICIES
-- ============================================
-- This migration adds missing RLS policies for poll_options table
-- to allow users to create, update, and delete options for polls they created

-- ============================================
-- POLL OPTIONS TABLE POLICIES
-- ============================================

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can insert options for their polls" ON poll_options;
DROP POLICY IF EXISTS "Users can update options for their polls" ON poll_options;
DROP POLICY IF EXISTS "Users can delete options for their polls" ON poll_options;

-- Users can insert options for polls they created
CREATE POLICY "Users can insert options for their polls"
  ON poll_options FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM polls
      WHERE polls.id = poll_options.poll_id
      AND polls.created_by::text = auth.uid()::text
    )
  );

-- Users can update options for polls they created
CREATE POLICY "Users can update options for their polls"
  ON poll_options FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM polls
      WHERE polls.id = poll_options.poll_id
      AND polls.created_by::text = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM polls
      WHERE polls.id = poll_options.poll_id
      AND polls.created_by::text = auth.uid()::text
    )
  );

-- Users can delete options for polls they created
CREATE POLICY "Users can delete options for their polls"
  ON poll_options FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM polls
      WHERE polls.id = poll_options.poll_id
      AND polls.created_by::text = auth.uid()::text
    )
  );

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- This migration enables:
-- 1. Users to insert poll options for polls they created
-- 2. Users to update poll options for polls they created
-- 3. Users to delete poll options for polls they created
-- 
-- All authenticated users can still read all poll options (existing policy remains).

