-- ============================================
-- VOTING FIX - Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Check current policies
SELECT policyname, cmd, with_check, qual 
FROM pg_policies 
WHERE tablename = 'poll_votes';

-- Step 2: Drop and recreate the INSERT policy
DROP POLICY IF EXISTS "Users can vote" ON poll_votes;

CREATE POLICY "Users can vote"
  ON poll_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id::text);

-- Step 3: Verify the policy was created
SELECT policyname, cmd, with_check 
FROM pg_policies 
WHERE tablename = 'poll_votes' AND cmd = 'INSERT';

-- Step 4: Test inserting a vote (replace with your actual IDs)
-- First get your user ID:
SELECT auth.uid() as my_user_id;

-- Then try to insert a test vote:
INSERT INTO poll_votes (poll_id, option_id, user_id)
SELECT 
  'c356e3a8-af39-45d7-988e-8236eeeee02a',
  '40e62037-71f0-4098-8728-d64219601a9a',
  auth.uid();

-- Step 5: Verify the vote was inserted
SELECT 
  pv.id,
  u.name as voter,
  po.text as voted_for
FROM poll_votes pv
JOIN users u ON u.id = pv.user_id
JOIN poll_options po ON po.id = pv.option_id
WHERE pv.user_id = auth.uid()
ORDER BY pv.created_at DESC;

-- If the test vote works, the database is fine!
-- The issue is in the frontend code which I'm fixing now.
