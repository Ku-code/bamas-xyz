/**
 * DocuSeal API Integration via Supabase Edge Function
 * Handles template creation, submission management, and signature tracking
 * 
 * NOTE: Uses Supabase Edge Function as a proxy to avoid CORS issues
 * Direct browser calls to DocuSeal API are blocked by CORS policy
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/docuseal-proxy`;

interface DocuSealTemplate {
  id: string;
  name: string;
  created_at: string;
}

interface DocuSealSubmission {
  id: string;
  template_id: string;
  state: string;
  completed_at?: string;
  url: string;
}

interface DocuSealSigner {
  email: string;
  role: string;
  name?: string;
}

/**
 * Create a DocuSeal template from a PDF file
 * Uses Supabase Edge Function to avoid CORS issues
 */
export const createDocuSealTemplate = async (
  name: string,
  pdfFile: File | Blob
): Promise<DocuSealTemplate> => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase configuration is missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  try {
    // Convert file to base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (data:application/pdf;base64,)
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(pdfFile);
    });

    console.log('[DocuSeal] Creating template via Edge Function:', name);

    // Call Supabase Edge Function instead of direct API
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'create_template',
        data: {
          name,
          file_base64: base64,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('[DocuSeal] Template creation failed:', error);
      throw new Error(error.error || error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[DocuSeal] Template created successfully:', data.id);
    return data;
  } catch (error) {
    console.error('Error creating DocuSeal template:', error);
    throw error;
  }
};

/**
 * Create a DocuSeal submission with signers
 * Uses Supabase Edge Function to avoid CORS issues
 */
export const createDocuSealSubmission = async (
  templateId: string,
  signers: DocuSealSigner[],
  externalId?: string
): Promise<DocuSealSubmission> => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase configuration is missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  try {
    console.log('[DocuSeal] Creating submission via Edge Function for template:', templateId);

    // Call Supabase Edge Function instead of direct API
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'create_submission',
        data: {
          template_id: templateId,
          send_email: true,
          external_id: externalId,
          submitters: signers.map(signer => ({
            email: signer.email,
            role: signer.role,
            name: signer.name,
          })),
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('[DocuSeal] Submission creation failed:', error);
      throw new Error(error.error || error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[DocuSeal] Submission created successfully:', data.id);
    return data;
  } catch (error) {
    console.error('Error creating DocuSeal submission:', error);
    throw error;
  }
};

/**
 * Get the status of a DocuSeal submission
 * Uses Supabase Edge Function to avoid CORS issues
 */
export const getDocuSealSubmissionStatus = async (
  submissionId: string
): Promise<DocuSealSubmission> => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase configuration is missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  try {
    console.log('[DocuSeal] Getting submission status via Edge Function:', submissionId);

    // Call Supabase Edge Function instead of direct API
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'get_submission',
        data: {
          submission_id: submissionId,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('[DocuSeal] Get submission failed:', error);
      throw new Error(error.error || error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting DocuSeal submission status:', error);
    throw error;
  }
};

/**
 * Download the signed PDF from a completed submission
 */
export const downloadSignedPDF = async (
  submissionId: string
): Promise<Blob> => {
  if (!DOCUSEAL_API_KEY) {
    throw new Error('DocuSeal API key is not configured. Please set VITE_DOCUSEAL_API_KEY in your .env file.');
  }

  try {
    const response = await fetch(`${DOCUSEAL_API_URL}/submissions/${submissionId}/download`, {
      method: 'GET',
      headers: {
        'X-Auth-Token': DOCUSEAL_API_KEY,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error('Error downloading signed PDF:', error);
    throw error;
  }
};

/**
 * Get the signing URL for a specific signer
 */
export const getSignerUrl = async (
  submissionId: string,
  signerEmail: string
): Promise<string> => {
  if (!DOCUSEAL_API_KEY) {
    throw new Error('DocuSeal API key is not configured. Please set VITE_DOCUSEAL_API_KEY in your .env file.');
  }

  try {
    const submission = await getDocuSealSubmissionStatus(submissionId);
    
    // The submission object should contain signer URLs
    // This is a simplified version - adjust based on actual DocuSeal API response
    return submission.url || '';
  } catch (error) {
    console.error('Error getting signer URL:', error);
    throw error;
  }
};

