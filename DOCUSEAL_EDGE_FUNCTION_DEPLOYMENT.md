# 🚀 DocuSeal Edge Function Deployment Guide

## 📋 Overview

This guide will help you deploy the DocuSeal Edge Function to fix the CORS issue preventing document signatures.

**Problem**: DocuSeal API blocks direct browser requests (CORS policy)  
**Solution**: Use Supabase Edge Function as a backend proxy

---

## ⚡ Quick Start

### **Step 1: Install Supabase CLI**

```bash
npm install -g supabase
```

### **Step 2: Login to Supabase**

```bash
supabase login
```

This will open a browser window for authentication.

### **Step 3: Link Your Project**

```bash
cd /Users/kuzo/Documents/GitHub/bama-digital-forge
supabase link --project-ref swgnchtjypwkxveffrpl
```

### **Step 4: Add DocuSeal API Key to Supabase**

**Option A: Via Supabase Dashboard (Recommended)**

1. Go to https://supabase.com/dashboard
2. Select your project: **BAMAS DATABASE**
3. Go to **Project Settings** (⚙️ icon in bottom left)
4. Click **Edge Functions** in the left sidebar
5. Scroll to **Secrets** section
6. Click **Add secret**
7. Enter:
   - **Name**: `DOCUSEAL_API_KEY`
   - **Value**: `Yp2hueWcnHFiiPc719GdM7PRFkV1UejL5JfSxTTVhvz`
8. Click **Save**

**Option B: Via CLI**

```bash
supabase secrets set DOCUSEAL_API_KEY=Yp2hueWcnHFiiPc719GdM7PRFkV1UejL5JfSxTTVhvz
```

### **Step 5: Deploy the Edge Function**

```bash
supabase functions deploy docuseal-proxy
```

You should see:
```
Deploying function docuseal-proxy...
Function docuseal-proxy deployed successfully!
URL: https://swgnchtjypwkxveffrpl.supabase.co/functions/v1/docuseal-proxy
```

---

## ✅ Verify Deployment

### **Test 1: Check Function is Live**

Run this in your browser console:

```javascript
fetch('https://swgnchtjypwkxveffrpl.supabase.co/functions/v1/docuseal-proxy', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_SUPABASE_ANON_KEY'
  },
  body: JSON.stringify({
    action: 'get_templates',
    data: {}
  })
})
.then(r => r.json())
.then(data => console.log('✅ Edge Function works!', data))
.catch(err => console.error('❌ Error:', err));
```

Replace `YOUR_SUPABASE_ANON_KEY` with your actual anon key from `.env`.

### **Test 2: Create a Critical Document**

1. Go to https://bamas.xyz/dashboard
2. Navigate to **Documents**
3. Click **"Create Document"**
4. Click **"Upload File"** button
5. Select a PDF file
6. Set:
   - **Title**: Test DocuSeal Integration
   - **Classification**: **Critical**
   - **Required Signers**: Select some users
7. Click **"Add Document"**

**Expected result**:
- ✅ Success message appears
- ✅ Console shows: `"Template created: [template_id]"`
- ✅ Console shows: `"Submission created: [submission_id]"`
- ✅ Document appears in **Signature Center**

### **Test 3: Check Database**

Run this in Supabase SQL Editor:

```sql
SELECT 
  id,
  title,
  classification,
  signature_status,
  docuseal_template_id,
  docuseal_submission_id,
  created_at
FROM documents
WHERE classification = 'CRITICAL'
ORDER BY created_at DESC
LIMIT 5;
```

**Expected result**: 
- ✅ `docuseal_template_id` is **NOT NULL**
- ✅ `docuseal_submission_id` is **NOT NULL**
- ✅ `signature_status` is **PENDING**

---

## 🔧 Troubleshooting

### **Issue: "Failed to deploy function"**

**Solution**: Make sure you're in the project root directory:

```bash
cd /Users/kuzo/Documents/GitHub/bama-digital-forge
pwd  # Should show the project root
```

### **Issue: "Secret not found"**

**Solution**: Check if secret is set:

```bash
supabase secrets list
```

You should see `DOCUSEAL_API_KEY` in the list.

### **Issue: "401 Unauthorized" when calling Edge Function**

**Solution**: Make sure your frontend has the correct Supabase anon key in `.env`:

```bash
VITE_SUPABASE_URL=https://swgnchtjypwkxveffrpl.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

After updating `.env`, restart the dev server:

```bash
npm run dev
```

### **Issue: "CORS error" still appearing**

**Solution**: Clear browser cache and hard refresh:
- **Mac**: `Cmd + Shift + R`
- **Windows**: `Ctrl + Shift + R`

### **Issue: Documents created but no DocuSeal IDs**

**Check Edge Function Logs**:

1. Go to Supabase Dashboard
2. Click **Edge Functions** in left sidebar
3. Click **docuseal-proxy**
4. Click **Logs** tab
5. Look for error messages

Common errors:
- **"Invalid API key"** → Check DOCUSEAL_API_KEY secret
- **"Template creation failed"** → Check file is valid PDF
- **"Unauthorized"** → Check Authorization header is passed from frontend

---

## 📝 Frontend Changes

The following files were updated to use the Edge Function:

### **src/lib/docuseal.ts**
- ✅ Now calls Edge Function instead of DocuSeal API directly
- ✅ No more CORS errors
- ✅ API key stays secure on backend

### **What Changed:**
- **Before**: `fetch('https://api.docuseal.co/templates', ...)`
- **After**: `fetch('https://[project].supabase.co/functions/v1/docuseal-proxy', ...)`

---

## 🔐 Security Notes

### **✅ Secure**
- API key is stored in Supabase secrets (backend only)
- Not exposed in browser or frontend code
- Only authenticated users can call Edge Function

### **⚠️ Important**
- Never commit `.env` file to git
- `.env` is already in `.gitignore` ✅
- Supabase secrets are encrypted

---

## 🎯 Next Steps After Deployment

1. **Test Document Creation**
   - Create a Critical document
   - Verify DocuSeal IDs are saved

2. **Test Document Signing**
   - Login as a user who needs to sign
   - Go to **Signature Center** (Подписи)
   - Click **"Sign Now"**
   - DocuSeal form should appear

3. **Monitor Edge Function**
   - Check Supabase Dashboard → Edge Functions → Logs
   - Look for any errors or issues

4. **Update Existing Documents** (Optional)
   - If you have old documents without DocuSeal IDs
   - Delete them and recreate
   - Or manually set up via DocuSeal dashboard

---

## 📞 Support

If you encounter issues:

1. **Check Edge Function Logs**: Supabase Dashboard → Edge Functions → docuseal-proxy → Logs
2. **Check Browser Console**: F12 → Console tab → Look for errors
3. **Check Database**: Run SQL queries to verify data
4. **Test API Key**: Run the verification tests above

---

## ✅ Success Checklist

- [ ] Supabase CLI installed
- [ ] Logged in to Supabase
- [ ] Project linked
- [ ] DOCUSEAL_API_KEY secret added
- [ ] Edge Function deployed
- [ ] Edge Function test passes
- [ ] Critical document created successfully
- [ ] DocuSeal IDs appear in database
- [ ] Users can see documents in Signature Center
- [ ] DocuSeal form loads when signing

---

**Once all checklist items are ✅, your DocuSeal integration is fully working!** 🎉

