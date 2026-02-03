# Membership Application Email Setup - Implementation Guide

## Overview
The membership application form is now configured to:
1. Generate a professional PDF version of the application.
2. Send the PDF and application details to **info@bamas.xyz**.
3. Send a confirmation copy with the PDF to the **applicant's email address**.

## Required Setup Steps

### 1. Deploy the Edge Function
The logic for generating PDFs and sending emails lives in a Supabase Edge Function. You must deploy it to your Supabase project:

```bash
# Login to Supabase CLI if you haven't already
supabase login

# Link your project (use your project ref from Supabase dashboard)
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the specific function
supabase functions deploy send-membership-application
```

### 2. Configure Environment Variables
The function requires a Resend API key to send emails.

1. Go to your [Resend Dashboard](https://resend.com) and create an API key.
2. Go to your Supabase Dashboard → **Edge Functions** → **send-membership-application** → **Settings**.
3. Add the following environment variable:
   - `RESEND_API_KEY`: Your API key from Resend.

*Note: If you haven't verified the `bamas.xyz` domain in Resend, you may need to update the `from` address in the Edge Function code to a verified domain or use the default `onboarding@resend.dev` for testing.*

### 3. Verify Frontend Configuration
Ensure your `.env` file (or Netlify environment variables) contains the correct Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## How It Works
1. **Submit**: When a user clicks "Submit Application", the frontend calls the `send-membership-application` Edge Function.
2. **Generate**: The function uses `pdf-lib` to create a professional PDF from the form data.
3. **Send (Admin)**: An email is sent to `info@bamas.xyz` with the application details and PDF attachment.
4. **Send (Applicant)**: A confirmation email is sent to the applicant with their PDF copy and next steps (payment).
5. **Success**: The user is redirected to the `/membership-success` page which displays payment details.

## Troubleshooting
- **"Nothing happens" on click**: Check the browser console (F12). I have added detailed logging. If you see "Supabase is not configured", verify your `.env` variables.
- **Emails not received**: Check the **Logs** → **Edge Functions** in your Supabase dashboard to see if the function encountered errors (e.g., invalid API key or unverified domain).
- **PDF issues**: I have updated the PDF generation to use standard ASCII characters to ensure compatibility with standard fonts.
