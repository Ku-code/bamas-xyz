-- ============================================
-- FIX SECURITY DEFINER VIEWS
-- Migration 018: Convert SECURITY DEFINER views to SECURITY INVOKER
-- ============================================
-- Issue: Views with SECURITY DEFINER bypass RLS policies
-- Solution: Recreate views as SECURITY INVOKER to respect underlying table RLS
--
-- Security Model:
-- - Regular users: See only their own signatures and documents
-- - Admins/Superadmins: See all signatures and documents
-- - Document creators: See signatures for their documents
-- ============================================

-- Drop existing views (they were created with implicit SECURITY DEFINER)
DROP VIEW IF EXISTS pending_signatures_by_user;
DROP VIEW IF EXISTS document_signature_progress;

-- ============================================
-- RECREATE VIEW 1: pending_signatures_by_user
-- ============================================
-- This view now respects RLS policies on underlying tables:
-- - document_signatures: Users see their own + admins see all + creators see their docs
-- - documents: Users see accessible docs per RLS
-- - users: Users see other users per RLS

CREATE VIEW pending_signatures_by_user 
WITH (security_invoker = true)
AS
SELECT 
  ds.id as signature_id,
  ds.document_id,
  d.title as document_title,
  d.classification,
  ds.user_id,
  u.name as user_name,
  u.email as user_email,
  u.role as user_role,
  ds.status,
  ds.created_at,
  d.created_by as document_creator_id,
  creator.name as document_creator_name
FROM document_signatures ds
JOIN documents d ON d.id = ds.document_id
JOIN users u ON u.id = ds.user_id
JOIN users creator ON creator.id = d.created_by
WHERE ds.status = 'pending'
  AND d.signature_status = 'PENDING';

COMMENT ON VIEW pending_signatures_by_user IS 
  'Shows pending signatures with user and document details. SECURITY INVOKER - respects RLS policies. Regular users see their own signatures, admins see all.';

-- ============================================
-- RECREATE VIEW 2: document_signature_progress
-- ============================================
-- This view now respects RLS policies on underlying tables:
-- - documents: Users see only accessible documents per RLS
-- - document_signatures: Aggregations respect what user can see

CREATE VIEW document_signature_progress 
WITH (security_invoker = true)
AS
SELECT 
  d.id as document_id,
  d.title,
  d.classification,
  d.signature_status,
  COUNT(ds.id) as total_signers,
  COUNT(CASE WHEN ds.status = 'completed' THEN 1 END) as completed_signatures,
  COUNT(CASE WHEN ds.status = 'pending' THEN 1 END) as pending_signatures,
  COUNT(CASE WHEN ds.status = 'declined' THEN 1 END) as declined_signatures,
  ROUND(
    100.0 * COUNT(CASE WHEN ds.status = 'completed' THEN 1 END) / NULLIF(COUNT(ds.id), 0),
    2
  ) as completion_percentage
FROM documents d
LEFT JOIN document_signatures ds ON ds.document_id = d.id
WHERE d.classification = 'CRITICAL'
GROUP BY d.id, d.title, d.classification, d.signature_status;

COMMENT ON VIEW document_signature_progress IS 
  'Shows signature completion progress for CRITICAL documents. SECURITY INVOKER - respects RLS policies. Users see progress for documents they have access to, admins see all.';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Test as regular user (will see only their own data):
-- SELECT * FROM pending_signatures_by_user;
-- SELECT * FROM document_signature_progress;
--
-- Test as admin (will see all data):
-- Same queries, but with admin auth context
--
-- Check view security settings:
-- SELECT 
--   schemaname, 
--   viewname, 
--   viewowner,
--   definition
-- FROM pg_views 
-- WHERE viewname IN ('pending_signatures_by_user', 'document_signature_progress');

-- ============================================
-- SECURITY NOTES
-- ============================================
-- 1. These views now use security_invoker = true (SECURITY INVOKER)
-- 2. This means they execute with the permissions of the QUERYING user
-- 3. RLS policies on underlying tables are ENFORCED:
--    - document_signatures: Users see own + admins see all + creators see their docs
--    - documents: Users see accessible docs per existing RLS
--    - users: Standard user visibility rules apply
-- 4. No special privileges are bypassed
-- 5. Supabase security linter warnings will be resolved
--
-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Views are now secure and respect RLS policies ✓
-- Regular users see filtered data ✓
-- Admins see comprehensive data ✓
-- Document creators see their documents' signatures ✓
