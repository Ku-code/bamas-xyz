import { supabase } from './supabase';
import { storage } from './storage';

export interface Company {
  id: string;
  name: string;
  description?: string;
  website?: string;
  activity_description?: string;
  technologies?: string[];
  headquarters_address: string;
  headquarters_latitude?: number;
  headquarters_longitude?: number;
  contact_email?: string;
  contact_phone?: string;
  logo_path?: string;
  logo_url?: string;
  created_by: string;
  created_by_name: string;
  created_by_image?: string;
  created_at: string;
  updated_at?: string;
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
}

/**
 * Geocode an address using Nominatim API (OpenStreetMap)
 * Rate limit: 1 request per second
 */
export const geocodeAddress = async (address: string): Promise<GeocodeResult> => {
  try {
    // Add Bulgaria to the address if not already present for better results
    const searchAddress = address.toLowerCase().includes('bulgaria') 
      ? address 
      : `${address}, Bulgaria`;

    const encodedAddress = encodeURIComponent(searchAddress);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=bg`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BAMAS Additive Manufacturing Map', // Required by Nominatim
      },
    });

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      throw new Error('Address not found. Please check the address and try again.');
    }

    const result = data[0];
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    };
  } catch (error) {
    console.error('Error geocoding address:', error);
    throw error;
  }
};

/**
 * Load all companies from Supabase
 */
export const loadCompanies = async (): Promise<Company[]> => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as Company[];
  } catch (error) {
    console.error('Error loading companies:', error);
    throw error;
  }
};

/**
 * Create a new company
 */
export const createCompany = async (
  companyData: {
    name: string;
    description?: string;
    website?: string;
    activity_description?: string;
    technologies?: string[];
    headquarters_address: string;
    headquarters_latitude?: number;
    headquarters_longitude?: number;
    contact_email?: string;
    contact_phone?: string;
    logo_path?: string;
    logo_url?: string;
    created_by: string;
    created_by_name: string;
    created_by_image?: string;
  }
): Promise<Company> => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .insert({
        name: companyData.name,
        description: companyData.description || null,
        website: companyData.website || null,
        activity_description: companyData.activity_description || null,
        technologies: companyData.technologies || null,
        headquarters_address: companyData.headquarters_address,
        headquarters_latitude: companyData.headquarters_latitude || null,
        headquarters_longitude: companyData.headquarters_longitude || null,
        contact_email: companyData.contact_email || null,
        contact_phone: companyData.contact_phone || null,
        logo_path: companyData.logo_path || null,
        logo_url: companyData.logo_url || null,
        created_by: companyData.created_by,
        created_by_name: companyData.created_by_name,
        created_by_image: companyData.created_by_image || null,
      } as any)
      .select()
      .single();

    if (error) throw error;
    return data as Company;
  } catch (error) {
    console.error('Error creating company:', error);
    throw error;
  }
};

/**
 * Update a company
 */
export const updateCompany = async (
  companyId: string,
  updates: {
    name?: string;
    description?: string;
    website?: string;
    activity_description?: string;
    technologies?: string[];
    headquarters_address?: string;
    headquarters_latitude?: number;
    headquarters_longitude?: number;
    contact_email?: string;
    contact_phone?: string;
    logo_path?: string;
    logo_url?: string;
  }
): Promise<Company> => {
  try {
    const { data, error } = await (supabase
      .from('companies') as any)
      .update(updates)
      .eq('id', companyId)
      .select()
      .single();

    if (error) throw error;
    return data as Company;
  } catch (error) {
    console.error('Error updating company:', error);
    throw error;
  }
};

/**
 * Delete a company and its associated logo
 */
export const deleteCompany = async (companyId: string, logoPath?: string): Promise<void> => {
  try {
    // Delete logo from storage if it exists
    if (logoPath) {
      try {
        await storage.deleteFile('company-logos', logoPath);
      } catch (fileError) {
        console.warn('Error deleting logo from storage:', fileError);
        // Continue with company deletion even if logo deletion fails
      }
    }

    // Delete company record
    const { error } = await supabase.from('companies').delete().eq('id', companyId);
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting company:', error);
    throw error;
  }
};

/**
 * Upload a company logo to Supabase Storage and return the file path and URL
 */
export const uploadCompanyLogo = async (
  file: File,
  userId: string
): Promise<{ path: string; url: string; fileName: string; fileSize: number; mimeType: string }> => {
  try {
    // Check if bucket exists
    const bucketExists = await storage.bucketExists('company-logos');
    if (!bucketExists) {
      const error = new Error('Storage bucket "company-logos" not found. Please create it in Supabase Storage settings.');
      (error as any).code = 'BUCKET_NOT_FOUND';
      throw error;
    }

    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${userId}/${timestamp}-${sanitizedFileName}`;

    await storage.uploadFile('company-logos', filePath, file, {
      contentType: file.type,
      upsert: false,
    });

    // Get public URL
    const publicUrl = storage.getPublicUrl('company-logos', filePath);

    return {
      path: filePath,
      url: publicUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    };
  } catch (error) {
    console.error('Error uploading logo:', error);
    throw error;
  }
};

/**
 * Get a public URL for a company logo
 */
export const getCompanyLogoUrl = (logoPath: string): string => {
  return storage.getPublicUrl('company-logos', logoPath);
};

