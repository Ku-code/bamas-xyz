# Welcome Email Fix - Implementation Guide

## Problem
Newly registered users are not receiving welcome emails.

## Solution Implemented

### 1. Client-Side Email Call (Primary Method)
- Modified `src/contexts/AuthContext.tsx` to explicitly call the Edge Function after user registration
- This ensures emails are sent even if the database trigger fails
- Non-blocking - registration succeeds even if email fails

### 2. Database Trigger (Backup Method)
- The existing trigger `trigger_send_welcome_email` still fires as a backup
- Simplified in migration `014_simplify_welcome_email.sql`

### 3. Edge Function Enhancement
- Updated `supabase/functions/send-welcome-email/index.ts` to use Supabase Admin API
- Falls back to Supabase email templates if Admin API fails

## Required Setup Steps

### Step 1: Deploy the Edge Function

```bash
# Make sure you have Supabase CLI installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project (get project ref from Supabase Dashboard)
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
supabase functions deploy send-welcome-email
```

### Step 2: Configure Edge Function Environment Variables

1. Go to Supabase Dashboard → Edge Functions → send-welcome-email → Settings
2. Add these environment variables:
   - `SUPABASE_URL`: Your project URL (e.g., `https://xxxxx.supabase.co`)
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key (from Settings → API)
   - `APP_URL`: Your website URL (e.g., `https://bamas.xyz`)
   - `RESEND_API_KEY`: (Optional) If using Resend for email delivery

### Step 3: Apply Database Migration

```bash
# Apply the simplified welcome email migration
supabase db push
```

Or manually run `supabase/migrations/014_simplify_welcome_email.sql` in Supabase SQL Editor.

### Step 4: Configure Supabase Email Templates (Recommended)

1. Go to Supabase Dashboard → Settings → Auth → Email Templates
2. Find **"Confirm signup"** template
3. Customize it with welcome message (see `WELCOME_EMAIL_SETUP.md`)
4. Set **"From" email address** to `info@bamas.xyz` (or use default)

### Step 5: Enable Email Sending

1. Go to Supabase Dashboard → Settings → Auth → Email Auth
2. Ensure email sending is enabled
3. (Optional) Enable "Email confirmations" if you want users to confirm email

## How It Works Now

1. **User Registers**:
   - User signs up via `signUpWithEmail()`
   - User profile is created in database
   - Client-side code calls Edge Function to send welcome email
   - Database trigger also fires (as backup)

2. **Email Sending**:
   - Edge Function receives the request
   - Tries to send via Resend API (if configured)
   - Falls back to Supabase Admin API
   - Falls back to Supabase email templates

3. **Result**:
   - User receives welcome email
   - Registration succeeds even if email fails (non-blocking)

## Testing

1. Register a new test user
2. Check email inbox (and spam folder)
3. Verify email is received
4. Check Supabase Logs → Edge Functions for any errors

## Troubleshooting

### Emails Still Not Sending

1. **Check Edge Function Deployment**:
   - Go to Supabase Dashboard → Edge Functions
   - Verify `send-welcome-email` is listed and deployed

2. **Check Environment Variables**:
   - Verify all required env vars are set in Edge Function settings
   - Service role key must be correct

3. **Check Supabase Email Settings**:
   - Go to Settings → Auth → Email Auth
   - Ensure email sending is enabled
   - Check SMTP settings if using custom SMTP

4. **Check Browser Console**:
   - Look for errors when registering
   - Check if Edge Function is being called

5. **Check Supabase Logs**:
   - Go to Logs → Edge Functions
   - Look for errors in `send-welcome-email` function
   - Check Postgres Logs for trigger warnings

### Alternative: Use Supabase Email Templates Only

If Edge Function approach doesn't work, you can rely solely on Supabase Email Templates:

1. Disable the client-side Edge Function call (comment it out in `AuthContext.tsx`)
2. Configure Supabase Email Templates (Step 4 above)
3. Enable email confirmations
4. Users will receive the "Confirm signup" email which can be customized as welcome email

## Files Modified

- `src/contexts/AuthContext.tsx` - Added explicit Edge Function call after registration
- `src/lib/supabase.ts` - Added `getSupabaseUrl()` helper
- `supabase/functions/send-welcome-email/index.ts` - Enhanced to use Admin API
- `supabase/migrations/014_simplify_welcome_email.sql` - Simplified trigger

## Next Steps

1. Deploy the Edge Function (Step 1)
2. Configure environment variables (Step 2)
3. Apply database migration (Step 3)
4. Test with a new user registration
5. Verify email is received

