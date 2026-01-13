-- ============================================
-- JOB BOARD FEATURE
-- Migration 020: Complete job board system
-- ============================================
-- Tables: job_postings, job_seeker_profiles, job_applications, job_favorites
-- Features: Job postings, talent pool, applications, favorites
-- ============================================

-- ============================================
-- ENUMS
-- ============================================

DO $$ BEGIN
  CREATE TYPE job_status AS ENUM ('active', 'closed', 'draft', 'archived');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE application_status AS ENUM ('pending', 'viewed', 'shortlisted', 'interview', 'rejected', 'accepted');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE employment_type AS ENUM ('full_time', 'part_time', 'contract', 'internship', 'freelance');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE experience_level AS ENUM ('entry', 'junior', 'mid', 'senior', 'lead', 'executive');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- TABLE: job_postings
-- ============================================

CREATE TABLE IF NOT EXISTS job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  posted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  
  -- Basic Info
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  
  -- Employment Details
  employment_type employment_type NOT NULL,
  experience_level experience_level NOT NULL,
  
  -- Location & Work Arrangement
  location TEXT, -- Full location string
  city TEXT,
  country TEXT DEFAULT 'Bulgaria',
  is_remote BOOLEAN DEFAULT false,
  is_hybrid BOOLEAN DEFAULT false,
  work_hours TEXT, -- e.g., "9:00-18:00", "Flexible"
  schedule_type TEXT, -- "full_time_hours", "part_time_hours", "shift_work", "flexible"
  
  -- Compensation (Optional)
  show_salary BOOLEAN DEFAULT true,
  salary_min DECIMAL(10,2),
  salary_max DECIMAL(10,2),
  salary_currency VARCHAR(3) DEFAULT 'BGN',
  salary_period TEXT, -- "per_hour", "per_month", "per_year"
  
  -- Requirements
  required_skills TEXT[] DEFAULT '{}',
  benefits TEXT[] DEFAULT '{}',
  
  -- Application
  application_deadline TIMESTAMPTZ,
  
  -- Metadata
  status job_status DEFAULT 'active',
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- ============================================
-- TABLE: job_seeker_profiles
-- ============================================

CREATE TABLE IF NOT EXISTS job_seeker_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Basic Info
  title TEXT NOT NULL, -- Professional title
  summary TEXT NOT NULL,
  category TEXT NOT NULL,
  experience_level experience_level NOT NULL,
  
  -- Skills & Location
  skills TEXT[] DEFAULT '{}',
  location TEXT,
  city TEXT,
  country TEXT DEFAULT 'Bulgaria',
  open_to_remote BOOLEAN DEFAULT false,
  open_to_hybrid BOOLEAN DEFAULT false,
  
  -- Documents
  resume_path TEXT,
  cover_letter_path TEXT,
  portfolio_paths TEXT[] DEFAULT '{}', -- Array of file paths
  portfolio_url TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  
  -- Availability & Salary
  availability TEXT, -- "immediately", "2_weeks", "1_month", "3_months", "currently_employed"
  desired_salary_min DECIMAL(10,2),
  desired_salary_max DECIMAL(10,2),
  desired_salary_currency VARCHAR(3) DEFAULT 'BGN',
  show_salary_expectation BOOLEAN DEFAULT false,
  
  -- Metadata
  status job_status DEFAULT 'active',
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  
  -- One profile per user
  UNIQUE(user_id)
);

-- ============================================
-- TABLE: job_applications
-- ============================================

CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Application Content
  message TEXT,
  resume_path TEXT,
  cover_letter_path TEXT,
  portfolio_paths TEXT[] DEFAULT '{}',
  
  -- Status Tracking
  status application_status DEFAULT 'pending',
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- One application per user per job
  UNIQUE(job_id, applicant_id)
);

-- ============================================
-- TABLE: job_favorites
-- ============================================

CREATE TABLE IF NOT EXISTS job_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES job_postings(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES job_seeker_profiles(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure either job_id or profile_id is set, but not both
  CHECK (
    (job_id IS NOT NULL AND profile_id IS NULL) OR
    (job_id IS NULL AND profile_id IS NOT NULL)
  ),
  
  -- One favorite per user per item
  UNIQUE(user_id, job_id, profile_id)
);

-- ============================================
-- INDEXES
-- ============================================

-- Job Postings Indexes
CREATE INDEX IF NOT EXISTS idx_job_postings_posted_by ON job_postings(posted_by);
CREATE INDEX IF NOT EXISTS idx_job_postings_company_id ON job_postings(company_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_category ON job_postings(category);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_employment_type ON job_postings(employment_type);
CREATE INDEX IF NOT EXISTS idx_job_postings_experience_level ON job_postings(experience_level);
CREATE INDEX IF NOT EXISTS idx_job_postings_location ON job_postings(city, country);
CREATE INDEX IF NOT EXISTS idx_job_postings_remote ON job_postings(is_remote);
CREATE INDEX IF NOT EXISTS idx_job_postings_created_at ON job_postings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_postings_deadline ON job_postings(application_deadline);
CREATE INDEX IF NOT EXISTS idx_job_postings_skills ON job_postings USING GIN(required_skills);

-- Full-text search index for job postings
CREATE INDEX IF NOT EXISTS idx_job_postings_search ON job_postings USING GIN(
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
);

-- Job Seeker Profiles Indexes
CREATE INDEX IF NOT EXISTS idx_job_seeker_profiles_user_id ON job_seeker_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_job_seeker_profiles_category ON job_seeker_profiles(category);
CREATE INDEX IF NOT EXISTS idx_job_seeker_profiles_status ON job_seeker_profiles(status);
CREATE INDEX IF NOT EXISTS idx_job_seeker_profiles_experience_level ON job_seeker_profiles(experience_level);
CREATE INDEX IF NOT EXISTS idx_job_seeker_profiles_location ON job_seeker_profiles(city, country);
CREATE INDEX IF NOT EXISTS idx_job_seeker_profiles_remote ON job_seeker_profiles(open_to_remote);
CREATE INDEX IF NOT EXISTS idx_job_seeker_profiles_created_at ON job_seeker_profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_seeker_profiles_skills ON job_seeker_profiles USING GIN(skills);

-- Full-text search index for profiles
CREATE INDEX IF NOT EXISTS idx_job_seeker_profiles_search ON job_seeker_profiles USING GIN(
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(summary, ''))
);

-- Job Applications Indexes
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant_id ON job_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_created_at ON job_applications(created_at DESC);

-- Job Favorites Indexes
CREATE INDEX IF NOT EXISTS idx_job_favorites_user_id ON job_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_job_favorites_job_id ON job_favorites(job_id);
CREATE INDEX IF NOT EXISTS idx_job_favorites_profile_id ON job_favorites(profile_id);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_seeker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_favorites ENABLE ROW LEVEL SECURITY;

-- ============================================
-- JOB_POSTINGS POLICIES
-- ============================================

-- Anyone can view active job postings
CREATE POLICY "Anyone can view active job postings"
  ON job_postings FOR SELECT
  USING (
    status = 'active' OR
    posted_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'admin')
    )
  );

-- Approved users can create job postings
CREATE POLICY "Approved users can create job postings"
  ON job_postings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.status = 'approved'
    )
    AND posted_by = auth.uid()
  );

-- Poster can update their own job postings, admins can update any
CREATE POLICY "Poster can update own job postings, admins can update any"
  ON job_postings FOR UPDATE
  USING (
    posted_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'admin')
    )
  )
  WITH CHECK (
    posted_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'admin')
    )
  );

-- Poster can delete their own job postings, admins can delete any
CREATE POLICY "Poster can delete own job postings, admins can delete any"
  ON job_postings FOR DELETE
  USING (
    posted_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'admin')
    )
  );

-- ============================================
-- JOB_SEEKER_PROFILES POLICIES
-- ============================================

-- Anyone can view active profiles
CREATE POLICY "Anyone can view active job seeker profiles"
  ON job_seeker_profiles FOR SELECT
  USING (
    status = 'active' OR
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'admin')
    )
  );

-- Users can create their own profile
CREATE POLICY "Users can create own job seeker profile"
  ON job_seeker_profiles FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.status = 'approved'
    )
  );

-- User can update their own profile, admins can update any
CREATE POLICY "User can update own profile, admins can update any"
  ON job_seeker_profiles FOR UPDATE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'admin')
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'admin')
    )
  );

-- User can delete their own profile, admins can delete any
CREATE POLICY "User can delete own profile, admins can delete any"
  ON job_seeker_profiles FOR DELETE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'admin')
    )
  );

-- ============================================
-- JOB_APPLICATIONS POLICIES
-- ============================================

-- Applicant can view their own applications, job poster can view applications to their jobs
CREATE POLICY "Applicant and job poster can view applications"
  ON job_applications FOR SELECT
  USING (
    applicant_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM job_postings
      WHERE job_postings.id = job_applications.job_id
      AND job_postings.posted_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'admin')
    )
  );

-- Approved users can create applications
CREATE POLICY "Approved users can create applications"
  ON job_applications FOR INSERT
  WITH CHECK (
    applicant_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.status = 'approved'
    )
  );

-- Job poster can update application status, applicant can update their message
CREATE POLICY "Job poster can update status, applicant can update message"
  ON job_applications FOR UPDATE
  USING (
    applicant_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM job_postings
      WHERE job_postings.id = job_applications.job_id
      AND job_postings.posted_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'admin')
    )
  );

-- Job poster can delete applications, applicant can delete their own
CREATE POLICY "Job poster and applicant can delete applications"
  ON job_applications FOR DELETE
  USING (
    applicant_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM job_postings
      WHERE job_postings.id = job_applications.job_id
      AND job_postings.posted_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'admin')
    )
  );

-- ============================================
-- JOB_FAVORITES POLICIES
-- ============================================

-- Users can view their own favorites
CREATE POLICY "Users can view own favorites"
  ON job_favorites FOR SELECT
  USING (user_id = auth.uid());

-- Users can create their own favorites
CREATE POLICY "Users can create own favorites"
  ON job_favorites FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own favorites
CREATE POLICY "Users can delete own favorites"
  ON job_favorites FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE TRIGGER update_job_postings_updated_at
  BEFORE UPDATE ON job_postings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_seeker_profiles_updated_at
  BEFORE UPDATE ON job_seeker_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STORAGE BUCKET: job-files
-- ============================================
-- Note: Storage buckets must be created manually in Supabase Dashboard
-- This is a reference for what needs to be created:
-- 
-- Bucket Name: job-files
-- Public: false (private bucket)
-- File Size Limit: None (unlimited)
-- Allowed MIME Types:
--   - application/pdf
--   - application/msword
--   - application/vnd.openxmlformats-officedocument.wordprocessingml.document
--   - image/jpeg
--   - image/png
--   - image/webp
--   - image/gif
--   - application/zip
--   - application/x-zip-compressed
--
-- Storage Policies (RLS):
--   - Users can upload files to their own folder: {user_id}/
--   - Users can read files they uploaded
--   - Job poster can read applicant files
--   - Admins can read all files
-- ============================================

-- ============================================
-- HELPER VIEWS
-- ============================================

-- View: Recent job postings (last 7 days)
CREATE OR REPLACE VIEW recent_job_postings 
WITH (security_invoker = true)
AS
SELECT 
  jp.*,
  u.name as posted_by_name,
  u.image as posted_by_image,
  c.name as company_name,
  c.logo_url as company_logo_url,
  CASE 
    WHEN jp.created_at > NOW() - INTERVAL '24 hours' THEN 'today'
    WHEN jp.created_at > NOW() - INTERVAL '7 days' THEN 'this_week'
    WHEN jp.created_at > NOW() - INTERVAL '30 days' THEN 'this_month'
    ELSE 'older'
  END as time_period
FROM job_postings jp
LEFT JOIN users u ON u.id = jp.posted_by
LEFT JOIN companies c ON c.id = jp.company_id
WHERE jp.status = 'active'
  AND jp.created_at > NOW() - INTERVAL '30 days'
ORDER BY jp.created_at DESC;

COMMENT ON VIEW recent_job_postings IS 
  'Recent job postings with user and company info. SECURITY INVOKER - respects RLS.';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
