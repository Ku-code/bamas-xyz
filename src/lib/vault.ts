import { supabase } from './supabase';
import { storage } from './storage';

export interface VaultDocument {
  id: string;
  title: string;
  description?: string;
  file_path?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  category: string;
  access_level: 'superadmin' | 'board' | 'custom';
  allowed_users?: string[];
  created_by: string;
  created_by_name: string;
  created_by_image?: string;
  created_at: string;
  updated_at?: string;
}

export interface VaultAccessLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  document_id?: string;
  document_title?: string;
  ip_address?: string;
  created_at: string;
}

/**
 * Verify vault password using server-side function
 */
export const verifyVaultPassword = async (password: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('verify_vault_password', {
      password
    });
    
    if (error) {
      console.error('Error verifying vault password:', error);
      return false;
    }
    
    return data === true;
  } catch (error) {
    console.error('Error verifying vault password:', error);
    return false;
  }
};

/**
 * Set vault password (superadmin only)
 */
export const setVaultPassword = async (newPassword: string, hint?: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('set_vault_password', {
      new_password: newPassword,
      hint: hint || null
    });
    
    if (error) {
      console.error('Error setting vault password:', error);
      throw error;
    }
    
    return data === true;
  } catch (error) {
    console.error('Error setting vault password:', error);
    throw error;
  }
};

/**
 * Get vault password hint
 */
export const getVaultPasswordHint = async (): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('vault_access')
      .select('password_hint')
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found - vault not initialized
        return null;
      }
      console.error('Error getting vault password hint:', error);
      return null;
    }
    
    return data?.password_hint || null;
  } catch (error) {
    console.error('Error getting vault password hint:', error);
    return null;
  }
};

/**
 * Load all vault documents
 */
export const loadVaultDocuments = async (): Promise<VaultDocument[]> => {
  try {
    const { data, error } = await supabase
      .from('vault_documents')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      // Table doesn't exist
      if (error.code === '42P01') {
        console.warn('Vault documents table does not exist');
        return [];
      }
      throw error;
    }
    
    return (data || []) as VaultDocument[];
  } catch (error) {
    console.error('Error loading vault documents:', error);
    throw error;
  }
};

/**
 * Create a vault document
 */
export const createVaultDocument = async (
  documentData: {
    title: string;
    description?: string;
    file_path?: string;
    file_name?: string;
    file_size?: number;
    mime_type?: string;
    category?: string;
    access_level?: 'superadmin' | 'board' | 'custom';
    allowed_users?: string[];
    created_by: string;
    created_by_name: string;
    created_by_image?: string;
  }
): Promise<VaultDocument> => {
  try {
    const { data, error } = await supabase
      .from('vault_documents')
      .insert({
        title: documentData.title,
        description: documentData.description || null,
        file_path: documentData.file_path || null,
        file_name: documentData.file_name || null,
        file_size: documentData.file_size || null,
        mime_type: documentData.mime_type || null,
        category: documentData.category || 'General',
        access_level: documentData.access_level || 'board',
        allowed_users: documentData.allowed_users || [],
        created_by: documentData.created_by,
        created_by_name: documentData.created_by_name,
        created_by_image: documentData.created_by_image || null,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as VaultDocument;
  } catch (error) {
    console.error('Error creating vault document:', error);
    throw error;
  }
};

/**
 * Update a vault document
 */
export const updateVaultDocument = async (
  documentId: string,
  updates: Partial<VaultDocument>
): Promise<VaultDocument> => {
  try {
    const { data, error } = await supabase
      .from('vault_documents')
      .update(updates)
      .eq('id', documentId)
      .select()
      .single();
    
    if (error) throw error;
    return data as VaultDocument;
  } catch (error) {
    console.error('Error updating vault document:', error);
    throw error;
  }
};

/**
 * Delete a vault document
 */
export const deleteVaultDocument = async (documentId: string, filePath?: string): Promise<void> => {
  try {
    // Delete file from storage if exists
    if (filePath) {
      try {
        await storage.deleteFile('vault-documents', filePath);
      } catch (fileError) {
        console.warn('Error deleting vault file from storage:', fileError);
      }
    }
    
    // Delete document record
    const { error } = await supabase
      .from('vault_documents')
      .delete()
      .eq('id', documentId);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting vault document:', error);
    throw error;
  }
};

/**
 * Upload a file to the vault storage
 */
export const uploadVaultFile = async (
  file: File,
  userId: string
): Promise<{ path: string; url: string; fileName: string; fileSize: number; mimeType: string }> => {
  try {
    // Check if bucket exists
    const bucketExists = await storage.bucketExists('vault-documents');
    if (!bucketExists) {
      const error = new Error('Storage bucket "vault-documents" not found. Please create it in Supabase Storage settings.');
      (error as any).code = 'BUCKET_NOT_FOUND';
      throw error;
    }
    
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${userId}/${timestamp}-${sanitizedFileName}`;
    
    await storage.uploadFile('vault-documents', filePath, file, {
      contentType: file.type,
      upsert: false,
    });
    
    // Get public URL (actually should be a signed URL for vault)
    const publicUrl = storage.getPublicUrl('vault-documents', filePath);
    
    return {
      path: filePath,
      url: publicUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    };
  } catch (error) {
    console.error('Error uploading vault file:', error);
    throw error;
  }
};

/**
 * Get a signed URL for a vault file (for secure access)
 */
export const getVaultFileUrl = async (filePath: string): Promise<string> => {
  try {
    const { data, error } = await supabase.storage
      .from('vault-documents')
      .createSignedUrl(filePath, 3600); // 1 hour expiry
    
    if (error) throw error;
    return data.signedUrl;
  } catch (error) {
    console.error('Error getting vault file URL:', error);
    throw error;
  }
};

/**
 * Log vault access
 */
export const logVaultAccess = async (
  userId: string,
  userName: string,
  action: string,
  documentId?: string,
  documentTitle?: string
): Promise<void> => {
  try {
    await supabase
      .from('vault_access_log')
      .insert({
        user_id: userId,
        user_name: userName,
        action,
        document_id: documentId || null,
        document_title: documentTitle || null,
      });
  } catch (error) {
    console.error('Error logging vault access:', error);
    // Don't throw - logging should not break the main flow
  }
};

/**
 * Get vault access logs (superadmin only)
 */
export const getVaultAccessLogs = async (limit: number = 50): Promise<VaultAccessLog[]> => {
  try {
    const { data, error } = await supabase
      .from('vault_access_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      if (error.code === '42P01') {
        return [];
      }
      throw error;
    }
    
    return (data || []) as VaultAccessLog[];
  } catch (error) {
    console.error('Error getting vault access logs:', error);
    throw error;
  }
};

/**
 * Check if vault tables exist
 */
export const checkVaultTablesExist = async (): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('vault_documents')
      .select('id')
      .limit(1);
    
    // Table doesn't exist
    if (error && error.code === '42P01') {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking vault tables:', error);
    return false;
  }
};
