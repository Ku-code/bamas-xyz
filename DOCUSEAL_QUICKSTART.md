# ⚡ DocuSeal Integration - Quick Start

## 🎯 What Was Fixed

**Problem**: Documents uploaded successfully but users couldn't sign them  
**Root Cause**: CORS - DocuSeal API blocks direct browser requests  
**Solution**: Supabase Edge Function as backend proxy

---

## 🚀 Deploy in 5 Minutes

### **1. Install CLI** (if not installed)
```bash
npm install -g supabase
```

### **2. Login**
```bash
supabase login
```

### **3. Link Project**
```bash
cd /Users/kuzo/Documents/GitHub/bama-digital-forge
supabase link --project-ref swgnchtjypwkxveffrpl
```

### **4. Add API Key Secret**

**Via Dashboard** (Recommended):
1. Go to https://supabase.com/dashboard → Your Project
2. Settings → Edge Functions → Secrets
3. Add secret:
   - Name: `DOCUSEAL_API_KEY`
   - Value: `Yp2hueWcnHFiiPc719GdM7PRFkV1UejL5JfSxTTVhvz`

**Or via CLI**:
```bash
supabase secrets set DOCUSEAL_API_KEY=Yp2hueWcnHFiiPc719GdM7PRFkV1UejL5JfSxTTVhvz
```

### **5. Deploy**
```bash
supabase functions deploy docuseal-proxy
```

**Expected output**:
```
✓ Function docuseal-proxy deployed successfully!
URL: https://swgnchtjypwkxveffrpl.supabase.co/functions/v1/docuseal-proxy
```

---

## ✅ Test It Works

### **Quick Test**

1. Go to https://bamas.xyz/dashboard
2. Navigate to **Documents**
3. Click **"Create Document"** → **"Upload File"**
4. Upload a PDF, set:
   - Classification: **Critical**
   - Required Signers: Select users
5. Click **"Add Document"**

**Success indicators**:
- ✅ Browser console shows: `"Template created"` and `"Submission created"`
- ✅ No errors in console
- ✅ Document appears in Signature Center

### **Verify in Database**

Run in Supabase SQL Editor:
```sql
SELECT 
  title,
  docuseal_template_id,
  docuseal_submission_id,
  signature_status
FROM documents
WHERE classification = 'CRITICAL'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected**: Both `docuseal_template_id` and `docuseal_submission_id` should have values (not NULL)

---

## 🐛 Troubleshooting

### **"Failed to deploy"**
- Make sure you're in project root: `cd /Users/kuzo/Documents/GitHub/bama-digital-forge`
- Run: `supabase functions deploy docuseal-proxy --no-verify-jwt`

### **Still NULL in database**
- Check Edge Function logs: Dashboard → Edge Functions → docuseal-proxy → Logs
- Restart dev server: `npm run dev`
- Clear browser cache: `Cmd+Shift+R`

### **"401 Unauthorized"**
- Verify secret is set: `supabase secrets list`
- Should show `DOCUSEAL_API_KEY`

---

## 📁 Files Changed

✅ Created:
- `supabase/functions/docuseal-proxy/index.ts` - Edge Function
- `supabase/functions/deno.json` - Deno config
- `supabase/functions/import_map.json` - Import map

✅ Updated:
- `src/lib/docuseal.ts` - Now uses Edge Function

---

## 🎉 Done!

After deployment:
- ✅ Documents upload properly
- ✅ DocuSeal templates and submissions created automatically
- ✅ Users can sign documents
- ✅ No more CORS errors
- ✅ API key stays secure

**For detailed instructions, see `DOCUSEAL_EDGE_FUNCTION_DEPLOYMENT.md`**

