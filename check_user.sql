-- Check if Ema Tsvetkova exists and is visible
SELECT 
  id,
  email,
  name,
  status,
  role,
  deleted_at,
  created_at,
  approved_at
FROM users
WHERE email = 'ema.cvetkova1@gmail.com';

-- Also check total approved users count
SELECT COUNT(*) as approved_count 
FROM users 
WHERE status = 'approved' AND deleted_at IS NULL;
