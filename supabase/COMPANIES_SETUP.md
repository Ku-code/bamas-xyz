# Companies Map Database Setup Guide

This guide will help you set up the Additive Manufacturing Map feature in Supabase.

## Step 1: Run the Database Migration

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the contents of `supabase/migrations/007_companies_table.sql`
6. Click **Run** (or press Cmd/Ctrl + Enter)

The migration will create:
- `companies` table with all necessary columns
- Indexes for performance (including spatial indexes for coordinates)
- Row Level Security (RLS) policies
- Update trigger for `updated_at` column

## Step 2: Create Storage Bucket

1. In Supabase Dashboard, navigate to **Storage** in the left sidebar
2. Click **New bucket**
3. Name it: `company-logos`
4. Set it to **Public** (logos need to be publicly accessible for map markers)
5. Click **Create bucket**

### Storage Policies (if bucket is private)

If you set the bucket to private, you'll need to add storage policies:

1. Go to **Storage** → **Policies** → Select `company-logos` bucket
2. Add the following policies:

**Policy 1: Allow authenticated users to upload**
```sql
CREATE POLICY "Authenticated users can upload company logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'company-logos');
```

**Policy 2: Allow public read access**
```sql
CREATE POLICY "Public can read company logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'company-logos');
```

**Policy 3: Allow users to delete their own files**
```sql
CREATE POLICY "Users can delete own company logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'company-logos' AND (storage.foldername(name))[1] = auth.uid()::text);
```

## Step 3: Verify Setup

After running the migration and creating the bucket:

1. Go to **Table Editor** → Check that `companies` table exists
2. Go to **Storage** → Check that `company-logos` bucket exists
3. Navigate to the AdditiveMAP dashboard section
4. Try registering a company

## Troubleshooting

### Error: "relation 'companies' does not exist"
- **Solution**: Run the migration file `007_companies_table.sql` in SQL Editor

### Error: "bucket 'company-logos' not found"
- **Solution**: Create the storage bucket named `company-logos` in Storage settings

### Error: "permission denied" or "policy violation"
- **Solution**: 
  - Check that your user has `approved` status
  - Verify RLS policies are correctly set up
  - If using private bucket, add storage policies as shown above

### Error: "function update_updated_at_column() does not exist"
- **Solution**: This function should be created in `001_initial_schema.sql`. If it's missing, run this:
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Geocoding Issues

If addresses are not being geocoded correctly:

1. Make sure the address includes city and country (e.g., "Sofia, Bulgaria")
2. Check that Nominatim API is accessible (it's a free service with rate limits)
3. The system will still create the company even if geocoding fails, but it won't appear on the map

## Testing

1. Log in to the dashboard
2. Navigate to **AdditiveMAP** in the sidebar
3. Click **Register Company**
4. Fill in the form:
   - Company name (required)
   - Address (required) - use a Bulgarian address for best results
   - Other fields as needed
5. Upload a company logo (optional)
6. Submit the form
7. Verify the company appears on the map
8. Click on the company marker to view details
9. Try editing/deleting (if you're the owner or superadmin)

## Map Style Configuration (Optional)

The map uses **Maptiler Dataviz** styles (dark and light modes) with a toggle button. For the best experience:

1. **Get a free Maptiler API key** (optional but recommended):
   - Go to https://cloud.maptiler.com/
   - Sign up for a free account
   - Get your API key from the dashboard
   - Free tier includes 100,000 map loads per month

2. **Add the API key to your environment variables**:
   - Create or update your `.env` file in the project root
   - Add: `VITE_MAPTILER_API_KEY=your_api_key_here`
   - Restart your development server

3. **Without API key**:
   - The map will use free fallback styles (OpenFreeMap for dark mode, OpenStreetMap for light mode)
   - All features work, but Maptiler Dataviz styles provide better visual quality

## Notes

- Companies are auto-approved (no admin approval needed)
- Members can register multiple companies
- Company owners and superadmins can edit/delete companies
- The map uses Maptiler Dataviz styles (with API key) or OpenStreetMap/OpenFreeMap (fallback)
- Dark/Light mode toggle button is available in the top-right corner of the map
- Geocoding uses Nominatim API (free, rate limit: 1 request/second)

