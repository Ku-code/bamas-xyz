# 🔧 RLS Policy Fix Instructions

## ⚠️ Problem
You're getting **"new row violates row-level security policy"** error when trying to upload Critical documents.

## ✅ Solution

### **Quick Fix (Recommended)**

Run this file in **Supabase SQL Editor**:
```
supabase/COMPLETE_RLS_FIX.sql
```

This script will:
1. ✅ Check your current user role
2. ✅ Make you a superadmin (if not already)
3. ✅ Remove all conflicting RLS policies
4. ✅ Create proper classification-aware policies
5. ✅ Verify everything is working

### **Step-by-Step Instructions**

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Click on "SQL Editor" in the left sidebar

2. **Run the Complete Fix**
   - Click "+ New Query"
   - Copy the entire contents of `supabase/COMPLETE_RLS_FIX.sql`
   - Paste into the SQL editor
   - Click "Run" or press `Cmd+Enter` / `Ctrl+Enter`

3. **Verify the Results**
   - The script will output several results
   - Look for the last result that should say: **"✅ You can create Critical documents"**
   - Check that your role shows as `superadmin`

4. **Test Document Upload**
   - Go back to your dashboard: https://bamas.xyz/dashboard
   - Try creating a Critical document again
   - It should work without errors now!

---

## 🔍 What Was Wrong?

The issue was caused by **multiple conflicting RLS policies** on the `documents` table:

1. **Old Policy**: "Authenticated users can create documents" - allowed all users to create any document
2. **New Policy**: "Only superadmin can create Critical documents" - restricted Critical documents to superadmins

Both policies had to pass for INSERT operations, but they were checking different conditions, causing conflicts.

## ✅ What Was Fixed?

We **replaced** the multiple policies with **single comprehensive policies** that:

- ✅ Allow **all authenticated users** to create/update `GENERAL` and `PROCEDURAL` documents
- ✅ Allow **only superadmins** to create/update `CRITICAL` documents
- ✅ Ensure the user is the document creator
- ✅ Properly check user roles from the `users` table

---

## 📋 Alternative: Manual Steps

If you prefer to run commands one at a time:

### 1. Check Your Role
```sql
SELECT id, email, name, role, status
FROM users
WHERE id = auth.uid();
```

### 2. Make Yourself Superadmin
```sql
UPDATE users
SET role = 'superadmin', status = 'approved', approved = true
WHERE id = auth.uid();
```

### 3. Fix the Policies
```sql
-- Drop old policies
DROP POLICY IF EXISTS "Authenticated users can create documents" ON documents;
DROP POLICY IF EXISTS "Only superadmin can create Critical documents" ON documents;

-- Create new comprehensive policy
CREATE POLICY "Users can create documents with classification rules"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND (
      (classification IS NULL OR classification IN ('GENERAL', 'PROCEDURAL'))
      OR (
        classification = 'CRITICAL'
        AND EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role = 'superadmin'
        )
      )
    )
  );
```

---

## 🆘 Still Having Issues?

### Check These:

1. **Are you logged in?**
   ```sql
   SELECT auth.uid(); -- Should return your user ID, not NULL
   ```

2. **Is your role actually superadmin?**
   ```sql
   SELECT role FROM users WHERE id = auth.uid();
   ```

3. **Are the policies applied?**
   ```sql
   SELECT policyname, cmd 
   FROM pg_policies 
   WHERE tablename = 'documents';
   ```

4. **Clear browser cache and reload** the dashboard

---

## 📝 Future Migrations

The migration files have been updated:
- `supabase/migrations/009_document_classification_and_roles.sql`
- `supabase/migrations/009_document_classification_and_roles_UPDATED.sql`

These now include the fixed policies, so future deployments will work correctly.

---

## ✅ Success Indicator

After applying the fix, you should be able to:
- ✅ Create documents with "General" classification (any user)
- ✅ Create documents with "Procedural" classification (any user)
- ✅ Create documents with "Critical" classification (superadmin only)
- ✅ Upload files and assign required signers for Critical documents
- ✅ No more "row violates row-level security policy" errors

---

**Need help?** Check that you followed all steps in `COMPLETE_RLS_FIX.sql` and that your user role is `superadmin`.

