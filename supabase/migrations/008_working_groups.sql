-- ============================================
-- WORKING GROUPS SYSTEM
-- ============================================

-- Working Groups table
CREATE TABLE IF NOT EXISTS working_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  mission_statement TEXT,
  description TEXT,
  lead_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- WG Members table
CREATE TABLE IF NOT EXISTS wg_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  working_group_id UUID NOT NULL REFERENCES working_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'lead')),
  specialization TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(working_group_id, user_id)
);

-- WG Projects table
CREATE TABLE IF NOT EXISTS wg_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  working_group_id UUID NOT NULL REFERENCES working_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'completed', 'on_hold')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- WG Tasks table (Kanban items)
CREATE TABLE IF NOT EXISTS wg_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES wg_projects(id) ON DELETE SET NULL,
  working_group_id UUID NOT NULL REFERENCES working_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  due_date DATE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- WG Feed Posts table (Collaboration feed)
CREATE TABLE IF NOT EXISTS wg_feed_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  working_group_id UUID NOT NULL REFERENCES working_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- WG Resources table
CREATE TABLE IF NOT EXISTS wg_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  working_group_id UUID NOT NULL REFERENCES working_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT,
  file_name TEXT,
  file_size BIGINT,
  mime_type TEXT,
  category TEXT NOT NULL DEFAULT 'Other' CHECK (category IN ('CAD', 'PDF', 'Research', 'Other')),
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- WG Comments table
CREATE TABLE IF NOT EXISTS wg_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES wg_feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_wg_members_working_group ON wg_members(working_group_id);
CREATE INDEX IF NOT EXISTS idx_wg_members_user ON wg_members(user_id);
CREATE INDEX IF NOT EXISTS idx_wg_projects_working_group ON wg_projects(working_group_id);
CREATE INDEX IF NOT EXISTS idx_wg_projects_status ON wg_projects(status);
CREATE INDEX IF NOT EXISTS idx_wg_tasks_working_group ON wg_tasks(working_group_id);
CREATE INDEX IF NOT EXISTS idx_wg_tasks_project ON wg_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_wg_tasks_status ON wg_tasks(status);
CREATE INDEX IF NOT EXISTS idx_wg_tasks_assigned_to ON wg_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_wg_feed_posts_working_group ON wg_feed_posts(working_group_id);
CREATE INDEX IF NOT EXISTS idx_wg_feed_posts_user ON wg_feed_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_wg_feed_posts_created_at ON wg_feed_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wg_resources_working_group ON wg_resources(working_group_id);
CREATE INDEX IF NOT EXISTS idx_wg_resources_category ON wg_resources(category);
CREATE INDEX IF NOT EXISTS idx_wg_resources_is_approved ON wg_resources(is_approved);
CREATE INDEX IF NOT EXISTS idx_wg_comments_post ON wg_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_wg_comments_user ON wg_comments(user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE TRIGGER update_working_groups_updated_at
  BEFORE UPDATE ON working_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wg_projects_updated_at
  BEFORE UPDATE ON wg_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wg_tasks_updated_at
  BEFORE UPDATE ON wg_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wg_feed_posts_updated_at
  BEFORE UPDATE ON wg_feed_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wg_resources_updated_at
  BEFORE UPDATE ON wg_resources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wg_comments_updated_at
  BEFORE UPDATE ON wg_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE working_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE wg_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE wg_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE wg_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE wg_feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wg_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE wg_comments ENABLE ROW LEVEL SECURITY;

-- Working Groups policies
CREATE POLICY "Working groups are viewable by all authenticated users"
  ON working_groups FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can create working groups"
  ON working_groups FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'admin')
    )
  );

CREATE POLICY "Only admins and WG leads can update working groups"
  ON working_groups FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'admin')
    )
    OR lead_user_id = auth.uid()
  );

-- WG Members policies
CREATE POLICY "WG members are viewable by all authenticated users"
  ON wg_members FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can join working groups"
  ON wg_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave working groups or admins can remove members"
  ON wg_members FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'admin')
    )
    OR EXISTS (
      SELECT 1 FROM working_groups
      WHERE working_groups.id = wg_members.working_group_id
      AND working_groups.lead_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and WG leads can update member roles"
  ON wg_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'admin')
    )
    OR EXISTS (
      SELECT 1 FROM working_groups
      WHERE working_groups.id = wg_members.working_group_id
      AND working_groups.lead_user_id = auth.uid()
    )
  );

-- WG Projects policies
CREATE POLICY "Projects are viewable by WG members"
  ON wg_projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM wg_members
      WHERE wg_members.working_group_id = wg_projects.working_group_id
      AND wg_members.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'admin')
    )
  );

CREATE POLICY "WG members can create projects"
  ON wg_projects FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM wg_members
      WHERE wg_members.working_group_id = wg_projects.working_group_id
      AND wg_members.user_id = auth.uid()
    )
  );

CREATE POLICY "WG leads and project creators can update projects"
  ON wg_projects FOR UPDATE
  USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM working_groups
      WHERE working_groups.id = wg_projects.working_group_id
      AND working_groups.lead_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'admin')
    )
  );

CREATE POLICY "WG leads and project creators can delete projects"
  ON wg_projects FOR DELETE
  USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM working_groups
      WHERE working_groups.id = wg_projects.working_group_id
      AND working_groups.lead_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'admin')
    )
  );

-- WG Tasks policies
CREATE POLICY "Tasks are viewable by WG members"
  ON wg_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM wg_members
      WHERE wg_members.working_group_id = wg_tasks.working_group_id
      AND wg_members.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'admin')
    )
  );

CREATE POLICY "WG members can create tasks"
  ON wg_tasks FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM wg_members
      WHERE wg_members.working_group_id = wg_tasks.working_group_id
      AND wg_members.user_id = auth.uid()
    )
  );

CREATE POLICY "WG members can update tasks"
  ON wg_tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM wg_members
      WHERE wg_members.working_group_id = wg_tasks.working_group_id
      AND wg_members.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'admin')
    )
  );

CREATE POLICY "WG leads and task creators can delete tasks"
  ON wg_tasks FOR DELETE
  USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM working_groups
      WHERE working_groups.id = wg_tasks.working_group_id
      AND working_groups.lead_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'admin')
    )
  );

-- WG Feed Posts policies
CREATE POLICY "Feed posts are viewable by WG members"
  ON wg_feed_posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM wg_members
      WHERE wg_members.working_group_id = wg_feed_posts.working_group_id
      AND wg_members.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'admin')
    )
  );

CREATE POLICY "WG members can create feed posts"
  ON wg_feed_posts FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM wg_members
      WHERE wg_members.working_group_id = wg_feed_posts.working_group_id
      AND wg_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own posts"
  ON wg_feed_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users and WG leads can delete posts"
  ON wg_feed_posts FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM working_groups
      WHERE working_groups.id = wg_feed_posts.working_group_id
      AND working_groups.lead_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'admin')
    )
  );

-- WG Resources policies
CREATE POLICY "Resources are viewable by WG members"
  ON wg_resources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM wg_members
      WHERE wg_members.working_group_id = wg_resources.working_group_id
      AND wg_members.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'admin')
    )
  );

CREATE POLICY "WG members can upload resources"
  ON wg_resources FOR INSERT
  WITH CHECK (
    auth.uid() = uploaded_by
    AND EXISTS (
      SELECT 1 FROM wg_members
      WHERE wg_members.working_group_id = wg_resources.working_group_id
      AND wg_members.user_id = auth.uid()
    )
  );

CREATE POLICY "WG leads can approve resources"
  ON wg_resources FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM working_groups
      WHERE working_groups.id = wg_resources.working_group_id
      AND working_groups.lead_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'admin')
    )
    OR (auth.uid() = uploaded_by AND is_approved = false)
  );

CREATE POLICY "WG leads and uploaders can delete resources"
  ON wg_resources FOR DELETE
  USING (
    auth.uid() = uploaded_by
    OR EXISTS (
      SELECT 1 FROM working_groups
      WHERE working_groups.id = wg_resources.working_group_id
      AND working_groups.lead_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'admin')
    )
  );

-- WG Comments policies
CREATE POLICY "Comments are viewable by WG members"
  ON wg_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM wg_feed_posts
      JOIN wg_members ON wg_members.working_group_id = wg_feed_posts.working_group_id
      WHERE wg_feed_posts.id = wg_comments.post_id
      AND wg_members.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'admin')
    )
  );

CREATE POLICY "WG members can create comments"
  ON wg_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM wg_feed_posts
      JOIN wg_members ON wg_members.working_group_id = wg_feed_posts.working_group_id
      WHERE wg_feed_posts.id = wg_comments.post_id
      AND wg_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own comments"
  ON wg_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users and WG leads can delete comments"
  ON wg_comments FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM wg_feed_posts
      JOIN working_groups ON working_groups.id = wg_feed_posts.working_group_id
      WHERE wg_feed_posts.id = wg_comments.post_id
      AND working_groups.lead_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('superadmin', 'admin')
    )
  );

-- ============================================
-- SEED DATA: Initial 5 Working Groups
-- ============================================

INSERT INTO working_groups (name, slug, mission_statement, description) VALUES
  (
    'Education & Workforce',
    'education-workforce',
    'Develop comprehensive educational programs and workforce development initiatives to build a skilled additive manufacturing ecosystem in Bulgaria.',
    'Focus on curriculum development, training programs, certification standards, and bridging the skills gap in additive manufacturing.'
  ),
  (
    'Design & Prototyping',
    'design-prototyping',
    'Advance design methodologies and prototyping capabilities to accelerate innovation in additive manufacturing applications.',
    'Explore design optimization, rapid prototyping techniques, and best practices for AM design workflows.'
  ),
  (
    'Industrial Production',
    'industrial-production',
    'Establish standards and best practices for scaling additive manufacturing from prototyping to industrial production.',
    'Focus on production workflows, quality control, process optimization, and integration with traditional manufacturing.'
  ),
  (
    'Materials & Sustainability',
    'materials-sustainability',
    'Promote sustainable materials research and environmentally responsible practices in additive manufacturing.',
    'Investigate new materials, recycling strategies, lifecycle assessment, and sustainable AM processes.'
  ),
  (
    'Innovation & Policy',
    'innovation-policy',
    'Drive policy development and innovation initiatives to support the growth of additive manufacturing in Bulgaria.',
    'Work on regulatory frameworks, funding opportunities, industry partnerships, and national AM strategy.'
  )
ON CONFLICT (slug) DO NOTHING;

