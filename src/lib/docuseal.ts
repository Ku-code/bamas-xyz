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
 * Uses Supabase Edge Function to avoid CORS issues
 */
export const downloadSignedPDF = async (
  submissionId: string
): Promise<Blob> => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase configuration is missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  try {
    console.log('[DocuSeal] Downloading signed PDF via Edge Function:', submissionId);

    // Call Supabase Edge Function instead of direct API
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'download_submission',
        data: {
          submission_id: submissionId,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('[DocuSeal] Download failed:', error);
      throw new Error(error.error || error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error('Error downloading signed PDF:', error);
    throw error;
  }
};

/**
 * Get the signing URL for a specific signer from a submission
 * Uses Supabase Edge Function to avoid CORS issues
 */
export const getSignerUrl = async (
  submissionId: string,
  signerEmail: string
): Promise<string> => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase configuration is missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  try {
    console.log('[DocuSeal] Getting signer URL for:', signerEmail);
    
    const submission = await getDocuSealSubmissionStatus(submissionId);
    
    // Find the submitter matching the email
    const submitter = submission.submitters?.find(
      (s: any) => s.email?.toLowerCase() === signerEmail.toLowerCase()
    );
    
    if (!submitter) {
      console.error('[DocuSeal] Submitter not found for email:', signerEmail);
      throw new Error(`No submitter found for email: ${signerEmail}`);
    }
    
    // Return the embed_src URL for the DocusealForm component
    // Format: https://docuseal.com/s/{slug}
    const embedUrl = submitter.embed_src || submitter.url;
    
    if (!embedUrl) {
      console.error('[DocuSeal] No embed URL found for submitter:', submitter);
      throw new Error('No signing URL available for this submitter');
    }
    
    console.log('[DocuSeal] Embed URL found:', embedUrl);
    return embedUrl;
  } catch (error) {
    console.error('Error getting signer URL:', error);
    throw error;
  }
};

interface DocuSealSubmitter {
  email: string;
  slug: string;
  embed_src: string;
  url: string;
  status: string;
}

interface DocuSealSubmissionWithSubmitters extends DocuSealSubmission {
  submitters?: DocuSealSubmitter[];
}

/**
 * Get submission with submitter details for a specific user
 */
export const getSubmissionForUser = async (
  submissionId: string,
  userEmail: string
): Promise<{ submission: DocuSealSubmissionWithSubmitters; submitter: DocuSealSubmitter }> => {
  try {
    const submission = await getDocuSealSubmissionStatus(submissionId) as DocuSealSubmissionWithSubmitters;
    
    const submitter = submission.submitters?.find(
      (s) => s.email?.toLowerCase() === userEmail.toLowerCase()
    );
    
    if (!submitter) {
      throw new Error(`You are not a signer for this document`);
    }
    
    return { submission, submitter };
  } catch (error) {
    console.error('Error getting submission for user:', error);
    throw error;
  }
};

