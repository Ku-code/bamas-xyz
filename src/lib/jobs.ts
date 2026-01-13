import { supabase } from './supabase';
import { storage } from './storage';

// ============================================
// TYPES & INTERFACES
// ============================================

export type JobStatus = 'active' | 'closed' | 'draft' | 'archived';
export type ApplicationStatus = 'pending' | 'viewed' | 'shortlisted' | 'interview' | 'rejected' | 'accepted';
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance';
export type ExperienceLevel = 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'executive';

export interface JobPosting {
  id: string;
  posted_by: string;
  company_id?: string;
  title: string;
  description: string;
  category: string;
  employment_type: EmploymentType;
  experience_level: ExperienceLevel;
  location?: string;
  city?: string;
  country?: string;
  is_remote: boolean;
  is_hybrid: boolean;
  work_hours?: string;
  schedule_type?: string;
  show_salary: boolean;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  salary_period?: string;
  required_skills: string[];
  benefits: string[];
  application_deadline?: string;
  status: JobStatus;
  view_count: number;
  created_at: string;
  updated_at?: string;
  // Joined fields
  posted_by_name?: string;
  posted_by_image?: string;
  company_name?: string;
  company_logo_url?: string;
}

export interface JobSeekerProfile {
  id: string;
  user_id: string;
  title: string;
  summary: string;
  category: string;
  experience_level: ExperienceLevel;
  skills: string[];
  location?: string;
  city?: string;
  country?: string;
  open_to_remote: boolean;
  open_to_hybrid: boolean;
  resume_path?: string;
  cover_letter_path?: string;
  portfolio_paths: string[];
  portfolio_url?: string;
  linkedin_url?: string;
  github_url?: string;
  availability?: string;
  desired_salary_min?: number;
  desired_salary_max?: number;
  desired_salary_currency?: string;
  show_salary_expectation: boolean;
  status: JobStatus;
  view_count: number;
  created_at: string;
  updated_at?: string;
  // Joined fields
  user_name?: string;
  user_image?: string;
  user_email?: string;
}

export interface JobApplication {
  id: string;
  job_id: string;
  applicant_id: string;
  message?: string;
  resume_path?: string;
  cover_letter_path?: string;
  portfolio_paths: string[];
  status: ApplicationStatus;
  reviewed_at?: string;
  reviewer_notes?: string;
  created_at: string;
  // Joined fields
  job_title?: string;
  applicant_name?: string;
  applicant_email?: string;
}

export interface JobFilters {
  category?: string[];
  employment_type?: EmploymentType[];
  experience_level?: ExperienceLevel[];
  location?: string[];
  is_remote?: boolean;
  is_hybrid?: boolean;
  salary_min?: number;
  salary_max?: number;
  posted_date?: '24h' | '7d' | '30d' | 'all';
  search?: string;
}

export interface ProfileFilters {
  category?: string[];
  experience_level?: ExperienceLevel[];
  location?: string[];
  open_to_remote?: boolean;
  open_to_hybrid?: boolean;
  has_portfolio?: boolean;
  search?: string;
}

// ============================================
// JOB POSTINGS
// ============================================

/**
 * Load job postings with optional filters
 */
export const loadJobPostings = async (filters?: JobFilters): Promise<JobPosting[]> => {
  try {
    let query = supabase
      .from('job_postings')
      .select(`
        *,
        posted_by_user:users!job_postings_posted_by_fkey(id, name, image),
        company:companies(id, name, logo_url)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters) {
      if (filters.category && filters.category.length > 0) {
        query = query.in('category', filters.category);
      }
      if (filters.employment_type && filters.employment_type.length > 0) {
        query = query.in('employment_type', filters.employment_type);
      }
      if (filters.experience_level && filters.experience_level.length > 0) {
        query = query.in('experience_level', filters.experience_level);
      }
      if (filters.is_remote !== undefined) {
        query = query.eq('is_remote', filters.is_remote);
      }
      if (filters.is_hybrid !== undefined) {
        query = query.eq('is_hybrid', filters.is_hybrid);
      }
      if (filters.location && filters.location.length > 0) {
        query = query.in('city', filters.location);
      }
      if (filters.posted_date) {
        const dateMap = {
          '24h': new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          '7d': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          '30d': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        };
        if (filters.posted_date !== 'all' && dateMap[filters.posted_date]) {
          query = query.gte('created_at', dateMap[filters.posted_date]);
        }
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map((item: any) => ({
      ...item,
      posted_by_name: item.posted_by_user?.name,
      posted_by_image: item.posted_by_user?.image,
      company_name: item.company?.name,
      company_logo_url: item.company?.logo_url,
    })) as JobPosting[];
  } catch (error) {
    console.error('Error loading job postings:', error);
    throw error;
  }
};

/**
 * Load recently posted jobs (last 7 days)
 */
export const loadRecentJobs = async (limit: number = 10): Promise<JobPosting[]> => {
  try {
    const { data, error } = await supabase
      .from('recent_job_postings')
      .select('*')
      .limit(limit);

    if (error) throw error;
    return (data || []) as JobPosting[];
  } catch (error) {
    console.error('Error loading recent jobs:', error);
    throw error;
  }
};

/**
 * Search jobs with full-text search
 */
export const searchJobs = async (query: string, filters?: JobFilters): Promise<JobPosting[]> => {
  try {
    const searchFilters = { ...filters, search: query };
    return await loadJobPostings(searchFilters);
  } catch (error) {
    console.error('Error searching jobs:', error);
    throw error;
  }
};

/**
 * Get single job by ID
 */
export const getJobById = async (id: string): Promise<JobPosting | null> => {
  try {
    const { data, error } = await supabase
      .from('job_postings')
      .select(`
        *,
        posted_by_user:users!job_postings_posted_by_fkey(id, name, image),
        company:companies(id, name, logo_url)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      ...data,
      posted_by_name: data.posted_by_user?.name,
      posted_by_image: data.posted_by_user?.image,
      company_name: data.company?.name,
      company_logo_url: data.company?.logo_url,
    } as JobPosting;
  } catch (error) {
    console.error('Error getting job:', error);
    throw error;
  }
};

/**
 * Create a new job posting
 */
export const createJobPosting = async (data: {
  title: string;
  description: string;
  category: string;
  employment_type: EmploymentType;
  experience_level: ExperienceLevel;
  location?: string;
  city?: string;
  country?: string;
  is_remote?: boolean;
  is_hybrid?: boolean;
  work_hours?: string;
  schedule_type?: string;
  show_salary?: boolean;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  salary_period?: string;
  required_skills?: string[];
  benefits?: string[];
  application_deadline?: string;
  company_id?: string;
}): Promise<JobPosting> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: result, error } = await supabase
      .from('job_postings')
      .insert({
        posted_by: user.id,
        title: data.title,
        description: data.description,
        category: data.category,
        employment_type: data.employment_type,
        experience_level: data.experience_level,
        location: data.location || null,
        city: data.city || null,
        country: data.country || 'Bulgaria',
        is_remote: data.is_remote || false,
        is_hybrid: data.is_hybrid || false,
        work_hours: data.work_hours || null,
        schedule_type: data.schedule_type || null,
        show_salary: data.show_salary !== undefined ? data.show_salary : true,
        salary_min: data.salary_min || null,
        salary_max: data.salary_max || null,
        salary_currency: data.salary_currency || 'BGN',
        salary_period: data.salary_period || null,
        required_skills: data.required_skills || [],
        benefits: data.benefits || [],
        application_deadline: data.application_deadline || null,
        company_id: data.company_id || null,
        status: 'active',
      } as any)
      .select()
      .single();

    if (error) throw error;
    return result as JobPosting;
  } catch (error) {
    console.error('Error creating job posting:', error);
    throw error;
  }
};

/**
 * Update a job posting
 */
export const updateJobPosting = async (
  id: string,
  updates: Partial<Omit<JobPosting, 'id' | 'posted_by' | 'created_at' | 'view_count'>>
): Promise<JobPosting> => {
  try {
    const { data, error } = await supabase
      .from('job_postings')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as JobPosting;
  } catch (error) {
    console.error('Error updating job posting:', error);
    throw error;
  }
};

/**
 * Delete a job posting
 */
export const deleteJobPosting = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('job_postings')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting job posting:', error);
    throw error;
  }
};

/**
 * Get jobs by company
 */
export const getJobsByCompany = async (companyId: string): Promise<JobPosting[]> => {
  try {
    const { data, error } = await supabase
      .from('job_postings')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as JobPosting[];
  } catch (error) {
    console.error('Error loading company jobs:', error);
    throw error;
  }
};

/**
 * Increment view count for a job
 */
export const incrementJobViewCount = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase.rpc('increment_job_view_count', { job_id: id });
    if (error) {
      // Fallback if RPC doesn't exist
      const { data } = await supabase
        .from('job_postings')
        .select('view_count')
        .eq('id', id)
        .single();
      
      if (data) {
        await supabase
          .from('job_postings')
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq('id', id);
      }
    }
  } catch (error) {
    console.error('Error incrementing view count:', error);
    // Don't throw - view count is not critical
  }
};

// ============================================
// JOB SEEKER PROFILES
// ============================================

/**
 * Load job seeker profiles with optional filters
 */
export const loadJobSeekerProfiles = async (filters?: ProfileFilters): Promise<JobSeekerProfile[]> => {
  try {
    let query = supabase
      .from('job_seeker_profiles')
      .select(`
        *,
        user:users!job_seeker_profiles_user_id_fkey(id, name, image, email)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters) {
      if (filters.category && filters.category.length > 0) {
        query = query.in('category', filters.category);
      }
      if (filters.experience_level && filters.experience_level.length > 0) {
        query = query.in('experience_level', filters.experience_level);
      }
      if (filters.open_to_remote !== undefined) {
        query = query.eq('open_to_remote', filters.open_to_remote);
      }
      if (filters.open_to_hybrid !== undefined) {
        query = query.eq('open_to_hybrid', filters.open_to_hybrid);
      }
      if (filters.location && filters.location.length > 0) {
        query = query.in('city', filters.location);
      }
      if (filters.has_portfolio) {
        query = query.not('portfolio_paths', 'eq', '{}');
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,summary.ilike.%${filters.search}%`);
      }
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map((item: any) => ({
      ...item,
      user_name: item.user?.name,
      user_image: item.user?.image,
      user_email: item.user?.email,
    })) as JobSeekerProfile[];
  } catch (error) {
    console.error('Error loading job seeker profiles:', error);
    throw error;
  }
};

/**
 * Get single profile by ID
 */
export const getProfileById = async (id: string): Promise<JobSeekerProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('job_seeker_profiles')
      .select(`
        *,
        user:users!job_seeker_profiles_user_id_fkey(id, name, image, email)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      ...data,
      user_name: data.user?.name,
      user_image: data.user?.image,
      user_email: data.user?.email,
    } as JobSeekerProfile;
  } catch (error) {
    console.error('Error getting profile:', error);
    throw error;
  }
};

/**
 * Create a job seeker profile
 */
export const createJobSeekerProfile = async (data: {
  title: string;
  summary: string;
  category: string;
  experience_level: ExperienceLevel;
  skills?: string[];
  location?: string;
  city?: string;
  country?: string;
  open_to_remote?: boolean;
  open_to_hybrid?: boolean;
  resume_path?: string;
  cover_letter_path?: string;
  portfolio_paths?: string[];
  portfolio_url?: string;
  linkedin_url?: string;
  github_url?: string;
  availability?: string;
  desired_salary_min?: number;
  desired_salary_max?: number;
  desired_salary_currency?: string;
  show_salary_expectation?: boolean;
}): Promise<JobSeekerProfile> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: result, error } = await supabase
      .from('job_seeker_profiles')
      .insert({
        user_id: user.id,
        title: data.title,
        summary: data.summary,
        category: data.category,
        experience_level: data.experience_level,
        skills: data.skills || [],
        location: data.location || null,
        city: data.city || null,
        country: data.country || 'Bulgaria',
        open_to_remote: data.open_to_remote || false,
        open_to_hybrid: data.open_to_hybrid || false,
        resume_path: data.resume_path || null,
        cover_letter_path: data.cover_letter_path || null,
        portfolio_paths: data.portfolio_paths || [],
        portfolio_url: data.portfolio_url || null,
        linkedin_url: data.linkedin_url || null,
        github_url: data.github_url || null,
        availability: data.availability || null,
        desired_salary_min: data.desired_salary_min || null,
        desired_salary_max: data.desired_salary_max || null,
        desired_salary_currency: data.desired_salary_currency || 'BGN',
        show_salary_expectation: data.show_salary_expectation || false,
        status: 'active',
      } as any)
      .select()
      .single();

    if (error) throw error;
    return result as JobSeekerProfile;
  } catch (error) {
    console.error('Error creating job seeker profile:', error);
    throw error;
  }
};

/**
 * Update a job seeker profile
 */
export const updateJobSeekerProfile = async (
  id: string,
  updates: Partial<Omit<JobSeekerProfile, 'id' | 'user_id' | 'created_at' | 'view_count'>>
): Promise<JobSeekerProfile> => {
  try {
    const { data, error } = await supabase
      .from('job_seeker_profiles')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as JobSeekerProfile;
  } catch (error) {
    console.error('Error updating job seeker profile:', error);
    throw error;
  }
};

/**
 * Delete a job seeker profile
 */
export const deleteJobSeekerProfile = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('job_seeker_profiles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting job seeker profile:', error);
    throw error;
  }
};

/**
 * Increment view count for a profile
 */
export const incrementProfileViewCount = async (id: string): Promise<void> => {
  try {
    const { data } = await supabase
      .from('job_seeker_profiles')
      .select('view_count')
      .eq('id', id)
      .single();
    
    if (data) {
      await supabase
        .from('job_seeker_profiles')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', id);
    }
  } catch (error) {
    console.error('Error incrementing profile view count:', error);
    // Don't throw - view count is not critical
  }
};

// ============================================
// JOB APPLICATIONS
// ============================================

/**
 * Apply to a job
 */
export const applyToJob = async (jobId: string, data: {
  message?: string;
  resume_path?: string;
  cover_letter_path?: string;
  portfolio_paths?: string[];
}): Promise<JobApplication> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: result, error } = await supabase
      .from('job_applications')
      .insert({
        job_id: jobId,
        applicant_id: user.id,
        message: data.message || null,
        resume_path: data.resume_path || null,
        cover_letter_path: data.cover_letter_path || null,
        portfolio_paths: data.portfolio_paths || [],
        status: 'pending',
      } as any)
      .select()
      .single();

    if (error) throw error;
    return result as JobApplication;
  } catch (error) {
    console.error('Error applying to job:', error);
    throw error;
  }
};

/**
 * Get user's applications
 */
export const getMyApplications = async (): Promise<JobApplication[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('job_applications')
      .select(`
        *,
        job:job_postings(id, title)
      `)
      .eq('applicant_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      ...item,
      job_title: item.job?.title,
    })) as JobApplication[];
  } catch (error) {
    console.error('Error loading applications:', error);
    throw error;
  }
};

/**
 * Get applications for a job (job poster only)
 */
export const getJobApplications = async (jobId: string): Promise<JobApplication[]> => {
  try {
    const { data, error } = await supabase
      .from('job_applications')
      .select(`
        *,
        applicant:users!job_applications_applicant_id_fkey(id, name, email)
      `)
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      ...item,
      applicant_name: item.applicant?.name,
      applicant_email: item.applicant?.email,
    })) as JobApplication[];
  } catch (error) {
    console.error('Error loading job applications:', error);
    throw error;
  }
};

/**
 * Update application status
 */
export const updateApplicationStatus = async (
  id: string,
  status: ApplicationStatus,
  reviewer_notes?: string
): Promise<JobApplication> => {
  try {
    const updates: any = {
      status,
      reviewed_at: new Date().toISOString(),
    };
    if (reviewer_notes) {
      updates.reviewer_notes = reviewer_notes;
    }

    const { data, error } = await supabase
      .from('job_applications')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as JobApplication;
  } catch (error) {
    console.error('Error updating application status:', error);
    throw error;
  }
};

// ============================================
// FILE UPLOADS
// ============================================

/**
 * Upload resume file
 */
export const uploadResume = async (file: File): Promise<{ path: string; url: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${user.id}/resumes/${timestamp}-${sanitizedFileName}`;

    await storage.uploadFile('job-files', filePath, file, {
      contentType: file.type,
      upsert: false,
    });

    const signedUrl = await storage.getSignedUrl('job-files', filePath, 3600);

    return { path: filePath, url: signedUrl };
  } catch (error) {
    console.error('Error uploading resume:', error);
    throw error;
  }
};

/**
 * Upload cover letter file
 */
export const uploadCoverLetter = async (file: File): Promise<{ path: string; url: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${user.id}/cover-letters/${timestamp}-${sanitizedFileName}`;

    await storage.uploadFile('job-files', filePath, file, {
      contentType: file.type,
      upsert: false,
    });

    const signedUrl = await storage.getSignedUrl('job-files', filePath, 3600);

    return { path: filePath, url: signedUrl };
  } catch (error) {
    console.error('Error uploading cover letter:', error);
    throw error;
  }
};

/**
 * Upload portfolio files (multiple)
 */
export const uploadPortfolioFiles = async (files: File[]): Promise<Array<{ path: string; url: string; fileName: string }>> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const uploads = await Promise.all(
      files.map(async (file) => {
        const timestamp = Date.now();
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `${user.id}/portfolios/${timestamp}-${sanitizedFileName}`;

        await storage.uploadFile('job-files', filePath, file, {
          contentType: file.type,
          upsert: false,
        });

        const signedUrl = await storage.getSignedUrl('job-files', filePath, 3600);

        return { path: filePath, url: signedUrl, fileName: file.name };
      })
    );

    return uploads;
  } catch (error) {
    console.error('Error uploading portfolio files:', error);
    throw error;
  }
};

/**
 * Get signed URL for a file
 */
export const getFileUrl = async (path: string, expiresIn: number = 3600): Promise<string> => {
  try {
    return await storage.getSignedUrl('job-files', path, expiresIn);
  } catch (error) {
    console.error('Error getting file URL:', error);
    throw error;
  }
};

/**
 * Delete a job file
 */
export const deleteJobFile = async (path: string): Promise<void> => {
  try {
    await storage.deleteFile('job-files', path);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

// ============================================
// FAVORITES
// ============================================

/**
 * Toggle favorite for a job or profile
 */
export const toggleFavorite = async (itemId: string, type: 'job' | 'profile'): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if already favorited
    const { data: existing } = await supabase
      .from('job_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq(type === 'job' ? 'job_id' : 'profile_id', itemId)
      .single();

    if (existing) {
      // Remove favorite
      const { error } = await supabase
        .from('job_favorites')
        .delete()
        .eq('id', existing.id);
      if (error) throw error;
      return false;
    } else {
      // Add favorite
      const { error } = await supabase
        .from('job_favorites')
        .insert({
          user_id: user.id,
          [type === 'job' ? 'job_id' : 'profile_id']: itemId,
        } as any);
      if (error) throw error;
      return true;
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    throw error;
  }
};

/**
 * Get user's favorites
 */
export const getFavorites = async (type: 'job' | 'profile'): Promise<string[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('job_favorites')
      .select(type === 'job' ? 'job_id' : 'profile_id')
      .eq('user_id', user.id)
      .not(type === 'job' ? 'job_id' : 'profile_id', 'is', null);

    if (error) throw error;
    return (data || []).map((item: any) => item[type === 'job' ? 'job_id' : 'profile_id']).filter(Boolean);
  } catch (error) {
    console.error('Error loading favorites:', error);
    throw error;
  }
};

/**
 * Check if item is favorited
 */
export const isFavorited = async (itemId: string, type: 'job' | 'profile'): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from('job_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq(type === 'job' ? 'job_id' : 'profile_id', itemId)
      .single();

    return !!data;
  } catch (error) {
    return false;
  }
};

// ============================================
// SEARCH HISTORY
// ============================================

/**
 * Save recent search (localStorage for now, can be moved to DB later)
 */
export const saveRecentSearch = (query: string): void => {
  try {
    const recent = getRecentSearches();
    const updated = [query, ...recent.filter(q => q !== query)].slice(0, 10);
    localStorage.setItem('bamas_job_search_history', JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving search:', error);
  }
};

/**
 * Get recent searches
 */
export const getRecentSearches = (): string[] => {
  try {
    const stored = localStorage.getItem('bamas_job_search_history');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
};
