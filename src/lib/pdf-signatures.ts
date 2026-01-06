/**
 * Native PDF Signature System
 * Handles signature collection, PDF generation, and storage
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { supabase } from './supabase';

interface SignatureData {
  signerName: string;
  signerEmail: string;
  signatureImageDataUrl: string;
  documentTitle: string;
  documentId: string;
  signedAt: string;
  userId: string;
}

interface SignatureRecord {
  id: string;
  document_id: string;
  user_id: string;
  status: 'pending' | 'completed' | 'declined';
  signed_at?: string;
  signature_image_path?: string;
  signature_data_url?: string;
}

interface DocumentInfo {
  id: string;
  title: string;
  file_path: string;
  signed_file_path?: string;
  signature_status?: 'NONE' | 'PENDING' | 'COMPLETED';
}

/**
 * Collect all signatures for a document
 */
export async function collectAllSignatures(
  documentId: string
): Promise<{ signatures: SignatureRecord[]; allComplete: boolean }> {
  try {
    const { data: signatures, error } = await supabase
      .from('document_signatures')
      .select('*')
      .eq('document_id', documentId);

    if (error) throw error;

    const allComplete = signatures?.every((sig) => sig.status === 'completed') ?? false;

    return {
      signatures: (signatures || []) as SignatureRecord[],
      allComplete,
    };
  } catch (error) {
    console.error('Error collecting signatures:', error);
    throw error;
  }
}

/**
 * Add a signature verification page to a PDF document
 */
async function addSignaturePageToPDF(
  pdfDoc: PDFDocument,
  signatureData: SignatureData
): Promise<void> {
  // Add a new page for signature
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();

  // Embed fonts
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Embed signature image - convert data URL to Uint8Array for reliability
  let signatureImage;
  try {
    // Ensure we have a valid data URL
    if (!signatureData.signatureImageDataUrl) {
      throw new Error('Signature image data URL is missing');
    }

    // Extract base64 data from data URL (format: data:image/png;base64,<data>)
    let base64Data = signatureData.signatureImageDataUrl;
    if (base64Data.includes(',')) {
      base64Data = base64Data.split(',')[1];
    } else if (base64Data.startsWith('data:')) {
      // If it has data: prefix but no comma, it's malformed
      throw new Error('Invalid data URL format');
    }
    
    // Convert base64 to Uint8Array
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Embed PNG from bytes
    signatureImage = await pdfDoc.embedPng(bytes);
    console.log(`[PDF Signatures] Successfully embedded signature image (${bytes.length} bytes)`);
  } catch (error: any) {
    console.error('[PDF Signatures] Error embedding signature image:', error);
    console.error('[PDF Signatures] Signature data URL preview:', signatureData.signatureImageDataUrl?.substring(0, 100));
    
    // Fallback: try direct data URL (pdf-lib might handle it)
    try {
      signatureImage = await pdfDoc.embedPng(signatureData.signatureImageDataUrl);
      console.log('[PDF Signatures] Fallback embedding succeeded');
    } catch (fallbackError: any) {
      console.error('[PDF Signatures] Fallback embedding also failed:', fallbackError);
      throw new Error(`Failed to embed signature image: ${error.message || 'Unknown error'}`);
    }
  }
  
  if (!signatureImage) {
    throw new Error('Signature image embedding failed - no image object created');
  }
  
  const imgDims = signatureImage.scale(0.3);

  // Draw title
  page.drawText('SIGNATURE VERIFICATION PAGE', {
    x: 50,
    y: height - 50,
    size: 20,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  // Draw document info
  const docInfoY = height - 100;
  page.drawText(`Document: ${signatureData.documentTitle}`, {
    x: 50,
    y: docInfoY,
    size: 12,
    font: regularFont,
  });

  page.drawText(`Document ID: ${signatureData.documentId.substring(0, 16).toUpperCase()}`, {
    x: 50,
    y: docInfoY - 20,
    size: 10,
    font: regularFont,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Draw signer info
  const signerInfoY = docInfoY - 60;
  page.drawText('SIGNED BY:', {
    x: 50,
    y: signerInfoY,
    size: 12,
    font: boldFont,
  });

  page.drawText(signatureData.signerName, {
    x: 50,
    y: signerInfoY - 25,
    size: 14,
    font: regularFont,
  });

  page.drawText(signatureData.signerEmail, {
    x: 50,
    y: signerInfoY - 45,
    size: 10,
    font: regularFont,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Draw signature image
  page.drawImage(signatureImage, {
    x: 50,
    y: signerInfoY - 150,
    width: imgDims.width,
    height: imgDims.height,
  });

  // Draw timestamp
  const timestamp = new Date(signatureData.signedAt).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  page.drawText(`Signed on: ${timestamp}`, {
    x: 50,
    y: signerInfoY - 180,
    size: 10,
    font: regularFont,
  });

  // Draw verification hash (document ID + user ID)
  const hash = `${signatureData.documentId.substring(0, 8)}${signatureData.userId.substring(0, 8)}`.toUpperCase();
  page.drawText(`Verification Hash: ${hash}`, {
    x: 50,
    y: signerInfoY - 200,
    size: 8,
    font: regularFont,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Draw footer
  page.drawText(
    'This is a legally binding digital signature. For verification, contact BAMAS administration at bamas.xyz',
    {
      x: 50,
      y: 50,
      size: 8,
      font: regularFont,
      color: rgb(0.6, 0.6, 0.6),
    }
  );

  // Draw border
  page.drawRectangle({
    x: 40,
    y: 40,
    width: width - 80,
    height: height - 80,
    borderColor: rgb(0, 0, 0),
    borderWidth: 2,
  });
}

/**
 * Generate final signed PDF when all signatures are collected
 */
export async function generateSignedPDF(
  documentId: string
): Promise<{ success: boolean; signedFilePath?: string; error?: string }> {
  try {
    // 1. Get document info
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, title, file_path')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      throw new Error('Document not found');
    }

    // 2. Get all signatures
    const { signatures, allComplete } = await collectAllSignatures(documentId);

    if (!allComplete) {
      throw new Error('Not all signatures are complete');
    }

    // 3. Download original PDF
    if (!document.file_path) {
      throw new Error('Document file path not found');
    }

    const { data: pdfBlob, error: downloadError } = await supabase.storage
      .from('documents')
      .download(document.file_path);

    if (downloadError || !pdfBlob) {
      throw new Error('Failed to download original PDF');
    }

    // 4. Load PDF using pdf-lib
    const pdfArrayBuffer = await pdfBlob.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfArrayBuffer);

    // 5. Get user info for each signature
    const userIds = signatures.map((sig) => sig.user_id);
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email')
      .in('id', userIds);

    if (usersError || !users) {
      throw new Error('Failed to fetch signer information');
    }

    // 6. Add signature page for each signer (in order of signing)
    for (const signature of signatures) {
      const user = users.find((u) => u.id === signature.user_id);
      if (!user || !signature.signature_data_url) {
        console.warn(`Skipping signature ${signature.id} - missing user or signature data`);
        continue;
      }

      try {
        await addSignaturePageToPDF(pdfDoc, {
          signerName: user.name,
          signerEmail: user.email,
          signatureImageDataUrl: signature.signature_data_url,
          documentTitle: document.title,
          documentId: document.id,
          signedAt: signature.signed_at || new Date().toISOString(),
          userId: signature.user_id,
        });
        console.log(`[PDF Signatures] Added signature page for ${user.name}`);
      } catch (sigError: any) {
        console.error(`[PDF Signatures] Failed to add signature page for ${user.name}:`, sigError);
        // Continue with other signatures even if one fails
      }
    }

    // 7. Save final PDF
    const pdfBytes = await pdfDoc.save();
    console.log(`[PDF Signatures] Generated PDF with ${pdfDoc.getPageCount()} pages (original + ${signatures.length} signature pages)`);

    // 8. Upload to storage (use upsert to allow regeneration)
    const signedFileName = `${documentId}_final.pdf`;
    const signedFilePath = `signed/${signedFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(signedFilePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true, // Allow overwriting if regenerating
      });

    if (uploadError) {
      throw new Error(`Failed to upload signed PDF: ${uploadError.message}`);
    }

    // 9. Update document record
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        signed_file_path: signedFilePath,
        signature_status: 'COMPLETED',
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('Failed to update document status:', updateError);
      // Don't throw - PDF is already uploaded
    }

    console.log(`[PDF Signatures] Generated signed PDF: ${signedFilePath}`);

    return { success: true, signedFilePath };
  } catch (error: any) {
    console.error('Error generating signed PDF:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Save individual signature
 */
export async function saveSignature(
  documentId: string,
  userId: string,
  signatureDataUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Convert data URL to blob
    const base64Data = signatureDataUrl.split(',')[1];
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'image/png' });

    // 2. Upload to storage
    const signatureFileName = `${documentId}_${userId}_${Date.now()}.png`;
    const signaturePath = `${userId}/${signatureFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('signatures')
      .upload(signaturePath, blob, {
        contentType: 'image/png',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Failed to upload signature: ${uploadError.message}`);
    }

    // 3. Update or create signature record
    const { data: existingSig } = await supabase
      .from('document_signatures')
      .select('id')
      .eq('document_id', documentId)
      .eq('user_id', userId)
      .single();

    if (existingSig) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('document_signatures')
        .update({
          signature_image_path: signaturePath,
          signature_data_url: signatureDataUrl,
          signed_at: new Date().toISOString(),
          status: 'completed',
        })
        .eq('id', existingSig.id);

      if (updateError) throw updateError;
    } else {
      // Create new record
      const { error: insertError } = await supabase
        .from('document_signatures')
        .insert({
          document_id: documentId,
          user_id: userId,
          signature_image_path: signaturePath,
          signature_data_url: signatureDataUrl,
          signed_at: new Date().toISOString(),
          status: 'completed',
        });

      if (insertError) throw insertError;
    }

    // 4. Check if all signatures are complete
    const { signatures, allComplete } = await collectAllSignatures(documentId);

    if (allComplete) {
      // Generate final PDF
      console.log('[PDF Signatures] All signatures complete, generating final PDF...');
      const result = await generateSignedPDF(documentId);
      if (!result.success) {
        console.error('[PDF Signatures] Failed to generate final PDF:', result.error);
        // Don't fail the signature save - PDF generation can be retried
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error saving signature:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Manually regenerate signed PDF (for admins or troubleshooting)
 */
export async function regenerateSignedPDF(
  documentId: string
): Promise<{ success: boolean; signedFilePath?: string; error?: string }> {
  console.log(`[PDF Signatures] Manual regeneration requested for document ${documentId}`);
  return await generateSignedPDF(documentId);
}

/**
 * Download signed PDF
 */
export async function downloadSignedPDF(
  documentId: string,
  userId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // 1. Check user permissions
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('signed_file_path, signature_status')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      throw new Error('Document not found');
    }

    if (document.signature_status !== 'COMPLETED' || !document.signed_file_path) {
      throw new Error('Document is not fully signed yet');
    }

    // 2. Check if user is a signer or admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    const isAdmin = user?.role === 'superadmin' || user?.role === 'admin';

    const { data: signature } = await supabase
      .from('document_signatures')
      .select('id')
      .eq('document_id', documentId)
      .eq('user_id', userId)
      .single();

    const isSigner = !!signature;

    if (!isSigner && !isAdmin) {
      throw new Error('You do not have permission to download this document');
    }

    // 3. Generate signed URL
    const { data: urlData, error: urlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(document.signed_file_path, 3600); // 1 hour expiry

    if (urlError || !urlData) {
      throw new Error('Failed to generate download URL');
    }

    return { success: true, url: urlData.signedUrl };
  } catch (error: any) {
    console.error('Error downloading signed PDF:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

