# Welcome Email Quick Start - Method 1 (Supabase Templates)

This is a simplified guide for setting up welcome emails using Supabase Email Templates (no code required).

## Quick Setup Steps

### 1. Configure Sender Email (2 minutes)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **BAMAS DATABASE**
3. Navigate to: **Settings** → **Auth** → **Email Templates**
4. Find **"From" email address** section
5. Set to: `info@bamas.xyz`
   - **Note**: If domain not verified, Supabase will use default sender temporarily

### 2. Customize Email Template (5 minutes)

1. In **Email Templates**, click on **"Confirm signup"** template
2. Click **"Edit"** button
3. Replace the **Subject** with:
   ```
   Welcome to BAMAS - Your Account is Ready!
   ```

4. Replace the **Body (HTML)** with this template:

```html
<h2 style="color: #0f766e; font-size: 28px; margin-bottom: 10px;">Welcome to BAMAS!</h2>
<p style="color: #666; font-size: 16px; margin-bottom: 30px;">Bulgarian Additive Manufacturing Association</p>

<p>Dear {{ .Name }},</p>

<p>Thank you for registering with the Bulgarian Additive Manufacturing Association (BAMAS). We're excited to have you join our community of innovators, manufacturers, and industry leaders.</p>

<p><strong>Your account has been successfully created. Please find your login credentials below:</strong></p>

<div style="background-color: #f0fdfa; border-left: 4px solid #0f766e; padding: 20px; margin: 20px 0; border-radius: 4px;">
  <p style="font-weight: bold; color: #0f766e; margin-bottom: 10px;">Your Login Email:</p>
  <p style="font-family: 'Courier New', monospace; color: #333; font-size: 14px; margin: 0;">{{ .Email }}</p>
</div>

<p>You can now access your account and explore all the features BAMAS has to offer:</p>
<ul>
  <li>Access member resources and documents</li>
  <li>Participate in polls and voting</li>
  <li>Connect with other members in the network</li>
  <li>Stay updated with events and agenda items</li>
</ul>

<div style="text-align: center; margin: 30px 0;">
  <a href="{{ .SiteURL }}/login" style="display: inline-block; padding: 12px 30px; background-color: #0f766e; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">Login to Your Account</a>
</div>

<p><strong>Important:</strong> Your account is currently pending approval. Once approved by an administrator, you'll have full access to all platform features.</p>

<p>If you have any questions or need assistance, please don't hesitate to contact us at <a href="mailto:info@bamas.xyz" style="color: #0f766e;">info@bamas.xyz</a>.</p>

<p>Welcome aboard!</p>

<p>Best regards,<br>
<strong>The BAMAS Team</strong></p>

<hr style="border: none; border-top: 1px solid #e5e5e5; margin: 40px 0 20px 0;">
<p style="font-size: 12px; color: #666; text-align: center;">
  This is an automated message from BAMAS (Bulgarian Additive Manufacturing Association)<br>
  For support, contact us at <a href="mailto:info@bamas.xyz" style="color: #0f766e;">info@bamas.xyz</a>
</p>
```

5. Click **"Save"** button

### 3. Verify Email Settings (1 minute)

1. Go to: **Authentication** → **Settings** → **Email Auth**
2. Ensure **"Enable email confirmations"** is set as desired:
   - **ON**: Users must confirm email before login (more secure)
   - **OFF**: Users can login immediately (easier for users)
3. Click **"Save"**

### 4. Test It! (2 minutes)

1. Register a new test user on your website
2. Check the email inbox (and spam folder)
3. Verify:
   - ✅ Email is received
   - ✅ Subject is "Welcome to BAMAS - Your Account is Ready!"
   - ✅ Contains user's email address
   - ✅ Login link works
   - ✅ Looks professional with BAMAS branding

## Optional: Use Custom Domain (info@bamas.xyz)

To send from `info@bamas.xyz` instead of Supabase's default sender:

### Option A: Verify Domain in Supabase
1. Go to: **Settings** → **Auth** → **Email Templates**
2. Look for **"Domain Verification"** section
3. Add domain: `bamas.xyz`
4. Follow DNS verification steps (add TXT records)

### Option B: Use Custom SMTP
1. Go to: **Settings** → **Auth** → **SMTP Settings**
2. Enter your email provider's SMTP details:
   - **SMTP Host**: `smtp.gmail.com` (or your provider)
   - **SMTP Port**: `587`
   - **SMTP User**: `info@bamas.xyz`
   - **SMTP Password**: Your email password or app password
   - **Sender Email**: `info@bamas.xyz`
   - **Sender Name**: `BAMAS`
3. Click **"Save"** and test connection

## That's It! 🎉

Your welcome emails are now set up. Every new user registration will automatically receive a welcome email with:
- Professional BAMAS branding
- Their login email address
- Link to login page
- Information about pending approval

## Troubleshooting

**Email not received?**
- Check spam folder
- Verify email template is saved
- Check Supabase logs: **Logs** → **Auth Logs**

**Wrong sender email?**
- Verify SMTP settings or domain verification
- Check "From" email in Email Templates settings

**Template not updating?**
- Clear browser cache
- Refresh Supabase Dashboard
- Re-save the template

## Need Help?

- Full guide: See `WELCOME_EMAIL_SETUP.md`
- Supabase Docs: https://supabase.com/docs/guides/auth/auth-email-templates
- Contact: info@bamas.xyz

---

**Setup Time**: ~10 minutes  
**Code Required**: None  
**Difficulty**: Easy ⭐

