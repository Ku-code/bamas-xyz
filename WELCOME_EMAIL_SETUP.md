# Welcome Email Setup Guide for BAMAS

This guide will help you set up automatic welcome emails for new user registrations using Supabase.

## Overview

There are two approaches to sending welcome emails:
1. **Supabase Email Templates** (Recommended - Easiest)
2. **Edge Function + Custom Email Service** (More control)

---

## Method 1: Supabase Email Templates (Recommended)

This is the simplest approach and requires no code deployment.

### Step 1: Configure Sender Email

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **BAMAS DATABASE**
3. Navigate to: **Settings** → **Auth** → **Email Templates**
4. Scroll to **"From" email address**
5. Set the sender email to: `info@bamas.xyz`
   - **Note**: If you haven't verified the domain, Supabase will use a default sender like `noreply@mail.app.supabase.io`
   - To use `info@bamas.xyz`, you need to verify your domain (see Step 4 below)

### Step 2: Customize Welcome Email Template

1. In **Email Templates**, find **"Confirm signup"** template
2. Click **"Edit"** or **"Customize"**
3. Replace the template with the following HTML:

```html
<h2>Welcome to BAMAS!</h2>
<p>Dear {{ .Name }},</p>

<p>Thank you for registering with the Bulgarian Additive Manufacturing Association (BAMAS). We're excited to have you join our community.</p>

<p><strong>Your Login Credentials:</strong></p>
<div style="background-color: #f0fdfa; padding: 15px; border-left: 4px solid #0f766e; margin: 20px 0;">
  <p><strong>Email:</strong> {{ .Email }}</p>
</div>

<p>You can now access your account at: <a href="{{ .SiteURL }}/login">Login to BAMAS</a></p>

<p><strong>Note:</strong> Your account is currently pending approval. Once approved by an administrator, you'll have full access to all platform features.</p>

<p>If you have any questions, contact us at <a href="mailto:info@bamas.xyz">info@bamas.xyz</a>.</p>

<p>Welcome aboard!<br>
The BAMAS Team</p>
```

4. **Subject Line**: Change to: `Welcome to BAMAS - Your Account is Ready!`
5. Click **"Save"**

### Step 3: Enable Email Confirmation (Optional)

1. Navigate to: **Authentication** → **Settings** → **Email Auth**
2. Toggle **"Enable email confirmations"**:
   - **ON**: Users must confirm email before login (recommended for security)
   - **OFF**: Users can login immediately after registration
3. Click **"Save"**

### Step 4: Verify Custom Domain (For info@bamas.xyz)

To send emails from `info@bamas.xyz`:

1. Go to: **Settings** → **Auth** → **SMTP Settings**
2. Choose one of these options:

#### Option A: Use Supabase's Email Service (Free Tier)
- Supabase provides email sending, but you'll need to verify your domain
- Go to **Settings** → **Auth** → **Email Templates**
- Look for domain verification section
- Add your domain `bamas.xyz`
- Follow DNS verification steps (add TXT records to your domain)

#### Option B: Use Custom SMTP (Recommended for Production)
1. Get SMTP credentials from your email provider (Gmail, SendGrid, Mailgun, etc.)
2. In **SMTP Settings**, enter:
   - **SMTP Host**: `smtp.gmail.com` (or your provider's SMTP)
   - **SMTP Port**: `587`
   - **SMTP User**: `info@bamas.xyz`
   - **SMTP Password**: Your email account password or app password
   - **Sender Email**: `info@bamas.xyz`
   - **Sender Name**: `BAMAS`
3. Click **"Save"**
4. Test the connection

### Step 5: Test Welcome Email

1. Register a new test user on your website
2. Check the email inbox for the welcome email
3. Verify:
   - Email is received
   - Sender is `info@bamas.xyz` (or Supabase default if domain not verified)
   - Content includes user's email address
   - Login link works correctly

---

## Method 2: Edge Function + Custom Email Service (Advanced)

This method gives you more control but requires deploying code.

### Step 1: Deploy Edge Function

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```
   (Find your project ref in Supabase Dashboard → Settings → General)

4. Deploy the function:
   ```bash
   supabase functions deploy send-welcome-email
   ```

### Step 2: Set Environment Variables

1. Go to: **Edge Functions** → **send-welcome-email** → **Settings**
2. Add these environment variables:
   - `SUPABASE_URL`: Your project URL (e.g., `https://xxxxx.supabase.co`)
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key (from Settings → API)
   - `APP_URL`: Your website URL (e.g., `https://bamas.xyz`)
   - `RESEND_API_KEY`: (Optional) If using Resend for email delivery

### Step 3: Set Up Resend (Optional - Recommended)

1. Sign up at [Resend.com](https://resend.com)
2. Verify your domain `bamas.xyz`
3. Get your API key
4. Add it as `RESEND_API_KEY` in Edge Function settings

### Step 4: Run Database Migration

1. Go to: **SQL Editor** in Supabase Dashboard
2. Open the migration file: `supabase/migrations/003_welcome_email.sql`
3. Copy and paste the SQL into the editor
4. Click **"Run"**
5. Verify the trigger was created:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'trigger_send_welcome_email';
   ```

### Step 5: Configure Database Settings (Optional)

If using the database trigger approach, set these in Supabase:

1. Go to: **Database** → **Settings** → **Database Settings**
2. Add custom settings (if needed):
   - `app.settings.supabase_url`: Your project URL
   - `app.settings.service_role_key`: Your service role key

**Note**: The Edge Function approach doesn't require these settings.

### Step 6: Test

1. Register a new user
2. Check email inbox
3. Verify welcome email is received

---

## Troubleshooting

### Emails Not Sending

1. **Check Supabase Logs**:
   - Go to **Logs** → **Edge Functions**
   - Look for errors in `send-welcome-email` function

2. **Check Email Settings**:
   - Verify SMTP settings are correct
   - Test SMTP connection in Supabase Dashboard

3. **Check Spam Folder**:
   - Welcome emails might be marked as spam initially

4. **Verify Domain**:
   - If using custom domain, ensure DNS records are correct
   - Check domain verification status in Supabase

### Email Template Not Updating

1. Clear browser cache
2. Try editing template again
3. Check if changes are saved (refresh page)

### Edge Function Errors

1. Check function logs in Supabase Dashboard
2. Verify environment variables are set correctly
3. Test function manually via HTTP request (see Edge Function README)

---

## Quick Start Checklist

- [ ] Configure sender email in Supabase Dashboard
- [ ] Customize "Confirm signup" email template
- [ ] Set up SMTP or verify domain (for custom sender)
- [ ] Test registration and verify email is received
- [ ] (Optional) Deploy Edge Function for advanced features
- [ ] (Optional) Run database migration for trigger-based emails

---

## Recommended Approach

**For most users**: Use **Method 1** (Supabase Email Templates)
- No code deployment needed
- Easy to customize
- Works out of the box
- Free tier included

**For advanced users**: Use **Method 2** (Edge Function)
- More control over email content
- Can use external email services (Resend, SendGrid)
- Better for high-volume sending
- Requires code deployment

---

## Support

If you encounter issues:
1. Check Supabase documentation: https://supabase.com/docs
2. Review Supabase logs for errors
3. Contact Supabase support if needed
4. For BAMAS-specific issues, contact: info@bamas.xyz

---

**Last Updated**: Based on Supabase Dashboard as of 2024
**Project**: BAMAS Digital Forge
**Email**: info@bamas.xyz

