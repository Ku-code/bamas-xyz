-- ============================================
-- ENHANCED TERMINOLOGY DICTIONARY SYSTEM
-- Migration 016: Complete terminology infrastructure
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TERMINOLOGY TERMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS terminology_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term_en TEXT NOT NULL,
  term_bg TEXT,
  latin_script TEXT,
  description_en TEXT NOT NULL,
  description_bg TEXT,
  acronym TEXT,
  synonyms_en TEXT[],
  synonyms_bg TEXT[],
  category TEXT NOT NULL CHECK (category IN ('Materials', 'Processes', 'Equipment', 'Software', 'Quality_Control', 'Post_Processing', 'Design', 'Standards', 'General')),
  subcategory TEXT,
  difficulty_level TEXT NOT NULL DEFAULT 'Basic' CHECK (difficulty_level IN ('Basic', 'Intermediate', 'Advanced', 'Expert')),
  translation_status TEXT NOT NULL DEFAULT 'Draft' CHECK (translation_status IN ('Draft', 'Under Review', 'Approved', 'Needs Translation')),
  is_expert_verified BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[],
  standard_reference TEXT,
  view_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  last_modified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(term_en)
);

-- Indexes for terminology_terms
CREATE INDEX IF NOT EXISTS idx_terms_category ON terminology_terms(category);
CREATE INDEX IF NOT EXISTS idx_terms_status ON terminology_terms(translation_status);
CREATE INDEX IF NOT EXISTS idx_terms_difficulty ON terminology_terms(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_terms_view_count ON terminology_terms(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_terms_created_by ON terminology_terms(created_by);
CREATE INDEX IF NOT EXISTS idx_terms_created_at ON terminology_terms(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_terms_en_search ON terminology_terms USING gin(to_tsvector('english', term_en || ' ' || COALESCE(description_en, '')));
CREATE INDEX IF NOT EXISTS idx_terms_bg_search ON terminology_terms USING gin(to_tsvector('simple', COALESCE(term_bg, '') || ' ' || COALESCE(description_bg, '')));

-- ============================================
-- TERMINOLOGY HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS terminology_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term_id UUID NOT NULL REFERENCES terminology_terms(id) ON DELETE CASCADE,
  field_changed TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_history_term_id ON terminology_history(term_id);
CREATE INDEX IF NOT EXISTS idx_history_changed_at ON terminology_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_changed_by ON terminology_history(changed_by);

-- ============================================
-- TERMINOLOGY RELATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS terminology_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term_id UUID NOT NULL REFERENCES terminology_terms(id) ON DELETE CASCADE,
  related_term_id UUID NOT NULL REFERENCES terminology_terms(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL CHECK (relation_type IN ('synonym', 'antonym', 'see_also', 'parent', 'child', 'related_process', 'related_material')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(term_id, related_term_id, relation_type)
);

CREATE INDEX IF NOT EXISTS idx_relations_term_id ON terminology_relations(term_id);
CREATE INDEX IF NOT EXISTS idx_relations_related_term_id ON terminology_relations(related_term_id);
CREATE INDEX IF NOT EXISTS idx_relations_type ON terminology_relations(relation_type);

-- ============================================
-- TERMINOLOGY EXAMPLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS terminology_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term_id UUID NOT NULL REFERENCES terminology_terms(id) ON DELETE CASCADE,
  example_en TEXT NOT NULL,
  example_bg TEXT,
  context TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_examples_term_id ON terminology_examples(term_id);
CREATE INDEX IF NOT EXISTS idx_examples_created_by ON terminology_examples(created_by);

-- ============================================
-- TERMINOLOGY IMAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS terminology_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term_id UUID NOT NULL REFERENCES terminology_terms(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption_en TEXT,
  caption_bg TEXT,
  alt_text TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_images_term_id ON terminology_images(term_id);
CREATE INDEX IF NOT EXISTS idx_images_uploaded_by ON terminology_images(uploaded_by);

-- ============================================
-- TERMINOLOGY COMMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS terminology_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term_id UUID NOT NULL REFERENCES terminology_terms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  parent_id UUID REFERENCES terminology_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_comments_term_id ON terminology_comments(term_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON terminology_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON terminology_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON terminology_comments(created_at DESC);

-- ============================================
-- TERMINOLOGY FAVORITES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS terminology_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term_id UUID NOT NULL REFERENCES terminology_terms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bookmarked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(term_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_term_id ON terminology_favorites(term_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON terminology_favorites(user_id);

-- ============================================
-- TERMINOLOGY ANALYTICS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS terminology_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term_id UUID REFERENCES terminology_terms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('view', 'search', 'export', 'favorite', 'comment', 'share')),
  metadata JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_term_id ON terminology_analytics(term_id);
CREATE INDEX IF NOT EXISTS idx_analytics_action_type ON terminology_analytics(action_type);
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON terminology_analytics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON terminology_analytics(user_id);

-- ============================================
-- TERMINOLOGY SUGGESTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS terminology_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term_en TEXT NOT NULL,
  term_bg TEXT,
  description_en TEXT NOT NULL,
  description_bg TEXT,
  category TEXT NOT NULL CHECK (category IN ('Materials', 'Processes', 'Equipment', 'Software', 'Quality_Control', 'Post_Processing', 'Design', 'Standards', 'General')),
  suggested_by_name TEXT NOT NULL,
  suggested_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_suggestions_status ON terminology_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_suggestions_suggested_by ON terminology_suggestions(suggested_by);
CREATE INDEX IF NOT EXISTS idx_suggestions_created_at ON terminology_suggestions(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE terminology_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminology_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminology_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminology_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminology_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminology_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminology_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminology_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminology_suggestions ENABLE ROW LEVEL SECURITY;

-- TERMINOLOGY TERMS POLICIES
-- All authenticated users can read approved terms
CREATE POLICY "Users can read approved terms" ON terminology_terms
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND 
    (translation_status = 'Approved' OR created_by = auth.uid() OR 
     EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'board_member')))
  );

-- Admins/Experts can create terms
CREATE POLICY "Admins can create terms" ON terminology_terms
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'board_member'))
  );

-- Admins/Experts can update terms
CREATE POLICY "Admins can update terms" ON terminology_terms
  FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'board_member'))
  );

-- Admins/Experts can delete terms
CREATE POLICY "Admins can delete terms" ON terminology_terms
  FOR DELETE
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'board_member'))
  );

-- TERMINOLOGY HISTORY POLICIES
-- All authenticated users can read history
CREATE POLICY "Users can read history" ON terminology_history
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- System creates history (via triggers)
CREATE POLICY "System can create history" ON terminology_history
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- TERMINOLOGY RELATIONS POLICIES
-- All authenticated users can read relations
CREATE POLICY "Users can read relations" ON terminology_relations
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Admins/Experts can manage relations
CREATE POLICY "Admins can manage relations" ON terminology_relations
  FOR ALL
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'board_member'))
  );

-- TERMINOLOGY EXAMPLES POLICIES
-- All authenticated users can read examples
CREATE POLICY "Users can read examples" ON terminology_examples
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- All authenticated users can create examples
CREATE POLICY "Users can create examples" ON terminology_examples
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND created_by = auth.uid());

-- Admins/Experts can update/delete examples
CREATE POLICY "Admins can manage examples" ON terminology_examples
  FOR ALL
  USING (
    auth.role() = 'authenticated' AND
    (created_by = auth.uid() OR 
     EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'board_member')))
  );

-- TERMINOLOGY IMAGES POLICIES
-- All authenticated users can read images
CREATE POLICY "Users can read images" ON terminology_images
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Admins/Experts can manage images
CREATE POLICY "Admins can manage images" ON terminology_images
  FOR ALL
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'board_member'))
  );

-- TERMINOLOGY COMMENTS POLICIES
-- All authenticated users can read comments
CREATE POLICY "Users can read comments" ON terminology_comments
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- All authenticated users can create comments
CREATE POLICY "Users can create comments" ON terminology_comments
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

-- Users can update/delete own comments, admins can manage all
CREATE POLICY "Users can manage own comments" ON terminology_comments
  FOR UPDATE
  USING (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY "Users can delete own comments" ON terminology_comments
  FOR DELETE
  USING (
    auth.role() = 'authenticated' AND 
    (user_id = auth.uid() OR 
     EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'board_member')))
  );

-- TERMINOLOGY FAVORITES POLICIES
-- Users can read own favorites
CREATE POLICY "Users can read own favorites" ON terminology_favorites
  FOR SELECT
  USING (auth.role() = 'authenticated' AND user_id = auth.uid());

-- Users can create own favorites
CREATE POLICY "Users can create favorites" ON terminology_favorites
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

-- Users can delete own favorites
CREATE POLICY "Users can delete own favorites" ON terminology_favorites
  FOR DELETE
  USING (auth.role() = 'authenticated' AND user_id = auth.uid());

-- TERMINOLOGY ANALYTICS POLICIES
-- All authenticated users can create analytics events
CREATE POLICY "Users can create analytics" ON terminology_analytics
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Admins can read all analytics
CREATE POLICY "Admins can read analytics" ON terminology_analytics
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'board_member'))
  );

-- TERMINOLOGY SUGGESTIONS POLICIES
-- All authenticated users can read suggestions
CREATE POLICY "Users can read suggestions" ON terminology_suggestions
  FOR SELECT
  USING (
    auth.role() = 'authenticated' AND
    (suggested_by = auth.uid() OR 
     EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'board_member')))
  );

-- All authenticated users can create suggestions
CREATE POLICY "Users can create suggestions" ON terminology_suggestions
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND suggested_by = auth.uid());

-- Admins/Experts can update suggestions (approve/reject)
CREATE POLICY "Admins can update suggestions" ON terminology_suggestions
  FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('superadmin', 'admin', 'board_member'))
  );

-- ============================================
-- TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_terminology_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for terminology_terms
CREATE TRIGGER update_terminology_terms_updated_at
  BEFORE UPDATE ON terminology_terms
  FOR EACH ROW
  EXECUTE FUNCTION update_terminology_updated_at();

-- Function to track history
CREATE OR REPLACE FUNCTION track_terminology_history()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.term_en IS DISTINCT FROM NEW.term_en THEN
      INSERT INTO terminology_history (term_id, field_changed, old_value, new_value, changed_by)
      VALUES (NEW.id, 'term_en', OLD.term_en, NEW.term_en, COALESCE(NEW.last_modified_by, auth.uid()));
    END IF;
    IF OLD.term_bg IS DISTINCT FROM NEW.term_bg THEN
      INSERT INTO terminology_history (term_id, field_changed, old_value, new_value, changed_by)
      VALUES (NEW.id, 'term_bg', OLD.term_bg, NEW.term_bg, COALESCE(NEW.last_modified_by, auth.uid()));
    END IF;
    IF OLD.description_en IS DISTINCT FROM NEW.description_en THEN
      INSERT INTO terminology_history (term_id, field_changed, old_value, new_value, changed_by)
      VALUES (NEW.id, 'description_en', OLD.description_en, NEW.description_en, COALESCE(NEW.last_modified_by, auth.uid()));
    END IF;
    IF OLD.description_bg IS DISTINCT FROM NEW.description_bg THEN
      INSERT INTO terminology_history (term_id, field_changed, old_value, new_value, changed_by)
      VALUES (NEW.id, 'description_bg', OLD.description_bg, NEW.description_bg, COALESCE(NEW.last_modified_by, auth.uid()));
    END IF;
    IF OLD.translation_status IS DISTINCT FROM NEW.translation_status THEN
      INSERT INTO terminology_history (term_id, field_changed, old_value, new_value, changed_by)
      VALUES (NEW.id, 'translation_status', OLD.translation_status, NEW.translation_status, COALESCE(NEW.last_modified_by, auth.uid()));
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for history tracking
CREATE TRIGGER track_terminology_changes
  AFTER UPDATE ON terminology_terms
  FOR EACH ROW
  EXECUTE FUNCTION track_terminology_history();

-- Function to update favorite_count
CREATE OR REPLACE FUNCTION update_favorite_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE terminology_terms
    SET favorite_count = favorite_count + 1
    WHERE id = NEW.term_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE terminology_terms
    SET favorite_count = GREATEST(0, favorite_count - 1)
    WHERE id = OLD.term_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for favorite_count
CREATE TRIGGER update_favorite_count_trigger
  AFTER INSERT OR DELETE ON terminology_favorites
  FOR EACH ROW
  EXECUTE FUNCTION update_favorite_count();
