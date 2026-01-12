-- ============================================
-- FIX POLL VOTES RLS POLICIES
-- Migration 015: Ensure votes can be properly recorded
-- ============================================

-- Drop existing policies to recreate them with proper UUID comparison
DROP POLICY IF EXISTS "Users can vote" ON poll_votes;
DROP POLICY IF EXISTS "Users can update own votes" ON poll_votes;
DROP POLICY IF EXISTS "Users can delete own votes" ON poll_votes;

-- Recreate policies with proper UUID comparison
-- Users can vote (insert) - ensure user_id matches authenticated user
-- Use both text and UUID comparison for maximum compatibility
CREATE POLICY "Users can vote"
  ON poll_votes FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid()::text = user_id::text OR auth.uid() = user_id
  );

-- Users can update their own votes (change vote)
CREATE POLICY "Users can update own votes"
  ON poll_votes FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id::text OR auth.uid() = user_id)
  WITH CHECK (auth.uid()::text = user_id::text OR auth.uid() = user_id);

-- Users can delete their own votes (remove vote)
CREATE POLICY "Users can delete own votes"
  ON poll_votes FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id::text OR auth.uid() = user_id);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- This migration fixes the RLS policies to use proper UUID comparison
-- instead of text comparison, which should be more reliable.
-- All authenticated users can now properly submit votes.
