# Working Groups System Setup Guide

This guide will help you set up the Working Groups collaboration system in your Supabase project.

## Step 1: Run the Database Migration

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `supabase/migrations/008_working_groups.sql`
4. Copy the entire contents of the migration file
5. Paste it into the SQL Editor
6. Click **Run** to execute the migration

This migration will create:
- 7 new tables for the Working Groups system
- All necessary indexes for performance
- Row Level Security (RLS) policies
- Initial seed data for the 5 Working Groups

## Step 2: Create Storage Bucket for WG Resources

1. In Supabase Dashboard, go to **Storage**
2. Click **New bucket**
3. Name: `wg-resources`
4. Make it **Public**: No (private bucket)
5. Click **Create bucket**

### Storage Policies for `wg-resources` bucket

After creating the bucket, go to **Policies** tab and add these policies:

#### Policy 1: Allow authenticated users to upload files
```sql
CREATE POLICY "WG members can upload resources"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'wg-resources' AND
  EXISTS (
    SELECT 1 FROM wg_members
    WHERE wg_members.user_id = auth.uid()
    AND (storage.foldername(name))[1] = wg_members.working_group_id::text
  )
);
```

#### Policy 2: Allow WG members to read approved resources
```sql
CREATE POLICY "WG members can read approved resources"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'wg-resources' AND
  EXISTS (
    SELECT 1 FROM wg_resources
    JOIN wg_members ON wg_members.working_group_id = wg_resources.working_group_id
    WHERE wg_resources.file_path = name
    AND wg_members.user_id = auth.uid()
    AND wg_resources.is_approved = true
  )
);
```

#### Policy 3: Allow WG leads and uploaders to delete files
```sql
CREATE POLICY "WG leads and uploaders can delete resources"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'wg-resources' AND
  (
    EXISTS (
      SELECT 1 FROM wg_resources
      WHERE wg_resources.file_path = name
      AND wg_resources.uploaded_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM wg_resources
      JOIN working_groups ON working_groups.id = wg_resources.working_group_id
      WHERE wg_resources.file_path = name
      AND working_groups.lead_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'admin')
    )
  )
);
```

## Step 3: Verify the Setup

1. Check that all tables were created:
   - `working_groups`
   - `wg_members`
   - `wg_projects`
   - `wg_tasks`
   - `wg_feed_posts`
   - `wg_resources`
   - `wg_comments`

2. Verify the 5 Working Groups were seeded:
   - Education & Workforce
   - Design & Prototyping
   - Industrial Production
   - Materials & Sustainability
   - Innovation & Policy

3. Test RLS policies by trying to:
   - View working groups (should work for all authenticated users)
   - Join a working group (should work for authenticated users)
   - Create a task (should only work for WG members)

## Troubleshooting

### Error: "relation does not exist"
- Make sure you ran the migration `008_working_groups.sql`
- Check that all tables were created in the `public` schema

### Error: "permission denied" when uploading resources
- Verify the storage bucket `wg-resources` exists
- Check that storage policies are correctly set up
- Ensure the user is a member of the working group

### Error: "policy already exists"
- This is normal if you're re-running the migration
- The migration uses `CREATE POLICY IF NOT EXISTS` where possible
- You can safely ignore this or drop existing policies first

## Next Steps

1. Assign Working Group Leads via the Network dashboard (superadmin only)
2. Members can join Working Groups from the Working Groups dashboard
3. Start creating projects, tasks, and sharing resources!

## Notes

- The initial 5 Working Groups are created automatically with basic mission statements
- You can update mission statements and assign leads later
- All RLS policies ensure data security and proper access control
- Storage bucket is private by default - only approved resources are accessible to members

