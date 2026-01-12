import { supabase } from './supabase';

// ============================================
// TYPES
// ============================================

export type TranslationStatus = 'Draft' | 'Under Review' | 'Approved' | 'Needs Translation';
export type TermCategory = 'Materials' | 'Processes' | 'Equipment' | 'Software' | 
  'Quality_Control' | 'Post_Processing' | 'Design' | 'Standards' | 'General';
export type DifficultyLevel = 'Basic' | 'Intermediate' | 'Advanced' | 'Expert';
export type SuggestionStatus = 'pending' | 'approved' | 'rejected';
export type RelationType = 'synonym' | 'antonym' | 'see_also' | 'parent' | 'child' | 
  'related_process' | 'related_material';
export type LanguageView = 'both' | 'english' | 'bulgarian';
export type AnalyticsAction = 'view' | 'search' | 'export' | 'favorite' | 'comment' | 'share';

export interface TerminologyTerm {
  id: string;
  term_en: string;
  term_bg: string | null;
  latin_script: string | null;
  description_en: string;
  description_bg: string | null;
  acronym: string | null;
  synonyms_en: string[] | null;
  synonyms_bg: string[] | null;
  category: TermCategory;
  subcategory: string | null;
  difficulty_level: DifficultyLevel;
  translation_status: TranslationStatus;
  is_expert_verified: boolean;
  tags: string[] | null;
  standard_reference: string | null;
  view_count: number;
  favorite_count: number;
  created_by: string;
  created_at: string;
  updated_at: string | null;
  last_modified_by: string | null;
  // Relationships (loaded separately)
  related_terms?: TermRelation[];
  examples?: TermExample[];
  images?: TermImage[];
  comments?: TermComment[];
  is_favorited?: boolean;
}

export interface TermHistory {
  id: string;
  term_id: string;
  field_changed: string;
  old_value: string | null;
  new_value: string | null;
  changed_by: string;
  changed_at: string;
  user_name?: string;
}

export interface TermRelation {
  id: string;
  term_id: string;
  related_term_id: string;
  relation_type: RelationType;
  description: string | null;
  related_term?: TerminologyTerm;
}

export interface TermExample {
  id: string;
  term_id: string;
  example_en: string;
  example_bg: string | null;
  context: string | null;
  created_by: string;
  created_at: string;
  user_name?: string;
}

export interface TermImage {
  id: string;
  term_id: string;
  image_url: string;
  caption_en: string | null;
  caption_bg: string | null;
  alt_text: string;
  uploaded_by: string;
  uploaded_at: string;
}

export interface TermComment {
  id: string;
  term_id: string;
  user_id: string;
  comment: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string | null;
  user_name?: string;
  user_avatar?: string;
  replies?: TermComment[];
}

export interface TerminologySuggestion {
  id: string;
  term_en: string;
  term_bg: string | null;
  description_en: string;
  description_bg: string | null;
  category: TermCategory;
  suggested_by_name: string;
  suggested_by: string;
  status: SuggestionStatus;
  admin_notes: string | null;
  reviewed_by: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface TerminologyStats {
  total_terms: number;
  translation_progress: number;
  terms_by_category: Record<TermCategory, number>;
  terms_by_status: Record<TranslationStatus, number>;
  terms_by_difficulty: Record<DifficultyLevel, number>;
  expert_verified_count: number;
  pending_suggestions: number;
  total_favorites: number;
  total_views: number;
}

export interface SearchFilters {
  query?: string;
  category?: TermCategory[];
  translation_status?: TranslationStatus[];
  difficulty_level?: DifficultyLevel[];
  is_expert_verified?: boolean;
  has_bg_translation?: boolean;
  has_examples?: boolean;
  has_images?: boolean;
  favorites_only?: boolean;
  date_from?: string;
  date_to?: string;
  sort_by?: 'alphabetical' | 'recent' | 'views' | 'favorites';
  sort_order?: 'asc' | 'desc';
  language_view?: LanguageView;
}

// ============================================
// TERM CRUD OPERATIONS
// ============================================

export const loadTerms = async (filters?: SearchFilters, limit = 50, offset = 0): Promise<TerminologyTerm[]> => {
  try {
    let query = supabase
      .from('terminology_terms')
      .select('*');

    // Apply filters
    if (filters?.category && filters.category.length > 0) {
      query = query.in('category', filters.category);
    }

    if (filters?.translation_status && filters.translation_status.length > 0) {
      query = query.in('translation_status', filters.translation_status);
    }

    if (filters?.difficulty_level && filters.difficulty_level.length > 0) {
      query = query.in('difficulty_level', filters.difficulty_level);
    }

    if (filters?.is_expert_verified !== undefined) {
      query = query.eq('is_expert_verified', filters.is_expert_verified);
    }

    if (filters?.has_bg_translation) {
      query = query.not('term_bg', 'is', null);
    }

    // Language view filter
    if (filters?.language_view === 'bulgarian') {
      query = query.not('term_bg', 'is', null);
    }

    // Text search
    if (filters?.query) {
      const searchTerm = filters.query.toLowerCase();
      query = query.or(`term_en.ilike.%${searchTerm}%,term_bg.ilike.%${searchTerm}%,description_en.ilike.%${searchTerm}%,description_bg.ilike.%${searchTerm}%`);
    }

    // Sorting
    const sortBy = filters?.sort_by || 'alphabetical';
    const sortOrder = filters?.sort_order || 'asc';
    
    if (sortBy === 'alphabetical') {
      query = query.order('term_en', { ascending: sortOrder === 'asc' });
    } else if (sortBy === 'recent') {
      query = query.order('created_at', { ascending: sortOrder === 'asc' });
    } else if (sortBy === 'views') {
      query = query.order('view_count', { ascending: sortOrder === 'asc' });
    } else if (sortBy === 'favorites') {
      query = query.order('favorite_count', { ascending: sortOrder === 'asc' });
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    // Handle table doesn't exist error gracefully
    if (error) {
      const errorCode = (error as any)?.code;
      const errorMessage = (error as any)?.message || '';
      
      if (errorCode === '42P01' || errorMessage.includes('does not exist') || errorMessage.includes('relation')) {
        console.warn('Terminology tables do not exist yet. Please run migration 016_terminology_dictionary.sql');
        return [];
      }
      throw error;
    }

    if (!data) return [];

    // Load favorites if user is authenticated
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && data.length > 0) {
        const termIds = data.map(t => t.id);
        const { data: favorites } = await supabase
          .from('terminology_favorites')
          .select('term_id')
          .eq('user_id', user.id)
          .in('term_id', termIds);

        const favoriteIds = new Set(favorites?.map(f => f.term_id) || []);
        data.forEach(term => {
          (term as TerminologyTerm).is_favorited = favoriteIds.has(term.id);
        });
      }
    } catch (favError) {
      // Silently fail favorites loading - not critical
      console.warn('Could not load favorites:', favError);
    }

    return data as TerminologyTerm[];
  } catch (error) {
    console.error('Error loading terms:', error);
    // Return empty array instead of throwing to prevent React errors
    return [];
  }
};

export const searchTerms = async (query: string, filters?: Omit<SearchFilters, 'query'>): Promise<TerminologyTerm[]> => {
  return loadTerms({ ...filters, query }, 100, 0);
};

export const loadTermById = async (id: string): Promise<TerminologyTerm | null> => {
  try {
    const { data, error } = await supabase
      .from('terminology_terms')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) return null;

    // Track view
    await trackView(id);

    // Load related data
    const [relatedTerms, examples, images, comments, isFavorited] = await Promise.all([
      loadRelatedTerms(id),
      loadExamples(id),
      loadImages(id),
      loadComments(id),
      checkFavorite(id)
    ]);

    return {
      ...data,
      related_terms: relatedTerms,
      examples,
      images,
      comments,
      is_favorited: isFavorited
    } as TerminologyTerm;
  } catch (error) {
    console.error('Error loading term:', error);
    throw error;
  }
};

export const createTerm = async (termData: {
  term_en: string;
  term_bg?: string;
  latin_script?: string;
  description_en: string;
  description_bg?: string;
  acronym?: string;
  synonyms_en?: string[];
  synonyms_bg?: string[];
  category: TermCategory;
  subcategory?: string;
  difficulty_level?: DifficultyLevel;
  translation_status?: TranslationStatus;
  is_expert_verified?: boolean;
  tags?: string[];
  standard_reference?: string;
}): Promise<TerminologyTerm> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('terminology_terms')
      .insert({
        ...termData,
        created_by: user.id,
        last_modified_by: user.id,
        translation_status: termData.translation_status || 'Draft',
        difficulty_level: termData.difficulty_level || 'Basic',
        is_expert_verified: termData.is_expert_verified || false,
      })
      .select()
      .single();

    if (error) throw error;

    return data as TerminologyTerm;
  } catch (error) {
    console.error('Error creating term:', error);
    throw error;
  }
};

export const updateTerm = async (id: string, updates: Partial<Omit<TerminologyTerm, 'id' | 'created_by' | 'created_at'>>): Promise<TerminologyTerm> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('terminology_terms')
      .update({
        ...updates,
        last_modified_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return data as TerminologyTerm;
  } catch (error) {
    console.error('Error updating term:', error);
    throw error;
  }
};

export const deleteTerm = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('terminology_terms')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting term:', error);
    throw error;
  }
};

export const bulkUpdateTerms = async (ids: string[], updates: Partial<TerminologyTerm>): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('terminology_terms')
      .update({
        ...updates,
        last_modified_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .in('id', ids);

    if (error) throw error;
  } catch (error) {
    console.error('Error bulk updating terms:', error);
    throw error;
  }
};

// ============================================
// RELATED TERMS
// ============================================

export const loadRelatedTerms = async (termId: string): Promise<TermRelation[]> => {
  try {
    const { data, error } = await supabase
      .from('terminology_relations')
      .select(`
        *,
        related_term:terminology_terms!terminology_relations_related_term_id_fkey(*)
      `)
      .eq('term_id', termId);

    if (error) throw error;

    return (data || []).map((rel: any) => ({
      id: rel.id,
      term_id: rel.term_id,
      related_term_id: rel.related_term_id,
      relation_type: rel.relation_type,
      description: rel.description,
      related_term: rel.related_term
    })) as TermRelation[];
  } catch (error) {
    console.error('Error loading related terms:', error);
    return [];
  }
};

export const addRelatedTerm = async (termId: string, relatedTermId: string, relationType: RelationType, description?: string): Promise<TermRelation> => {
  try {
    const { data, error } = await supabase
      .from('terminology_relations')
      .insert({
        term_id: termId,
        related_term_id: relatedTermId,
        relation_type: relationType,
        description: description || null,
      })
      .select()
      .single();

    if (error) throw error;

    return data as TermRelation;
  } catch (error) {
    console.error('Error adding related term:', error);
    throw error;
  }
};

export const removeRelatedTerm = async (relationId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('terminology_relations')
      .delete()
      .eq('id', relationId);

    if (error) throw error;
  } catch (error) {
    console.error('Error removing related term:', error);
    throw error;
  }
};

// ============================================
// EXAMPLES
// ============================================

export const loadExamples = async (termId: string): Promise<TermExample[]> => {
  try {
    const { data, error } = await supabase
      .from('terminology_examples')
      .select(`
        *,
        user:users!terminology_examples_created_by_fkey(name)
      `)
      .eq('term_id', termId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((ex: any) => ({
      id: ex.id,
      term_id: ex.term_id,
      example_en: ex.example_en,
      example_bg: ex.example_bg,
      context: ex.context,
      created_by: ex.created_by,
      created_at: ex.created_at,
      user_name: ex.user?.name
    })) as TermExample[];
  } catch (error) {
    console.error('Error loading examples:', error);
    return [];
  }
};

export const addExample = async (termId: string, example: {
  example_en: string;
  example_bg?: string;
  context?: string;
}): Promise<TermExample> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('terminology_examples')
      .insert({
        term_id: termId,
        ...example,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return data as TermExample;
  } catch (error) {
    console.error('Error adding example:', error);
    throw error;
  }
};

export const updateExample = async (exampleId: string, updates: Partial<TermExample>): Promise<TermExample> => {
  try {
    const { data, error } = await supabase
      .from('terminology_examples')
      .update(updates)
      .eq('id', exampleId)
      .select()
      .single();

    if (error) throw error;

    return data as TermExample;
  } catch (error) {
    console.error('Error updating example:', error);
    throw error;
  }
};

export const deleteExample = async (exampleId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('terminology_examples')
      .delete()
      .eq('id', exampleId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting example:', error);
    throw error;
  }
};

// ============================================
// IMAGES
// ============================================

export const loadImages = async (termId: string): Promise<TermImage[]> => {
  try {
    const { data, error } = await supabase
      .from('terminology_images')
      .select('*')
      .eq('term_id', termId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;

    return (data || []) as TermImage[];
  } catch (error) {
    console.error('Error loading images:', error);
    return [];
  }
};

export const addImage = async (termId: string, image: {
  image_url: string;
  caption_en?: string;
  caption_bg?: string;
  alt_text: string;
}): Promise<TermImage> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('terminology_images')
      .insert({
        term_id: termId,
        ...image,
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return data as TermImage;
  } catch (error) {
    console.error('Error adding image:', error);
    throw error;
  }
};

export const deleteImage = async (imageId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('terminology_images')
      .delete()
      .eq('id', imageId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

// ============================================
// COMMENTS
// ============================================

export const loadComments = async (termId: string): Promise<TermComment[]> => {
  try {
    const { data, error } = await supabase
      .from('terminology_comments')
      .select(`
        *,
        user:users!terminology_comments_user_id_fkey(id, name, image)
      `)
      .eq('term_id', termId)
      .is('parent_id', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const comments = (data || []).map((c: any) => ({
      id: c.id,
      term_id: c.term_id,
      user_id: c.user_id,
      comment: c.comment,
      parent_id: c.parent_id,
      created_at: c.created_at,
      updated_at: c.updated_at,
      user_name: c.user?.name,
      user_avatar: c.user?.image
    })) as TermComment[];

    // Load replies for each comment
    for (const comment of comments) {
      const { data: replies } = await supabase
        .from('terminology_comments')
        .select(`
          *,
          user:users!terminology_comments_user_id_fkey(id, name, image)
        `)
        .eq('parent_id', comment.id)
        .order('created_at', { ascending: true });

      comment.replies = (replies || []).map((r: any) => ({
        id: r.id,
        term_id: r.term_id,
        user_id: r.user_id,
        comment: r.comment,
        parent_id: r.parent_id,
        created_at: r.created_at,
        updated_at: r.updated_at,
        user_name: r.user?.name,
        user_avatar: r.user?.image
      })) as TermComment[];
    }

    return comments;
  } catch (error) {
    console.error('Error loading comments:', error);
    return [];
  }
};

export const addComment = async (termId: string, comment: string, parentId?: string): Promise<TermComment> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('terminology_comments')
      .insert({
        term_id: termId,
        user_id: user.id,
        comment,
        parent_id: parentId || null,
      })
      .select(`
        *,
        user:users!terminology_comments_user_id_fkey(id, name, image)
      `)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      term_id: data.term_id,
      user_id: data.user_id,
      comment: data.comment,
      parent_id: data.parent_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
      user_name: data.user?.name,
      user_avatar: data.user?.image
    } as TermComment;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

export const deleteComment = async (commentId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('terminology_comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

// ============================================
// FAVORITES
// ============================================

export const toggleFavorite = async (termId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: existing } = await supabase
      .from('terminology_favorites')
      .select('id')
      .eq('term_id', termId)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      // Remove favorite
      const { error } = await supabase
        .from('terminology_favorites')
        .delete()
        .eq('id', existing.id);

      if (error) throw error;
      return false;
    } else {
      // Add favorite
      const { error } = await supabase
        .from('terminology_favorites')
        .insert({
          term_id: termId,
          user_id: user.id,
        });

      if (error) throw error;
      return true;
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    throw error;
  }
};

export const checkFavorite = async (termId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from('terminology_favorites')
      .select('id')
      .eq('term_id', termId)
      .eq('user_id', user.id)
      .single();

    return !!data;
  } catch {
    return false;
  }
};

export const loadFavorites = async (): Promise<TerminologyTerm[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: favorites, error: favError } = await supabase
      .from('terminology_favorites')
      .select('term_id')
      .eq('user_id', user.id);

    // Handle table doesn't exist
    if (favError) {
      const errorCode = (favError as any)?.code;
      const errorMessage = (favError as any)?.message || '';
      if (errorCode === '42P01' || errorMessage.includes('does not exist') || errorMessage.includes('relation')) {
        return [];
      }
    }

    if (!favorites || favorites.length === 0) return [];

    const termIds = favorites.map(f => f.term_id);
    const { data: terms, error } = await supabase
      .from('terminology_terms')
      .select('*')
      .in('id', termIds);

    if (error) {
      const errorCode = (error as any)?.code;
      const errorMessage = (error as any)?.message || '';
      if (errorCode === '42P01' || errorMessage.includes('does not exist') || errorMessage.includes('relation')) {
        return [];
      }
      throw error;
    }

    return (terms || []).map(t => ({ ...t, is_favorited: true })) as TerminologyTerm[];
  } catch (error) {
    console.error('Error loading favorites:', error);
    return [];
  }
};

// ============================================
// ANALYTICS
// ============================================

export const trackView = async (termId: string): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    // Update view count
    await supabase.rpc('increment', {
      table_name: 'terminology_terms',
      column_name: 'view_count',
      row_id: termId
    }).catch(() => {
      // Fallback if RPC doesn't exist
      supabase
        .from('terminology_terms')
        .select('view_count')
        .eq('id', termId)
        .single()
        .then(({ data }) => {
          if (data) {
            supabase
              .from('terminology_terms')
              .update({ view_count: (data.view_count || 0) + 1 })
              .eq('id', termId);
          }
        });
    });

    // Track analytics event
    await supabase
      .from('terminology_analytics')
      .insert({
        term_id: termId,
        user_id: user?.id || null,
        action_type: 'view',
      });
  } catch (error) {
    console.error('Error tracking view:', error);
  }
};

export const trackSearch = async (query: string, resultCount: number): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    await supabase
      .from('terminology_analytics')
      .insert({
        user_id: user?.id || null,
        action_type: 'search',
        metadata: { query, result_count: resultCount },
      });
  } catch (error) {
    console.error('Error tracking search:', error);
  }
};

export const trackExport = async (format: string, termCount: number): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    await supabase
      .from('terminology_analytics')
      .insert({
        user_id: user?.id || null,
        action_type: 'export',
        metadata: { format, term_count: termCount },
      });
  } catch (error) {
    console.error('Error tracking export:', error);
  }
};

export const getPopularTerms = async (limit = 10): Promise<TerminologyTerm[]> => {
  try {
    const { data, error } = await supabase
      .from('terminology_terms')
      .select('*')
      .order('view_count', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []) as TerminologyTerm[];
  } catch (error) {
    console.error('Error getting popular terms:', error);
    return [];
  }
};

// ============================================
// HISTORY
// ============================================

export const loadHistory = async (termId: string): Promise<TermHistory[]> => {
  try {
    const { data, error } = await supabase
      .from('terminology_history')
      .select(`
        *,
        user:users!terminology_history_changed_by_fkey(name)
      `)
      .eq('term_id', termId)
      .order('changed_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((h: any) => ({
      id: h.id,
      term_id: h.term_id,
      field_changed: h.field_changed,
      old_value: h.old_value,
      new_value: h.new_value,
      changed_by: h.changed_by,
      changed_at: h.changed_at,
      user_name: h.user?.name
    })) as TermHistory[];
  } catch (error) {
    console.error('Error loading history:', error);
    return [];
  }
};

// ============================================
// SUGGESTIONS
// ============================================

export const submitSuggestion = async (suggestion: {
  term_en: string;
  term_bg?: string;
  description_en: string;
  description_bg?: string;
  category: TermCategory;
}): Promise<TerminologySuggestion> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get user name
    const { data: userData } = await supabase
      .from('users')
      .select('name')
      .eq('id', user.id)
      .single();

    const { data, error } = await supabase
      .from('terminology_suggestions')
      .insert({
        ...suggestion,
        suggested_by_name: userData?.name || 'Anonymous',
        suggested_by: user.id,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return data as TerminologySuggestion;
  } catch (error) {
    console.error('Error submitting suggestion:', error);
    throw error;
  }
};

export const loadSuggestions = async (status?: SuggestionStatus): Promise<TerminologySuggestion[]> => {
  try {
    let query = supabase
      .from('terminology_suggestions')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []) as TerminologySuggestion[];
  } catch (error) {
    console.error('Error loading suggestions:', error);
    return [];
  }
};

export const approveSuggestion = async (suggestionId: string): Promise<TerminologyTerm> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get suggestion
    const { data: suggestion, error: suggestionError } = await supabase
      .from('terminology_suggestions')
      .select('*')
      .eq('id', suggestionId)
      .single();

    if (suggestionError) throw suggestionError;

    // Create term from suggestion
    const term = await createTerm({
      term_en: suggestion.term_en,
      term_bg: suggestion.term_bg || null,
      description_en: suggestion.description_en,
      description_bg: suggestion.description_bg || null,
      category: suggestion.category,
      translation_status: 'Approved',
    });

    // Update suggestion status
    await supabase
      .from('terminology_suggestions')
      .update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', suggestionId);

    return term;
  } catch (error) {
    console.error('Error approving suggestion:', error);
    throw error;
  }
};

export const rejectSuggestion = async (suggestionId: string, notes: string): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('terminology_suggestions')
      .update({
        status: 'rejected',
        admin_notes: notes,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', suggestionId);

    if (error) throw error;
  } catch (error) {
    console.error('Error rejecting suggestion:', error);
    throw error;
  }
};

// ============================================
// STATISTICS
// ============================================

export const getStatistics = async (): Promise<TerminologyStats> => {
  try {
    const { data: terms, error: termsError } = await supabase
      .from('terminology_terms')
      .select('category, translation_status, difficulty_level, is_expert_verified, term_bg');

    // Handle table doesn't exist
    if (termsError) {
      const errorCode = (termsError as any)?.code;
      const errorMessage = (termsError as any)?.message || '';
      if (errorCode === '42P01' || errorMessage.includes('does not exist') || errorMessage.includes('relation')) {
        return {
          total_terms: 0,
          translation_progress: 0,
          terms_by_category: {} as Record<TermCategory, number>,
          terms_by_status: {} as Record<TranslationStatus, number>,
          terms_by_difficulty: {} as Record<DifficultyLevel, number>,
          expert_verified_count: 0,
          pending_suggestions: 0,
          total_favorites: 0,
          total_views: 0,
        };
      }
      throw termsError;
    }

    const { data: suggestions, error: suggestionsError } = await supabase
      .from('terminology_suggestions')
      .select('status')
      .eq('status', 'pending');

    // Ignore suggestions error if table doesn't exist
    if (suggestionsError) {
      console.warn('Could not load suggestions:', suggestionsError);
    }

    if (!terms || terms.length === 0) {
      return {
        total_terms: 0,
        translation_progress: 0,
        terms_by_category: {} as Record<TermCategory, number>,
        terms_by_status: {} as Record<TranslationStatus, number>,
        terms_by_difficulty: {} as Record<DifficultyLevel, number>,
        expert_verified_count: 0,
        pending_suggestions: suggestions?.length || 0,
        total_favorites: 0,
        total_views: 0,
      };
    }

    const total = terms.length;
    const withBg = terms.filter(t => t.term_bg).length;
    const translationProgress = total > 0 ? Math.round((withBg / total) * 100) : 0;

    const categoryCount: Record<string, number> = {};
    const statusCount: Record<string, number> = {};
    const difficultyCount: Record<string, number> = {};

    terms.forEach(term => {
      categoryCount[term.category] = (categoryCount[term.category] || 0) + 1;
      statusCount[term.translation_status] = (statusCount[term.translation_status] || 0) + 1;
      difficultyCount[term.difficulty_level] = (difficultyCount[term.difficulty_level] || 0) + 1;
    });

    let totalFavorites = 0;
    try {
      const { data: favoritesData } = await supabase
        .from('terminology_favorites')
        .select('id', { count: 'exact', head: true });
      totalFavorites = favoritesData?.length || 0;
    } catch (favError) {
      // Ignore if table doesn't exist
      console.warn('Could not load favorites count:', favError);
    }

    let totalViews = 0;
    try {
      const { data: viewsData } = await supabase
        .from('terminology_terms')
        .select('view_count');
      totalViews = viewsData?.reduce((sum, t) => sum + (t.view_count || 0), 0) || 0;
    } catch (viewsError) {
      // Ignore if query fails
      console.warn('Could not load views count:', viewsError);
    }

    return {
      total_terms: total,
      translation_progress: translationProgress,
      terms_by_category: categoryCount as Record<TermCategory, number>,
      terms_by_status: statusCount as Record<TranslationStatus, number>,
      terms_by_difficulty: difficultyCount as Record<DifficultyLevel, number>,
      expert_verified_count: terms.filter(t => t.is_expert_verified).length,
      pending_suggestions: suggestions?.length || 0,
      total_favorites: totalFavorites,
      total_views: totalViews,
    };
  } catch (error) {
    console.error('Error getting statistics:', error);
    // Return safe default instead of throwing
    return {
      total_terms: 0,
      translation_progress: 0,
      terms_by_category: {} as Record<TermCategory, number>,
      terms_by_status: {} as Record<TranslationStatus, number>,
      terms_by_difficulty: {} as Record<DifficultyLevel, number>,
      expert_verified_count: 0,
      pending_suggestions: 0,
      total_favorites: 0,
      total_views: 0,
    };
  }
};

// ============================================
// IMPORT/EXPORT HELPERS
// ============================================

export const validateImportData = (data: any[]): { valid: any[]; errors: string[] } => {
  const valid: any[] = [];
  const errors: string[] = [];

  data.forEach((row, index) => {
    const rowNum = index + 2; // +2 for header and 1-based indexing

    if (!row.term_en || !row.description_en) {
      errors.push(`Row ${rowNum}: Missing required fields (term_en, description_en)`);
      return;
    }

    const validCategories: TermCategory[] = ['Materials', 'Processes', 'Equipment', 'Software', 'Quality_Control', 'Post_Processing', 'Design', 'Standards', 'General'];
    if (row.category && !validCategories.includes(row.category)) {
      errors.push(`Row ${rowNum}: Invalid category "${row.category}"`);
      return;
    }

    valid.push(row);
  });

  return { valid, errors };
};
