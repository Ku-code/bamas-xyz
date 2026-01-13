-- ============================================
-- FIX POLL VOTES SELECT POLICY
-- Migration 017: Ensure votes can be read by all authenticated users
-- ============================================

-- Drop existing SELECT policy if it exists
DROP POLICY IF EXISTS "Authenticated users can read votes" ON poll_votes;

-- Recreate SELECT policy - ALL authenticated users can read ALL votes
-- This is necessary for poll results to be visible to everyone
CREATE POLICY "Authenticated users can read votes"
  ON poll_votes FOR SELECT
  TO authenticated
  USING (true);

-- Verify all policies exist
-- Users should be able to:
-- 1. READ all votes (for seeing results) ✅
-- 2. INSERT their own votes ✅
-- 3. UPDATE their own votes ✅
-- 4. DELETE their own votes ✅

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- This ensures poll results are visible to all authenticated users
-- while maintaining security for vote submission (users can only vote for themselves)