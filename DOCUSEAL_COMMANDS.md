# 🎯 DocuSeal Edge Function - Command Reference

## 📦 Installation & Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Check installation
supabase --version

# Login to Supabase
supabase login

# Navigate to project
cd /Users/kuzo/Documents/GitHub/bama-digital-forge

# Link to your Supabase project
supabase link --project-ref swgnchtjypwkxveffrpl
```

---

## 🔐 Secrets Management

```bash
# Set DocuSeal API key
supabase secrets set DOCUSEAL_API_KEY=Yp2hueWcnHFiiPc719GdM7PRFkV1UejL5JfSxTTVhvz

# List all secrets
supabase secrets list

# Unset a secret (if needed)
supabase secrets unset DOCUSEAL_API_KEY
```

---

## 🚀 Deployment

```bash
# Deploy the Edge Function
supabase functions deploy docuseal-proxy

# Deploy with no JWT verification (if having auth issues)
supabase functions deploy docuseal-proxy --no-verify-jwt

# Deploy and watch logs
supabase functions deploy docuseal-proxy && supabase functions logs docuseal-proxy
```

---

## 📊 Monitoring & Logs

```bash
# View real-time logs
supabase functions logs docuseal-proxy

# View logs with follow (continuous)
supabase functions logs docuseal-proxy --follow

# List all Edge Functions
supabase functions list

# Get function details
supabase functions get docuseal-proxy
```

---

## 🧪 Testing

### **Test Edge Function Directly**

```bash
# Test with curl
curl -X POST https://swgnchtjypwkxveffrpl.supabase.co/functions/v1/docuseal-proxy \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "get_templates",
    "data": {}
  }'
```

### **Test in Browser Console**

```javascript
// Test Edge Function
fetch('https://swgnchtjypwkxveffrpl.supabase.co/functions/v1/docuseal-proxy', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + import.meta.env.VITE_SUPABASE_ANON_KEY
  },
  body: JSON.stringify({
    action: 'get_templates',
    data: {}
  })
})
.then(r => r.json())
.then(data => console.log('✅ Success:', data))
.catch(err => console.error('❌ Error:', err));
```

---

## 🗄️ Database Queries

### **Check Documents**

```sql
-- Check recent Critical documents
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
LIMIT 10;
```

### **Check Signatures**

```sql
-- Check signature status
SELECT 
  ds.id,
  d.title as document_title,
  u.name as signer_name,
  u.email as signer_email,
  ds.status,
  ds.signed_at,
  ds.created_at
FROM document_signatures ds
JOIN documents d ON d.id = ds.document_id
JOIN users u ON u.id = ds.user_id
WHERE d.classification = 'CRITICAL'
ORDER BY ds.created_at DESC
LIMIT 10;
```

### **Fix Null DocuSeal IDs** (if needed)

```sql
-- Delete documents with NULL DocuSeal IDs
DELETE FROM documents
WHERE classification = 'CRITICAL'
  AND (docuseal_template_id IS NULL OR docuseal_submission_id IS NULL);

-- Then recreate them through the UI
```

---

## 🛠️ Development

### **Local Testing** (Optional)

```bash
# Serve Edge Function locally
supabase functions serve docuseal-proxy

# Test locally
curl -X POST http://localhost:54321/functions/v1/docuseal-proxy \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action":"get_templates","data":{}}'
```

---

## 🔄 Updates & Redeployment

```bash
# After making changes to Edge Function code
cd /Users/kuzo/Documents/GitHub/bama-digital-forge

# Redeploy
supabase functions deploy docuseal-proxy

# View logs to verify
supabase functions logs docuseal-proxy
```

---

## 🧹 Cleanup

```bash
# Delete Edge Function (if needed)
supabase functions delete docuseal-proxy

# Unset secrets
supabase secrets unset DOCUSEAL_API_KEY

# Unlink project
supabase unlink
```

---

## ⚡ Quick Commands

```bash
# Full deploy from scratch
supabase login && \
cd /Users/kuzo/Documents/GitHub/bama-digital-forge && \
supabase link --project-ref swgnchtjypwkxveffrpl && \
supabase secrets set DOCUSEAL_API_KEY=Yp2hueWcnHFiiPc719GdM7PRFkV1UejL5JfSxTTVhvz && \
supabase functions deploy docuseal-proxy

# Redeploy and watch logs
supabase functions deploy docuseal-proxy && \
supabase functions logs docuseal-proxy --follow

# Check status
supabase functions list && \
supabase secrets list
```

---

## 🆘 Troubleshooting Commands

```bash
# Check if logged in
supabase projects list

# Re-login if needed
supabase logout && supabase login

# Check project link
supabase status

# Force redeploy
supabase functions deploy docuseal-proxy --no-verify-jwt --force

# View detailed error logs
supabase functions logs docuseal-proxy | grep ERROR
```

---

## 📝 Notes

- All commands assume you're in the project root: `/Users/kuzo/Documents/GitHub/bama-digital-forge`
- Replace `YOUR_SUPABASE_ANON_KEY` with your actual anon key from `.env`
- Edge Function URL: `https://swgnchtjypwkxveffrpl.supabase.co/functions/v1/docuseal-proxy`
- DocuSeal API Key is stored securely in Supabase Secrets

---

**Quick Reference**: Keep this file handy for deployment and troubleshooting! 🚀

