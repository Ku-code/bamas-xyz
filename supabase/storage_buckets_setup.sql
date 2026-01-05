-- Storage Buckets Setup Script
-- Run this in Supabase SQL Editor to create required storage buckets

-- Note: Storage buckets must be created through the Supabase Dashboard UI or API
-- This SQL file provides the SQL commands for reference, but they won't work directly
-- 
-- INSTEAD: Follow these steps:
-- 
-- 1. Go to Supabase Dashboard → Storage
-- 2. Click "New bucket"
-- 3. Create these buckets:
--    - Name: company-logos
--      Public: YES (logos need to be publicly accessible)
--
-- After creating the buckets, run the policies below if needed

-- ==============================================
-- STORAGE POLICIES FOR company-logos BUCKET
-- ==============================================

-- Policy 1: Allow authenticated users to upload company logos
CREATE POLICY "Authenticated users can upload company logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-logos'
  AND auth.role() = 'authenticated'
);

-- Policy 2: Allow public read access to company logos
CREATE POLICY "Public can read company logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'company-logos');

-- Policy 3: Allow users to update their own company logos
CREATE POLICY "Users can update own company logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'company-logos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'company-logos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Allow users to delete their own company logos
CREATE POLICY "Users can delete own company logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'company-logos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ==============================================
-- VERIFY SETUP
-- ==============================================

-- Check if bucket exists (will return rows if bucket is set up)
SELECT * FROM storage.buckets WHERE id = 'company-logos';

-- Check policies
SELECT * FROM storage.objects WHERE bucket_id = 'company-logos' LIMIT 1;

-- ==============================================
-- TROUBLESHOOTING
-- ==============================================

-- If you get permission errors, make sure:
-- 1. The bucket is created in Supabase Dashboard
-- 2. The bucket is set to PUBLIC
-- 3. The policies above are applied
-- 4. Your user is authenticated and has approved status

-- To check if RLS is enabled on storage.objects:
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- To list all storage policies:
SELECT * FROM pg_policies WHERE tablename = 'objects';

