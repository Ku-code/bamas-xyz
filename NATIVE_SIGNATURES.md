# Native Digital Signature System

## Overview

The BAMAS Digital Hub uses a custom-built native digital signature system that replaces external services like DocuSeal. This system provides a simple, reliable, and legally valid way to collect signatures on Critical documents.

## Architecture

### Flow Diagram

```
Superadmin Uploads PDF
    ↓
Assigns Required Signers (Board Members, WG Leads, or specific users)
    ↓
System Creates Signature Records in Database
    ↓
Signers See Document in Signature Center
    ↓
Signer Opens Document → Preview PDF → Draw Signature
    ↓
Signature Saved to Database & Storage
    ↓
System Checks: All Signatures Complete?
    ├─ No → Wait for More Signatures
    └─ Yes → Generate Final Signed PDF
            ↓
        Append Signature Verification Pages
            ↓
        Store Final PDF in Storage
            ↓
        Update Document Status: COMPLETED
            ↓
        Notify All Signers
```

## Components

### 1. Signature Pad (`SignaturePad.tsx`)

Canvas-based signature drawing component using `react-signature-canvas`.

**Features:**
- Touch-friendly (works on tablets and mobile)
- Clear button to restart
- Save button (disabled until signature drawn)
- Legal disclaimer text
- Exports signature as PNG data URL

**Location:** `src/components/signature/SignaturePad.tsx`

### 2. PDF Viewer (`PDFViewer.tsx`)

PDF preview component using `react-pdf`.

**Features:**
- Page navigation (prev/next)
- Zoom controls (in/out/reset)
- Page number indicator
- Loading states
- Error handling

**Location:** `src/components/signature/PDFViewer.tsx`

### 3. Signature Dialog (`SignatureDialog.tsx`)

Two-step signature collection dialog.

**Steps:**
1. **Preview**: User reviews the PDF document
2. **Sign**: User draws their signature on the pad

**Location:** `src/components/signature/SignatureDialog.tsx`

### 4. PDF Signatures Library (`pdf-signatures.ts`)

Core library for PDF manipulation and signature processing.

**Functions:**
- `collectAllSignatures(documentId)`: Get all signatures for a document
- `saveSignature(documentId, userId, signatureDataUrl)`: Save individual signature
- `generateSignedPDF(documentId)`: Generate final PDF when all signatures collected
- `downloadSignedPDF(documentId, userId)`: Download signed PDF (with permission check)

**Location:** `src/lib/pdf-signatures.ts`

## Database Schema

### Documents Table

```sql
-- Removed DocuSeal columns:
-- docuseal_template_id (removed)
-- docuseal_submission_id (removed)

-- Added native signature fields:
signed_file_path TEXT  -- Path to final signed PDF in storage
```

### Document Signatures Table

```sql
-- Removed DocuSeal column:
-- docuseal_submission_id (removed)

-- Added native signature fields:
signature_image_path TEXT      -- Path to signature PNG in storage
signature_data_url TEXT        -- Base64 data URL for quick display
```

## Storage Structure

### Signatures Bucket

**Bucket Name:** `signatures`

**Path Format:** `{userId}/{documentId}_{userId}_{timestamp}.png`

**Example:** `550e8400-e29b-41d4-a716-446655440000/doc_123_user_456_1704567890123.png`

**Policies:**
- Users can upload their own signatures
- Users can view their own signatures
- Admins can view all signatures
- Users can delete their own signatures (for re-signing)

### Documents Bucket (Signed PDFs)

**Path Format:** `signed/{documentId}_final_{timestamp}.pdf`

**Example:** `signed/doc_123_final_1704567890123.pdf`

**Policies:**
- Signers can download signed PDFs
- Admins can download all signed PDFs

## Signature Verification Page Layout

Each signature adds a new page to the PDF with the following layout:

```
┌─────────────────────────────────────────────┐
│                                             │
│  SIGNATURE VERIFICATION PAGE                │
│                                             │
│  Document: [Document Title]                 │
│  Document ID: [doc-id]                      │
│                                             │
│  SIGNED BY:                                 │
│  [Signer Full Name]                         │
│  [signer@email.com]                         │
│                                             │
│  [Signature Image - PNG]                    │
│                                             │
│  Signed on: January 6, 2026, 10:30 PM EST  │
│  Verification Hash: A3F7B9C2E1D4           │
│                                             │
│  This is a legally binding digital          │
│  signature. For verification, contact       │
│  BAMAS administration at bamas.xyz          │
│                                             │
└─────────────────────────────────────────────┘
```

**Verification Hash:** Generated from `documentId + userId` (first 8 chars of each)

## User Workflows

### Superadmin: Create Critical Document

1. Navigate to Documents → Create Document
2. Upload PDF file
3. Set Classification: **Critical**
4. Select Required Signers:
   - All Board Members
   - All WG Leads
   - Specific users (by ID)
5. Click "Add Document"
6. System automatically creates signature records for each signer

### Signer: Sign Document

1. Navigate to Signature Center
2. See list of pending documents
3. Click "Sign Now" on a document
4. **Step 1:** Preview PDF (can navigate pages, zoom)
5. Click "Continue to Sign"
6. **Step 2:** Draw signature on pad
7. Click "Sign Document"
8. Signature saved, document status updated

### Signer/Admin: Download Signed PDF

1. Navigate to Documents or Signature Center
2. Find completed document (status: COMPLETED)
3. Click "Download Signed PDF" button
4. PDF opens in new tab

## Permission Model

### Who Can Sign?

- Users assigned as required signers
- Users with roles matching required signers (e.g., `board_member` if "All Board Members" selected)
- Individual users selected by ID

### Who Can Download?

- **Signers**: Can download documents they signed
- **Admins**: Can download all signed documents
- **Others**: Cannot download signed PDFs

## Technical Details

### PDF Generation

Uses `pdf-lib` library to:
1. Load original PDF
2. Add new page for each signature
3. Embed signature image (PNG)
4. Draw verification content (text, borders)
5. Save as new PDF
6. Upload to storage

### Signature Storage

Signatures are stored in two formats:
1. **Storage Path**: PNG file in `signatures` bucket (for archival)
2. **Data URL**: Base64 string in database (for quick display)

### Automatic PDF Generation

When the last signer completes their signature:
1. System detects all signatures are complete
2. Automatically calls `generateSignedPDF()`
3. Creates final PDF with all signature pages
4. Updates document status to `COMPLETED`
5. Stores PDF at `signed/{documentId}_final_{timestamp}.pdf`

## Troubleshooting

### Signature Not Saving

**Symptoms:** Signature pad works but save fails

**Possible Causes:**
- Storage bucket `signatures` not created
- RLS policies not configured
- User doesn't have permission to upload

**Solution:**
1. Check Supabase Storage → Buckets → `signatures` exists
2. Verify RLS policies are applied
3. Check browser console for errors

### PDF Not Generating

**Symptoms:** All signatures complete but PDF not generated

**Possible Causes:**
- Original PDF not found in storage
- PDF generation function error
- Storage quota exceeded

**Solution:**
1. Check document `file_path` exists in storage
2. Check browser console for PDF generation errors
3. Verify storage quota not exceeded
4. Check Supabase logs for Edge Function errors (if using)

### Download Fails

**Symptoms:** Download button doesn't work

**Possible Causes:**
- User not a signer or admin
- Signed PDF not generated yet
- Storage path incorrect

**Solution:**
1. Verify user is in `document_signatures` table
2. Check document `signature_status` is `COMPLETED`
3. Verify `signed_file_path` exists in documents table
4. Check storage bucket policies

## Migration from DocuSeal

### What Was Removed

- `@docuseal/react` package
- `src/lib/docuseal.ts` file
- `supabase/functions/docuseal-proxy/` Edge Function
- DocuSeal database columns:
  - `documents.docuseal_template_id`
  - `documents.docuseal_submission_id`
  - `document_signatures.docuseal_submission_id`
- All DocuSeal documentation files

### What Was Added

- `pdf-lib` package (PDF manipulation)
- `react-signature-canvas` package (signature pad)
- `react-pdf` package (PDF viewer)
- New database columns:
  - `documents.signed_file_path`
  - `document_signatures.signature_image_path`
  - `document_signatures.signature_data_url`
- New storage bucket: `signatures`
- New components: `SignaturePad`, `PDFViewer`, `SignatureDialog`
- New library: `pdf-signatures.ts`

## Files Reference

### Core Files

- `src/lib/pdf-signatures.ts` - PDF generation and signature processing
- `src/components/signature/SignaturePad.tsx` - Signature drawing component
- `src/components/signature/PDFViewer.tsx` - PDF preview component
- `src/components/signature/SignatureDialog.tsx` - Two-step signature dialog
- `src/components/dashboard/SignatureCenter.tsx` - Main signature center UI
- `src/components/documents/SignatureProgressBadge.tsx` - Progress indicator

### Database Migrations

- `supabase/migrations/010_native_signatures.sql` - Remove DocuSeal, add native fields
- `supabase/migrations/011_storage_signatures_bucket.sql` - Storage bucket setup

### Updated Files

- `src/components/dashboard/DocumentsContent.tsx` - Removed DocuSeal integration
- `src/lib/documents.ts` - Updated interfaces
- `src/translations/en.json` - Updated translation keys
- `src/translations/bg.json` - Updated translation keys
- `package.json` - Removed DocuSeal, added PDF libraries

## Legal Considerations

The signature verification pages include:
- Signer name and email
- Timestamp (ISO 8601 format)
- Verification hash (for integrity)
- Legal disclaimer text
- Signature image (PNG)

This provides a legally binding digital signature that can be verified by:
1. Checking the signature image matches the signer
2. Verifying the timestamp
3. Confirming the verification hash
4. Contacting BAMAS administration for verification

## Future Enhancements

Potential improvements:
- Email notifications when signatures are required
- Email notifications when document is fully signed
- Signature history/audit log
- Bulk signature operations
- Signature templates
- Multi-language signature pages
- QR code for verification
- Digital certificate integration

