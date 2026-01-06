import { supabase } from './supabase';
import { storage } from './storage';

export type DocumentClassification = 'GENERAL' | 'PROCEDURAL' | 'CRITICAL';
export type SignatureStatus = 'NONE' | 'PENDING' | 'COMPLETED';

export interface DocumentSignature {
  id: string;
  document_id: string;
  user_id: string;
  status: 'pending' | 'completed' | 'declined';
  signed_at?: string;
  signed_pdf_url?: string;
  signature_image_path?: string;
  signature_data_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface Document {
  id: string;
  title: string;
  description?: string;
  type: 'googleDrive' | 'text' | 'table' | 'uploaded';
  google_drive_link?: string;
  content?: string;
  table_data?: any; // JSONB
  file_path?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  category: string;
  classification?: DocumentClassification;
  signature_status?: SignatureStatus;
  signed_file_path?: string;
  required_signers?: string[]; // Array of user IDs or role names
  signatures?: any[]; // Array of signature records
  created_by: string;
  created_by_name: string;
  created_by_image?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Load all documents from Supabase
 */
export const loadDocuments = async (): Promise<Document[]> => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Document[];
  } catch (error) {
    console.error('Error loading documents:', error);
    throw error;
  }
};

/**
 * Create a new document
 */
export const createDocument = async (
  docData: {
    title: string;
    description?: string;
    type: 'googleDrive' | 'text' | 'table' | 'uploaded';
    google_drive_link?: string;
    content?: string;
    table_data?: any;
    file_path?: string;
    file_name?: string;
    file_size?: number;
    mime_type?: string;
    category: string;
    classification?: DocumentClassification;
    signature_status?: SignatureStatus;
    signed_pdf_url?: string;
    required_signers?: string[];
    signatures?: any[];
    created_by: string;
    created_by_name: string;
    created_by_image?: string;
  }
): Promise<Document> => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .insert({
        title: docData.title,
        description: docData.description || null,
        type: docData.type,
        google_drive_link: docData.google_drive_link || null,
        content: docData.content || null,
        table_data: docData.table_data || null,
        file_path: docData.file_path || null,
        file_name: docData.file_name || null,
        file_size: docData.file_size || null,
        mime_type: docData.mime_type || null,
        category: docData.category,
        classification: docData.classification || 'GENERAL',
        signature_status: docData.signature_status || 'NONE',
        signed_pdf_url: docData.signed_pdf_url || null,
        required_signers: docData.required_signers || [],
        signatures: docData.signatures || [],
        created_by: docData.created_by,
        created_by_name: docData.created_by_name,
        created_by_image: docData.created_by_image || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Document;
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
};

/**
 * Update a document
 */
export const updateDocument = async (
  docId: string,
  updates: {
    title?: string;
    description?: string;
    google_drive_link?: string;
    content?: string;
    table_data?: any;
    file_path?: string;
    file_name?: string;
    file_size?: number;
    mime_type?: string;
    category?: string;
    classification?: DocumentClassification;
    signature_status?: SignatureStatus;
    signed_pdf_url?: string;
    required_signers?: string[];
    signatures?: any[];
  }
): Promise<Document> => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', docId)
      .select()
      .single();

    if (error) throw error;
    return data as Document;
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
};

/**
 * Delete a document and its associated file
 */
export const deleteDocument = async (docId: string, filePath?: string): Promise<void> => {
  try {
    // Delete file from storage if it exists
    if (filePath) {
      try {
        await storage.deleteFile('documents', filePath);
      } catch (fileError) {
        console.warn('Error deleting file from storage:', fileError);
        // Continue with document deletion even if file deletion fails
      }
    }

    // Delete document record
    const { error } = await supabase.from('documents').delete().eq('id', docId);
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

/**
 * Upload a file to Supabase Storage and return the file path
 */
export const uploadDocumentFile = async (
  file: File,
  userId: string
): Promise<{ path: string; fileName: string; fileSize: number; mimeType: string }> => {
  try {
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${userId}/${timestamp}-${sanitizedFileName}`;

    await storage.uploadFile('documents', filePath, file, {
      contentType: file.type,
      upsert: false,
    });

    return {
      path: filePath,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Get a signed URL for a document file
 */
export const getDocumentFileUrl = async (filePath: string): Promise<string> => {
  try {
    return await storage.getSignedUrl('documents', filePath, 3600); // 1 hour expiry
  } catch (error) {
    console.error('Error getting file URL:', error);
    throw error;
  }
};

/**
 * Convert base64 file data to a File object and upload
 */
export const convertBase64ToFileAndUpload = async (
  base64Data: string,
  fileName: string,
  mimeType: string,
  userId: string
): Promise<{ path: string; fileName: string; fileSize: number; mimeType: string }> => {
  try {
    // Convert base64 to blob
    const base64Response = await fetch(base64Data);
    const blob = await base64Response.blob();
    const file = new File([blob], fileName, { type: mimeType });

    // Upload to storage
    return await uploadDocumentFile(file, userId);
  } catch (error) {
    console.error('Error converting and uploading base64 file:', error);
    throw error;
  }
};

/**
 * Load document signatures for a document
 */
export const loadDocumentSignatures = async (documentId: string): Promise<DocumentSignature[]> => {
  try {
    const { data, error } = await supabase
      .from('document_signatures')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as DocumentSignature[];
  } catch (error) {
    console.error('Error loading document signatures:', error);
    throw error;
  }
};

/**
 * Create a document signature record
 */
export const createDocumentSignature = async (
  signatureData: {
    document_id: string;
    user_id: string;
    status?: 'pending' | 'completed' | 'declined';
  }
): Promise<DocumentSignature> => {
  try {
    const { data, error } = await supabase
      .from('document_signatures')
      .insert({
        document_id: signatureData.document_id,
        user_id: signatureData.user_id,
        status: signatureData.status || 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return data as DocumentSignature;
  } catch (error) {
    console.error('Error creating document signature:', error);
    throw error;
  }
};

/**
 * Update a document signature record
 */
export const updateDocumentSignature = async (
  signatureId: string,
  updates: {
    status?: 'pending' | 'completed' | 'declined';
    signed_at?: string;
    signed_pdf_url?: string;
    signature_image_path?: string;
    signature_data_url?: string;
  }
): Promise<DocumentSignature> => {
  try {
    const { data, error } = await supabase
      .from('document_signatures')
      .update(updates)
      .eq('id', signatureId)
      .select()
      .single();

    if (error) throw error;
    return data as DocumentSignature;
  } catch (error) {
    console.error('Error updating document signature:', error);
    throw error;
  }
};

