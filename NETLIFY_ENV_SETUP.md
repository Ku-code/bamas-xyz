# 🚀 Fix DocuSeal on Netlify - EXACT STEPS

## 🎯 **The Problem**

Your code works locally but NOT on `bamas.xyz` because **Netlify doesn't have the environment variables** that the DocuSeal Edge Function needs.

---

## ✅ **SOLUTION: Add Environment Variables to Netlify**

### **Step 1: Go to Netlify Dashboard**

1. Open: https://app.netlify.com
2. Login if needed
3. Click on your site (the one that serves bamas.xyz)

### **Step 2: Go to Environment Variables**

1. Click **"Site configuration"** in the left sidebar
2. Click **"Environment variables"** 
3. Click **"Add a variable"** button (or **"Add environment variables"**)

### **Step 3: Add Supabase URL**

**Variable 1:**
- **Key**: `VITE_SUPABASE_URL`
- **Values**: `https://swgnchtjypwkxveffrpl.supabase.co`
- **Scopes**: Check "All" or "Production" and "Build"
- Click **"Create variable"**

### **Step 4: Add Supabase Anon Key**

**Variable 2:**
- **Key**: `VITE_SUPABASE_ANON_KEY`
- **Values**: `YOUR_ANON_KEY_HERE`
- **Scopes**: Check "All" or "Production" and "Build"
- Click **"Create variable"**

**To get your Anon Key:**
1. Go to https://supabase.com/dashboard
2. Select project: **BAMAS DATABASE**
3. Click **Settings** (gear icon, bottom left)
4. Click **API** in sidebar
5. Copy the **`anon`** **`public`** key (the long one that starts with `eyJ...`)
6. Paste it in Netlify

### **Step 5: Trigger a New Deploy**

**Option A: Via Netlify Dashboard**
1. Go to **"Deploys"** tab
2. Click **"Trigger deploy"** dropdown (top right)
3. Click **"Deploy site"**

**Option B: Push to GitHub**
```bash
cd /Users/kuzo/Documents/GitHub/bama-digital-forge
git add .
git commit -m "Trigger rebuild with env vars"
git push origin main
```

Netlify will automatically rebuild and deploy.

---

## ✅ **Verify It Works**

After the deploy finishes (2-3 minutes):

### **Test 1: Check Environment Variables**

1. Go to https://bamas.xyz/dashboard
2. Open console (F12)
3. Run:
   ```javascript
   console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
   console.log('Key exists:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'YES' : 'NO');
   ```

**Expected**:
```
URL: https://swgnchtjypwkxveffrpl.supabase.co
Key exists: YES
```

**If you see `undefined`**, the variables weren't set correctly!

### **Test 2: Create a Critical Document**

1. Go to **Documents** section
2. Click **"Create Document"** → **"Upload File"**
3. Upload a PDF
4. Set Classification: **Critical**
5. Select Required Signers
6. **Open console** (F12)
7. Click **"Add Document"**

**You should see**:
```
[DocuSeal] Creating template via Edge Function: [name]
[DocuSeal] Template created successfully: tmpl_...
[DocuSeal] Submission created successfully: subm_...
```

### **Test 3: Check Database**

Run in Supabase SQL Editor:
```sql
SELECT 
  title,
  docuseal_template_id,
  docuseal_submission_id
FROM documents
WHERE classification = 'CRITICAL'
ORDER BY created_at DESC
LIMIT 1;
```

**Both IDs should be NOT NULL!** ✅

---

## 📸 **Visual Guide**

**In Netlify:**
```
Site configuration
  ├── Environment variables
  │   ├── VITE_SUPABASE_URL = https://swgnchtjypwkxveffrpl.supabase.co
  │   └── VITE_SUPABASE_ANON_KEY = eyJ... [your key]
  └── Deploys
      └── Trigger deploy → Deploy site
```

---

## 🐛 **Troubleshooting**

### **"Variables not showing up"**
- Make sure you set **"All scopes"** or at least **"Production"**
- Trigger a **new deploy** (not just clear cache)
- Wait for build to complete (check Deploys tab)

### **"Still getting error"**
- Hard refresh browser: `Cmd+Shift+R`
- Check deploy logs in Netlify for build errors
- Verify variables are set: Netlify Dashboard → Site configuration → Environment variables

### **"Key not found in Supabase"**
- Make sure you copied the **`anon`** key, not `service_role`
- The key should start with `eyJ`
- It's in: Project Settings → API → Project API keys → `anon` `public`

---

## ✅ **Success Checklist**

- [ ] Logged into Netlify
- [ ] Added `VITE_SUPABASE_URL` variable
- [ ] Added `VITE_SUPABASE_ANON_KEY` variable
- [ ] Triggered new deploy
- [ ] Deploy finished successfully
- [ ] Console shows environment variables
- [ ] Created test Critical document
- [ ] Console shows `[DocuSeal]` messages
- [ ] Database has DocuSeal IDs
- [ ] Can sign documents

---

**Once all steps are complete, DocuSeal will work on bamas.xyz!** 🎉

**Do these steps now and let me know the result!** 🚀

