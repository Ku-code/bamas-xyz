-- ============================================
-- STANDALONE FIX: SECURITY DEFINER VIEWS
-- Run this directly in Supabase SQL Editor
-- ============================================
-- This fixes the security linter warnings by converting
-- SECURITY DEFINER views to SECURITY INVOKER views
-- ============================================

-- Drop existing views (they were created with implicit SECURITY DEFINER)
DROP VIEW IF EXISTS pending_signatures_by_user;
DROP VIEW IF EXISTS document_signature_progress;

-- ============================================
-- RECREATE VIEW 1: pending_signatures_by_user
-- ============================================
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
-- VERIFICATION
-- ============================================
-- Verify views were created correctly:
SELECT 
  schemaname, 
  viewname, 
  viewowner,
  CASE 
    WHEN definition LIKE '%security_invoker%' THEN 'SECURITY INVOKER ✓'
    ELSE 'SECURITY DEFINER ✗'
  END as security_mode
FROM pg_views 
WHERE viewname IN ('pending_signatures_by_user', 'document_signature_progress');

-- Expected output: Both views should show "SECURITY INVOKER ✓"
