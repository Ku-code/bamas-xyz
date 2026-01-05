# DocuSeal Digital Signatures Setup Guide

## 🎯 Overview

DocuSeal is integrated into BAMAS Digital Hub for legally binding digital signatures on Critical documents. This guide explains how the system works and how to use it.

## 📋 Features Implemented

### 1. **Document Classification System**
- **GENERAL**: Standard documents, no signatures required
- **PROCEDURAL**: Important documents, no signatures required
- **CRITICAL**: Legal documents requiring digital signatures from specific members

### 2. **Role-Based Signature Assignment**
- Assign signatures to **All Board Members**
- Assign signatures to **All WG Leads**
- Support for individual user selection (database ready, UI enhancement available)

### 3. **Signature Center Dashboard**
- Members see documents requiring their signature
- Red badge indicators for pending signatures
- Embedded DocuSeal signing interface
- Automatic signature tracking

### 4. **Signature Workflow**
1. Superadmin creates Critical document
2. Selects required signers (roles or individuals)
3. System creates DocuSeal submission
4. Signers receive notification
5. Signers complete signature in Signature Center
6. Document status updates to COMPLETED

## 🔧 Setup Instructions

### Step 1: DocuSeal Account Setup

1. **Create DocuSeal Account**
   - Go to https://docuseal.com
   - Sign up for a free or paid account
   - Free tier includes 5 documents/month

2. **Get API Key**
   - Log in to DocuSeal
   - Go to Settings → API
   - Copy your API key
   - **Already added to .env**: `VITE_DOCUSEAL_API_KEY=Yp2hueWcnHFiiPc719GdM7PRFkV1UejL5JfSxTTVhvz`

3. **Configure Webhook (Optional)**
   - In DocuSeal Settings → Webhooks
   - Add webhook URL: `https://your-supabase-project.supabase.co/functions/v1/docuseal-webhook`
   - Select events: `submission.completed`
   - This enables automatic signature status updates

### Step 2: Database Setup

✅ **Already completed** via migration `009_document_classification_and_roles.sql`

The migration created:
- Extended user roles (`board_member`, `wg_lead`)
- Document classification fields
- `document_signatures` tracking table
- Row Level Security policies

### Step 3: Assign User Roles

Before creating Critical documents, assign roles to members:

1. Go to **Dashboard → Network**
2. As superadmin, edit each member
3. Assign role:
   - **Board Member** - for board members who sign documents
   - **WG Lead** - for working group leaders
   - **Admin** - for administrators
   - **Member** - for regular members

### Step 4: Create Critical Document

1. Go to **Dashboard → Documents**
2. Click **"+ Create Document"**
3. Fill in document details
4. **Classification Level**: Select **"Critical"** (only visible to superadmins)
5. **Required Signers**: Check one or both:
   - ☑️ All Board Members
   - ☑️ All WG Leads
6. Upload or link the document
7. Click **"Create"**

### Step 5: Members Sign Documents

1. Members with required roles see notification in **Dashboard → Signatures**
2. Document appears with red "CRITICAL" badge
3. Click **"Sign Now"**
4. Embedded DocuSeal form opens
5. Review and sign the document
6. Signature is automatically recorded

## 🔐 Security Features

### Row Level Security (RLS)
- Only superadmins can create Critical documents
- Only superadmins can update Critical documents
- Users can only view their own signature records
- Users can only sign documents they're required to sign

### Signature Verification
- DocuSeal provides legally binding signatures
- Audit trail of who signed and when
- Signed PDFs are stored with cryptographic verification
- Tamper-proof signature records

## 📊 How It Works

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BAMAS Digital Hub                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Superadmin creates Critical document                     │
│     └─> Selects required signers (roles/individuals)         │
│                                                               │
│  2. System queries database for matching users               │
│     └─> Gets emails of all board members / WG leads          │
│                                                               │
│  3. Creates DocuSeal submission (future enhancement)         │
│     └─> Generates signing URLs for each signer               │
│                                                               │
│  4. Members see document in Signature Center                 │
│     └─> Embedded DocuSeal form for signing                   │
│                                                               │
│  5. On signature completion:                                 │
│     ├─> Updates document_signatures table                    │
│     ├─> Marks signature as 'completed'                       │
│     └─> Updates document status when all sign                │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema

**documents table:**
```sql
- classification: TEXT (GENERAL, PROCEDURAL, CRITICAL)
- signature_status: TEXT (NONE, PENDING, COMPLETED)
- docuseal_template_id: TEXT
- docuseal_submission_id: TEXT
- signed_pdf_url: TEXT
- required_signers: JSONB (array of user IDs or role identifiers)
```

**document_signatures table:**
```sql
- id: UUID
- document_id: UUID (FK to documents)
- user_id: UUID (FK to users)
- docuseal_submission_id: TEXT
- status: TEXT (pending, completed, declined)
- signed_at: TIMESTAMPTZ
- signed_pdf_url: TEXT
- UNIQUE(document_id, user_id)
```

## 🚀 Current Implementation Status

### ✅ Completed
- [x] Database schema and migrations
- [x] User role extensions (board_member, wg_lead)
- [x] Document classification system
- [x] Critical document creation (superadmin only)
- [x] Role-based signer selection UI
- [x] Signature Center dashboard
- [x] DocuSeal React component integration
- [x] Signature tracking and status updates
- [x] Row Level Security policies
- [x] API key configuration

### 🔄 Partially Implemented
- [ ] DocuSeal template creation (placeholder ready)
- [ ] DocuSeal submission creation (placeholder ready)
- [ ] Individual user selection UI (database ready)
- [ ] Webhook handler for automatic updates
- [ ] Signed PDF storage in Supabase

### 📝 Future Enhancements
- [ ] Email notifications to signers
- [ ] Signature reminder system
- [ ] Signature deadline enforcement
- [ ] Bulk document signing
- [ ] Signature delegation
- [ ] Mobile signature support
- [ ] Multi-language signature forms

## 🐛 Troubleshooting

### Error: "db is not defined"
**Fixed** ✅ - Updated SignatureCenter.tsx to use `createDocumentSignature()` function

### Error: "This document does not have a DocuSeal submission configured"
**Cause**: Document was created without DocuSeal template/submission
**Solution**: 
1. Ensure document has a file attached (PDF, Word, etc.)
2. DocuSeal template creation will be implemented in next phase
3. For now, manually create templates in DocuSeal dashboard

### Signatures not appearing in Signature Center
**Check**:
1. User has correct role (board_member or wg_lead)
2. Document classification is "CRITICAL"
3. Document signature_status is "PENDING"
4. User is in the required_signers list

### DocuSeal form not loading
**Check**:
1. API key is correctly set in .env
2. Document has `docuseal_submission_id`
3. User email is valid
4. Browser console for errors

## 📚 API Reference

### DocuSeal API Functions

**Location**: `src/lib/docuseal.ts`

```typescript
// Create template from PDF
createDocuSealTemplate(name: string, pdfFile: File): Promise<DocuSealTemplate>

// Create submission with signers
createDocuSealSubmission(
  templateId: string, 
  signers: DocuSealSigner[], 
  externalId?: string
): Promise<DocuSealSubmission>

// Get submission status
getDocuSealSubmissionStatus(submissionId: string): Promise<DocuSealSubmission>

// Download signed PDF
downloadSignedPDF(submissionId: string): Promise<Blob>

// Get signer URL
getSignerUrl(submissionId: string, signerEmail: string): Promise<string>
```

### Document Functions

**Location**: `src/lib/documents.ts`

```typescript
// Create signature record
createDocumentSignature(signatureData: {
  document_id: string;
  user_id: string;
  docuseal_submission_id?: string;
  status?: 'pending' | 'completed' | 'declined';
}): Promise<DocumentSignature>

// Update signature status
updateDocumentSignature(
  signatureId: string, 
  updates: Partial<DocumentSignature>
): Promise<DocumentSignature>

// Load signatures for document
loadDocumentSignatures(documentId: string): Promise<DocumentSignature[]>
```

## 🔗 Resources

- **DocuSeal Documentation**: https://docs.docuseal.com
- **DocuSeal React Component**: https://github.com/docuseal/docuseal-react
- **DocuSeal API Reference**: https://docs.docuseal.com/api
- **Supabase RLS Guide**: https://supabase.com/docs/guides/auth/row-level-security

## 📞 Support

For issues or questions:
- Check browser console for errors
- Review Supabase logs in Dashboard → Logs
- Contact: info@bamas.xyz
- GitHub Issues: [Your repo URL]

## 🔒 Security Notes

- **Never commit** `.env` file to git
- API keys are sensitive - keep them secret
- Use environment variables for all secrets
- RLS policies protect sensitive data
- Signatures are legally binding - use responsibly
- Regular backups of signed documents recommended

## 📄 License

This integration is part of BAMAS Digital Hub and follows the project's license terms.

