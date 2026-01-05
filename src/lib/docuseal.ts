/**
 * DocuSeal API Integration
 * Handles template creation, submission management, and signature tracking
 */

const DOCUSEAL_API_KEY = import.meta.env.VITE_DOCUSEAL_API_KEY;
const DOCUSEAL_API_URL = 'https://api.docuseal.co';

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
 */
export const createDocuSealTemplate = async (
  name: string,
  pdfFile: File | Blob
): Promise<DocuSealTemplate> => {
  if (!DOCUSEAL_API_KEY) {
    throw new Error('DocuSeal API key is not configured. Please set VITE_DOCUSEAL_API_KEY in your .env file.');
  }

  try {
    // Convert file to base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(pdfFile);
    });

    const response = await fetch(`${DOCUSEAL_API_URL}/templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': DOCUSEAL_API_KEY,
      },
      body: JSON.stringify({
        name,
        source: base64,
        source_type: 'base64',
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating DocuSeal template:', error);
    throw error;
  }
};

/**
 * Create a DocuSeal submission with signers
 */
export const createDocuSealSubmission = async (
  templateId: string,
  signers: DocuSealSigner[],
  externalId?: string
): Promise<DocuSealSubmission> => {
  if (!DOCUSEAL_API_KEY) {
    throw new Error('DocuSeal API key is not configured. Please set VITE_DOCUSEAL_API_KEY in your .env file.');
  }

  try {
    const response = await fetch(`${DOCUSEAL_API_URL}/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': DOCUSEAL_API_KEY,
      },
      body: JSON.stringify({
        template_id: templateId,
        send_email: true,
        external_id: externalId,
        signers: signers.map(signer => ({
          email: signer.email,
          role: signer.role,
          name: signer.name,
        })),
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating DocuSeal submission:', error);
    throw error;
  }
};

/**
 * Get the status of a DocuSeal submission
 */
export const getDocuSealSubmissionStatus = async (
  submissionId: string
): Promise<DocuSealSubmission> => {
  if (!DOCUSEAL_API_KEY) {
    throw new Error('DocuSeal API key is not configured. Please set VITE_DOCUSEAL_API_KEY in your .env file.');
  }

  try {
    const response = await fetch(`${DOCUSEAL_API_URL}/submissions/${submissionId}`, {
      method: 'GET',
      headers: {
        'X-Auth-Token': DOCUSEAL_API_KEY,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
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

