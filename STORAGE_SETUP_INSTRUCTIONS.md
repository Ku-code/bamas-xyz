# Storage Buckets Setup Instructions

## ⚠️ IMPORTANT: Required Storage Buckets

The following storage buckets must be created in your Supabase project for the application to work properly:

### 1. **company-logos** (Required for AdditiveMAP)
   - **Purpose**: Store company logos for the Additive Manufacturing Map
   - **Visibility**: Public (logos need to be displayed on the map)
   - **Required by**: AdditiveMAP feature

## How to Create Storage Buckets

### Step 1: Access Supabase Storage

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Storage** in the left sidebar

### Step 2: Create the company-logos Bucket

1. Click **"New bucket"** button
2. Fill in the details:
   - **Name**: `company-logos` (exact name, lowercase, with hyphen)
   - **Public bucket**: ✅ **CHECK THIS BOX** (logos must be publicly accessible)
   - **File size limit**: Leave default or set to 5MB
   - **Allowed MIME types**: Leave empty (allows all image types)
3. Click **"Create bucket"**

### Step 3: Apply Storage Policies (Optional)

If you want fine-grained control, you can apply the policies in `supabase/storage_buckets_setup.sql`:

1. Go to **SQL Editor** in Supabase Dashboard
2. Copy and paste the policy statements from `supabase/storage_buckets_setup.sql`
3. Click **Run**

**Note**: If the bucket is set to PUBLIC, you may not need custom policies for basic read access.

## Verification

After creating the bucket, verify it works:

1. Navigate to the **AdditiveMAP** section in your dashboard
2. Click **"Register Company"**
3. Fill in the form and try uploading a logo
4. If successful, the logo should appear on the map marker

## Troubleshooting

### Error: "Bucket not found"
- **Cause**: The storage bucket hasn't been created
- **Solution**: Follow Step 2 above to create the `company-logos` bucket

### Error: "Permission denied" when uploading
- **Cause**: Storage policies are too restrictive or bucket is private
- **Solutions**:
  1. Make sure the bucket is set to **PUBLIC**
  2. Check that your user account has `approved` status
  3. Apply the storage policies from `supabase/storage_buckets_setup.sql`

### Error: "Invalid CORS request"
- **Cause**: CORS settings may be blocking requests
- **Solution**: In Supabase Dashboard → Settings → API, ensure your app URL is in the allowed origins

### Logo doesn't display on map
- **Cause**: Bucket may be private or policies are blocking public read
- **Solution**: 
  1. Ensure bucket is set to PUBLIC
  2. Apply the "Public can read company logos" policy from the SQL file

## Additional Storage Buckets (Future Features)

The application may also use these buckets in the future:

- `documents` - For general document storage
- `resources` - For shared resources
- `wg-resources` - For working group resources (already created if WG feature is active)
- `signed-documents` - For DocuSeal signed PDFs (future DocuSeal integration)

## Need Help?

If you continue to experience issues:

1. Check the browser console for detailed error messages
2. Verify bucket exists in Supabase Dashboard → Storage
3. Check bucket policies in Supabase Dashboard → Storage → Policies
4. Contact support at info@bamas.xyz with:
   - The exact error message
   - Screenshots of your storage bucket settings
   - Your Supabase project ID

## Automated Setup (Advanced)

For automated setup using the Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Create bucket (requires additional configuration)
# Note: Manual creation in UI is recommended
```

For CLI-based bucket creation, refer to the [Supabase CLI documentation](https://supabase.com/docs/guides/cli).

