-- ============================================
-- PROFESSIONAL MEETING & AGENDA MANAGEMENT SYSTEM
-- Migration 013: Complete meeting and agenda infrastructure
-- ============================================

-- ============================================
-- MEETINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('general_assembly', 'board_meeting')),
  title TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'in_progress', 'completed', 'cancelled')),
  chairperson_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Indexes for meetings table
CREATE INDEX IF NOT EXISTS idx_meetings_type ON meetings(type);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_scheduled_date ON meetings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_meetings_created_by ON meetings(created_by);
CREATE INDEX IF NOT EXISTS idx_meetings_chairperson_id ON meetings(chairperson_id);
CREATE INDEX IF NOT EXISTS idx_meetings_created_at ON meetings(created_at DESC);

-- ============================================
-- AGENDAS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS agendas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  rules JSONB, -- Procedural framework (e.g., quorum requirements, voting rules)
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'proposed', 'adopted', 'locked')),
  adopted_at TIMESTAMPTZ,
  adopted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  UNIQUE(meeting_id, version)
);

-- Indexes for agendas table
CREATE INDEX IF NOT EXISTS idx_agendas_meeting_id ON agendas(meeting_id);
CREATE INDEX IF NOT EXISTS idx_agendas_status ON agendas(status);
CREATE INDEX IF NOT EXISTS idx_agendas_version ON agendas(meeting_id, version DESC);

-- ============================================
-- ENHANCE AGENDA ITEMS TABLE
-- ============================================
-- Add new columns to existing agenda_items table
ALTER TABLE agenda_items 
  ADD COLUMN IF NOT EXISTS meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS agenda_id UUID REFERENCES agendas(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS parent_item_id UUID REFERENCES agenda_items(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS order_index INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('proposed', 'approved', 'in_discussion', 'completed', 'deferred')),
  ADD COLUMN IF NOT EXISTS proposed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS proposed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS discussion_notes JSONB,
  ADD COLUMN IF NOT EXISTS minutes TEXT;

-- Indexes for enhanced agenda_items
CREATE INDEX IF NOT EXISTS idx_agenda_items_meeting_id ON agenda_items(meeting_id);
CREATE INDEX IF NOT EXISTS idx_agenda_items_agenda_id ON agenda_items(agenda_id);
CREATE INDEX IF NOT EXISTS idx_agenda_items_parent_item_id ON agenda_items(parent_item_id);
CREATE INDEX IF NOT EXISTS idx_agenda_items_order_index ON agenda_items(agenda_id, order_index);
CREATE INDEX IF NOT EXISTS idx_agenda_items_status ON agenda_items(status);
CREATE INDEX IF NOT EXISTS idx_agenda_items_proposed_by ON agenda_items(proposed_by);

-- ============================================
-- AGENDA PROPOSALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS agenda_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  agenda_id UUID REFERENCES agendas(id) ON DELETE SET NULL,
  parent_item_id UUID REFERENCES agenda_items(id) ON DELETE SET NULL, -- null for top-level, UUID for sub-item
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  justification TEXT,
  proposed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  proposed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT
);

-- Indexes for agenda_proposals
CREATE INDEX IF NOT EXISTS idx_agenda_proposals_meeting_id ON agenda_proposals(meeting_id);
CREATE INDEX IF NOT EXISTS idx_agenda_proposals_agenda_id ON agenda_proposals(agenda_id);
CREATE INDEX IF NOT EXISTS idx_agenda_proposals_parent_item_id ON agenda_proposals(parent_item_id);
CREATE INDEX IF NOT EXISTS idx_agenda_proposals_proposed_by ON agenda_proposals(proposed_by);
CREATE INDEX IF NOT EXISTS idx_agenda_proposals_status ON agenda_proposals(status);
CREATE INDEX IF NOT EXISTS idx_agenda_proposals_proposed_at ON agenda_proposals(proposed_at DESC);

-- ============================================
-- MEETING MINUTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS meeting_minutes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  agenda_item_id UUID NOT NULL REFERENCES agenda_items(id) ON DELETE CASCADE,
  discussion_summary TEXT,
  decisions JSONB, -- Array of decision objects
  action_items JSONB, -- Array of action item objects
  assigned_responsibilities JSONB, -- Array of responsibility assignments
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  ai_model TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Indexes for meeting_minutes
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_meeting_id ON meeting_minutes(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_agenda_item_id ON meeting_minutes(agenda_item_id);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_created_by ON meeting_minutes(created_by);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_approved_by ON meeting_minutes(approved_by);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_created_at ON meeting_minutes(created_at DESC);

-- ============================================
-- POLL AGENDA LINKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS poll_agenda_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  agenda_item_id UUID NOT NULL REFERENCES agenda_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(poll_id, agenda_item_id)
);

-- Indexes for poll_agenda_links
CREATE INDEX IF NOT EXISTS idx_poll_agenda_links_poll_id ON poll_agenda_links(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_agenda_links_agenda_item_id ON poll_agenda_links(agenda_item_id);

-- ============================================
-- AGENDA AUDIT LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS agenda_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  agenda_id UUID REFERENCES agendas(id) ON DELETE CASCADE,
  agenda_item_id UUID REFERENCES agenda_items(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- e.g., 'proposal_submitted', 'agenda_adopted', 'item_completed', 'vote_recorded'
  action_description TEXT NOT NULL,
  performed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for agenda_audit_log
CREATE INDEX IF NOT EXISTS idx_agenda_audit_log_meeting_id ON agenda_audit_log(meeting_id);
CREATE INDEX IF NOT EXISTS idx_agenda_audit_log_agenda_id ON agenda_audit_log(agenda_id);
CREATE INDEX IF NOT EXISTS idx_agenda_audit_log_agenda_item_id ON agenda_audit_log(agenda_item_id);
CREATE INDEX IF NOT EXISTS idx_agenda_audit_log_action_type ON agenda_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_agenda_audit_log_performed_by ON agenda_audit_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_agenda_audit_log_created_at ON agenda_audit_log(created_at DESC);

-- ============================================
-- ENHANCE AGENDA COMMENTS TABLE
-- ============================================
-- Add parent_comment_id for threaded discussions
ALTER TABLE agenda_comments 
  ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES agenda_comments(id) ON DELETE CASCADE;

-- Index for threaded comments
CREATE INDEX IF NOT EXISTS idx_agenda_comments_parent_comment_id ON agenda_comments(parent_comment_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on new tables
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_minutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_agenda_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- MEETINGS TABLE POLICIES
-- ============================================

-- All authenticated users can view meetings
CREATE POLICY "Users can view meetings"
  ON meetings FOR SELECT
  USING (auth.role() = 'authenticated');

-- Admins and superadmins can create meetings
CREATE POLICY "Admins can create meetings"
  ON meetings FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::uuid
      AND users.role IN ('superadmin', 'admin', 'board_member')
    )
  );

-- Admins and superadmins can update meetings
CREATE POLICY "Admins can update meetings"
  ON meetings FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::uuid
      AND users.role IN ('superadmin', 'admin', 'board_member')
    )
  );

-- Only superadmins can delete meetings
CREATE POLICY "Superadmins can delete meetings"
  ON meetings FOR DELETE
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::uuid
      AND users.role = 'superadmin'
    )
  );

-- ============================================
-- AGENDAS TABLE POLICIES
-- ============================================

-- All authenticated users can view agendas
CREATE POLICY "Users can view agendas"
  ON agendas FOR SELECT
  USING (auth.role() = 'authenticated');

-- Admins and superadmins can create agendas
CREATE POLICY "Admins can create agendas"
  ON agendas FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::uuid
      AND users.role IN ('superadmin', 'admin', 'board_member')
    )
  );

-- Admins and superadmins can update agendas (before adoption)
CREATE POLICY "Admins can update agendas"
  ON agendas FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::uuid
      AND users.role IN ('superadmin', 'admin', 'board_member')
    ) AND
    status != 'locked'
  );

-- ============================================
-- AGENDA PROPOSALS TABLE POLICIES
-- ============================================

-- All authenticated users can view proposals
CREATE POLICY "Users can view proposals"
  ON agenda_proposals FOR SELECT
  USING (auth.role() = 'authenticated');

-- All authenticated members can submit proposals
CREATE POLICY "Members can submit proposals"
  ON agenda_proposals FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    auth.uid()::uuid = proposed_by
  );

-- Admins and superadmins can review proposals
CREATE POLICY "Admins can review proposals"
  ON agenda_proposals FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::uuid
      AND users.role IN ('superadmin', 'admin', 'board_member')
    )
  );

-- ============================================
-- MEETING MINUTES TABLE POLICIES
-- ============================================

-- All authenticated users can view minutes
CREATE POLICY "Users can view minutes"
  ON meeting_minutes FOR SELECT
  USING (auth.role() = 'authenticated');

-- Admins and superadmins can create minutes
CREATE POLICY "Admins can create minutes"
  ON meeting_minutes FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::uuid
      AND users.role IN ('superadmin', 'admin', 'board_member')
    )
  );

-- Admins and superadmins can update minutes
CREATE POLICY "Admins can update minutes"
  ON meeting_minutes FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::uuid
      AND users.role IN ('superadmin', 'admin', 'board_member')
    )
  );

-- ============================================
-- POLL AGENDA LINKS TABLE POLICIES
-- ============================================

-- All authenticated users can view poll links
CREATE POLICY "Users can view poll links"
  ON poll_agenda_links FOR SELECT
  USING (auth.role() = 'authenticated');

-- Admins and superadmins can create poll links
CREATE POLICY "Admins can create poll links"
  ON poll_agenda_links FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::uuid
      AND users.role IN ('superadmin', 'admin', 'board_member')
    )
  );

-- Admins and superadmins can delete poll links
CREATE POLICY "Admins can delete poll links"
  ON poll_agenda_links FOR DELETE
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::uuid
      AND users.role IN ('superadmin', 'admin', 'board_member')
    )
  );

-- ============================================
-- AGENDA AUDIT LOG TABLE POLICIES
-- ============================================

-- All authenticated users can view audit log
CREATE POLICY "Users can view audit log"
  ON agenda_audit_log FOR SELECT
  USING (auth.role() = 'authenticated');

-- System can insert audit log (via service role or function)
-- Note: Audit logs should be inserted via database functions with SECURITY DEFINER

-- ============================================
-- UPDATE EXISTING AGENDA ITEMS POLICIES
-- ============================================

-- Update agenda_items policies to consider new fields
-- (Existing policies should still work, but we ensure they account for meeting context)

-- ============================================
-- DATABASE FUNCTIONS
-- ============================================

-- Function to create new agenda version
CREATE OR REPLACE FUNCTION create_agenda_version(
  p_meeting_id UUID,
  p_rules JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_agenda_id UUID;
  v_next_version INTEGER;
BEGIN
  -- Get next version number
  SELECT COALESCE(MAX(version), 0) + 1
  INTO v_next_version
  FROM agendas
  WHERE meeting_id = p_meeting_id;

  -- Create new agenda version
  INSERT INTO agendas (meeting_id, version, rules, status)
  VALUES (p_meeting_id, v_next_version, p_rules, 'draft')
  RETURNING id INTO v_agenda_id;

  RETURN v_agenda_id;
END;
$$;

-- Function to log agenda actions
CREATE OR REPLACE FUNCTION log_agenda_action(
  p_meeting_id UUID,
  p_agenda_id UUID,
  p_agenda_item_id UUID,
  p_action_type TEXT,
  p_action_description TEXT,
  p_old_value JSONB DEFAULT NULL,
  p_new_value JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_audit_id UUID;
  v_user_id UUID;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid()::uuid;

  -- Insert audit log entry
  INSERT INTO agenda_audit_log (
    meeting_id,
    agenda_id,
    agenda_item_id,
    action_type,
    action_description,
    performed_by,
    old_value,
    new_value
  )
  VALUES (
    p_meeting_id,
    p_agenda_id,
    p_agenda_item_id,
    p_action_type,
    p_action_description,
    v_user_id,
    p_old_value,
    p_new_value
  )
  RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$;

-- Function to automatically create agenda when meeting is created
CREATE OR REPLACE FUNCTION auto_create_agenda_for_meeting()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create initial agenda version when meeting is created
  INSERT INTO agendas (meeting_id, version, status)
  VALUES (NEW.id, 1, 'draft');
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-create agenda
DROP TRIGGER IF EXISTS trigger_auto_create_agenda ON meetings;
CREATE TRIGGER trigger_auto_create_agenda
  AFTER INSERT ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_agenda_for_meeting();

-- ============================================
-- COMMENTS
-- ============================================
-- This migration creates the complete infrastructure for professional meeting management:
-- 1. Meetings can be created (General Assembly or Board Meeting)
-- 2. Agendas are automatically created and versioned
-- 3. Members can propose agenda items/sub-items
-- 4. Proposals are reviewed and approved/rejected
-- 5. Agendas can be adopted and locked
-- 6. Minutes can be recorded per agenda item
-- 7. Polls can be linked to agenda items
-- 8. Complete audit trail is maintained
-- 9. Threaded comments are supported

