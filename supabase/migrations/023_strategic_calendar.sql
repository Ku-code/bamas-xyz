-- =====================================================
-- Strategic Calendar Migration
-- Events for AM community - conferences, exhibitions, etc.
-- =====================================================

-- Create strategic_events table
CREATE TABLE IF NOT EXISTS strategic_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'conference' CHECK (event_type IN ('conference', 'exhibition', 'workshop', 'webinar', 'meeting', 'deadline', 'other')),
  scope TEXT NOT NULL DEFAULT 'national' CHECK (scope IN ('national', 'international', 'european')),
  start_date DATE NOT NULL,
  end_date DATE,
  location TEXT,
  venue_name TEXT,
  website TEXT,
  organizer TEXT,
  registration_deadline DATE,
  is_free BOOLEAN DEFAULT TRUE,
  cost_info TEXT,
  tags TEXT[],
  
  -- Metadata
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_strategic_events_start_date ON strategic_events(start_date);
CREATE INDEX IF NOT EXISTS idx_strategic_events_scope ON strategic_events(scope);
CREATE INDEX IF NOT EXISTS idx_strategic_events_type ON strategic_events(event_type);
CREATE INDEX IF NOT EXISTS idx_strategic_events_created_by ON strategic_events(created_by);

-- Enable Row Level Security
ALTER TABLE strategic_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Everyone can view events (public read)
CREATE POLICY strategic_events_public_read ON strategic_events
  FOR SELECT USING (TRUE);

-- Only superadmin can create events
CREATE POLICY strategic_events_superadmin_insert ON strategic_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'superadmin'
    )
  );

-- Only superadmin can update events
CREATE POLICY strategic_events_superadmin_update ON strategic_events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'superadmin'
    )
  );

-- Only superadmin can delete events
CREATE POLICY strategic_events_superadmin_delete ON strategic_events
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'superadmin'
    )
  );

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_strategic_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS strategic_events_updated_at ON strategic_events;
CREATE TRIGGER strategic_events_updated_at
  BEFORE UPDATE ON strategic_events
  FOR EACH ROW EXECUTE FUNCTION update_strategic_events_updated_at();

-- Seed some example events
INSERT INTO strategic_events (title, description, event_type, scope, start_date, end_date, location, venue_name, website, organizer, is_free, tags, created_by, created_by_name)
SELECT
  'Formnext 2026',
  'The leading international exhibition and conference for additive manufacturing and the next generation of intelligent industrial production.',
  'exhibition',
  'international',
  '2026-11-17',
  '2026-11-20',
  'Frankfurt, Germany',
  'Messe Frankfurt',
  'https://formnext.mesago.com/',
  'Mesago Messe Frankfurt GmbH',
  FALSE,
  ARRAY['3D Printing', 'AM', 'Industry 4.0', 'Materials'],
  id,
  name
FROM users WHERE role = 'superadmin' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO strategic_events (title, description, event_type, scope, start_date, end_date, location, venue_name, website, organizer, is_free, tags, created_by, created_by_name)
SELECT
  'RAPID + TCT 2026',
  'North America largest and most influential additive manufacturing event.',
  'conference',
  'international',
  '2026-05-05',
  '2026-05-08',
  'Detroit, MI, USA',
  'Huntington Place',
  'https://www.rapid3devent.com/',
  'SME',
  FALSE,
  ARRAY['3D Printing', 'AM', 'Design', 'Manufacturing'],
  id,
  name
FROM users WHERE role = 'superadmin' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO strategic_events (title, description, event_type, scope, start_date, end_date, location, venue_name, website, organizer, is_free, tags, created_by, created_by_name)
SELECT
  'BAMAS Annual Meeting 2026',
  'Annual general meeting of the Bulgarian Additive Manufacturing Association.',
  'meeting',
  'national',
  '2026-03-15',
  '2026-03-15',
  'Sofia, Bulgaria',
  'Sofia Tech Park',
  'https://bamas.xyz/',
  'BAMAS',
  TRUE,
  ARRAY['BAMAS', 'AGM', 'Networking'],
  id,
  name
FROM users WHERE role = 'superadmin' LIMIT 1
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON strategic_events TO authenticated;
GRANT ALL ON strategic_events TO anon;
