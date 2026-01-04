-- ============================================
-- COMPANIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  activity_description TEXT,
  technologies TEXT[],
  headquarters_address TEXT NOT NULL,
  headquarters_latitude DOUBLE PRECISION,
  headquarters_longitude DOUBLE PRECISION,
  contact_email TEXT,
  contact_phone TEXT,
  logo_path TEXT,
  logo_url TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_by_name TEXT NOT NULL,
  created_by_image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Indexes for companies table
CREATE INDEX IF NOT EXISTS idx_companies_created_by ON companies(created_by);
CREATE INDEX IF NOT EXISTS idx_companies_coordinates ON companies(headquarters_latitude, headquarters_longitude);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON companies(created_at);

-- ============================================
-- RLS POLICIES FOR COMPANIES
-- ============================================

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view companies
CREATE POLICY "Companies are viewable by authenticated users"
  ON companies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.status = 'approved'
    )
  );

-- Policy: Approved members can create companies (auto-approved)
CREATE POLICY "Approved members can create companies"
  ON companies
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.status = 'approved'
    )
  );

-- Policy: Users can update their own companies, superadmins can update any
CREATE POLICY "Users can update own companies, superadmins can update any"
  ON companies
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (
        (companies.created_by = auth.uid() AND users.status = 'approved')
        OR users.role = 'superadmin'
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (
        (companies.created_by = auth.uid() AND users.status = 'approved')
        OR users.role = 'superadmin'
      )
    )
  );

-- Policy: Users can delete their own companies, superadmins can delete any
CREATE POLICY "Users can delete own companies, superadmins can delete any"
  ON companies
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (
        (companies.created_by = auth.uid() AND users.status = 'approved')
        OR users.role = 'superadmin'
      )
    )
  );

-- ============================================
-- UPDATE TRIGGER FOR UPDATED_AT
-- ============================================
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

