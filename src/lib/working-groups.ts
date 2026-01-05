import { db } from './database';
import { supabase } from './supabase';

// ============================================
// TypeScript Interfaces
// ============================================

export interface WorkingGroup {
  id: string;
  name: string;
  slug: string;
  mission_statement: string | null;
  description: string | null;
  lead_user_id: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface WGMember {
  id: string;
  working_group_id: string;
  user_id: string;
  role: 'member' | 'lead';
  specialization: string | null;
  joined_at: string;
}

export interface WGProject {
  id: string;
  working_group_id: string;
  name: string;
  description: string | null;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  priority: 'low' | 'medium' | 'high';
  created_by: string;
  created_at: string;
  updated_at: string | null;
}

export interface WGTask {
  id: string;
  project_id: string | null;
  working_group_id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  assigned_to: string | null;
  due_date: string | null;
  created_by: string;
  position: number;
  created_at: string;
  updated_at: string | null;
}

export interface WGFeedPost {
  id: string;
  working_group_id: string;
  user_id: string;
  content: string;
  attachments: any[]; // JSONB array
  tags: string[];
  created_at: string;
  updated_at: string | null;
}

export interface WGResource {
  id: string;
  working_group_id: string;
  title: string;
  description: string | null;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  category: 'CAD' | 'PDF' | 'Research' | 'Other';
  uploaded_by: string;
  approved_by: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface WGComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string | null;
}

// Extended interfaces with joined data
export interface WGMemberWithUser extends WGMember {
  user?: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

export interface WGFeedPostWithUser extends WGFeedPost {
  user?: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  comments?: WGCommentWithUser[];
}

export interface WGCommentWithUser extends WGComment {
  user?: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

export interface WGTaskWithAssignee extends WGTask {
  assigned_user?: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  created_user?: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

// ============================================
// Working Groups CRUD Functions
// ============================================

export const loadWorkingGroups = async (): Promise<WorkingGroup[]> => {
  try {
    const groups = await db.fetchAll<WorkingGroup>('working_groups');
    return groups.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error loading working groups:', error);
    throw error;
  }
};

export const getWorkingGroup = async (id: string): Promise<WorkingGroup | null> => {
  try {
    return await db.fetchById<WorkingGroup>('working_groups', id);
  } catch (error) {
    console.error('Error loading working group:', error);
    throw error;
  }
};

export const getWorkingGroupBySlug = async (slug: string): Promise<WorkingGroup | null> => {
  try {
    const groups = await db.fetchWithFilters<WorkingGroup>('working_groups', { slug });
    return groups[0] || null;
  } catch (error) {
    console.error('Error loading working group by slug:', error);
    throw error;
  }
};

// ============================================
// WG Members Functions
// ============================================

export const loadWGMembers = async (workingGroupId: string): Promise<WGMemberWithUser[]> => {
  try {
    const { data, error } = await supabase
      .from('wg_members')
      .select(`
        *,
        user:users!wg_members_user_id_fkey(id, name, email, image)
      `)
      .eq('working_group_id', workingGroupId)
      .order('joined_at', { ascending: true });

    if (error) throw error;
    return (data || []) as WGMemberWithUser[];
  } catch (error) {
    console.error('Error loading WG members:', error);
    throw error;
  }
};

export const joinWorkingGroup = async (workingGroupId: string, userId: string, specialization?: string): Promise<WGMember> => {
  try {
    const member = await db.insert<WGMember>('wg_members', {
      working_group_id: workingGroupId,
      user_id: userId,
      role: 'member',
      specialization: specialization || null,
    });
    return member;
  } catch (error) {
    console.error('Error joining working group:', error);
    throw error;
  }
};

export const leaveWorkingGroup = async (memberId: string): Promise<void> => {
  try {
    await db.delete('wg_members', memberId);
  } catch (error) {
    console.error('Error leaving working group:', error);
    throw error;
  }
};

export const updateWGMember = async (memberId: string, updates: Partial<WGMember>): Promise<WGMember> => {
  try {
    return await db.update<WGMember>('wg_members', memberId, updates);
  } catch (error) {
    console.error('Error updating WG member:', error);
    throw error;
  }
};

export const getUserWGMemberships = async (userId: string): Promise<WGMember[]> => {
  try {
    return await db.fetchWithFilters<WGMember>('wg_members', { user_id: userId });
  } catch (error) {
    console.error('Error loading user WG memberships:', error);
    throw error;
  }
};

// ============================================
// WG Projects Functions
// ============================================

export const loadWGProjects = async (workingGroupId: string): Promise<WGProject[]> => {
  try {
    return await db.fetchWithFilters<WGProject>('wg_projects', { working_group_id: workingGroupId }, { column: 'created_at', ascending: false });
  } catch (error) {
    console.error('Error loading WG projects:', error);
    throw error;
  }
};

export const createWGProject = async (project: Omit<WGProject, 'id' | 'created_at' | 'updated_at'>): Promise<WGProject> => {
  try {
    return await db.insert<WGProject>('wg_projects', project);
  } catch (error) {
    console.error('Error creating WG project:', error);
    throw error;
  }
};

export const updateWGProject = async (projectId: string, updates: Partial<WGProject>): Promise<WGProject> => {
  try {
    return await db.update<WGProject>('wg_projects', projectId, updates);
  } catch (error) {
    console.error('Error updating WG project:', error);
    throw error;
  }
};

export const deleteWGProject = async (projectId: string): Promise<void> => {
  try {
    await db.delete('wg_projects', projectId);
  } catch (error) {
    console.error('Error deleting WG project:', error);
    throw error;
  }
};

// ============================================
// WG Tasks Functions
// ============================================

export const loadWGTasks = async (workingGroupId: string, projectId?: string): Promise<WGTaskWithAssignee[]> => {
  try {
    const filters: any = { working_group_id: workingGroupId };
    if (projectId) {
      filters.project_id = projectId;
    }

    const { data, error } = await supabase
      .from('wg_tasks')
      .select(`
        *,
        assigned_user:users!wg_tasks_assigned_to_fkey(id, name, email, image),
        created_user:users!wg_tasks_created_by_fkey(id, name, email, image)
      `)
      .eq('working_group_id', workingGroupId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as WGTaskWithAssignee[];
  } catch (error) {
    console.error('Error loading WG tasks:', error);
    throw error;
  }
};

export const createWGTask = async (task: Omit<WGTask, 'id' | 'created_at' | 'updated_at'>): Promise<WGTask> => {
  try {
    // Get max position for the status column
    const existingTasks = await db.fetchWithFilters<WGTask>('wg_tasks', {
      working_group_id: task.working_group_id,
      status: task.status,
    });
    const maxPosition = existingTasks.length > 0
      ? Math.max(...existingTasks.map(t => t.position))
      : -1;
    
    const taskWithPosition = {
      ...task,
      position: maxPosition + 1,
    };
    
    return await db.insert<WGTask>('wg_tasks', taskWithPosition);
  } catch (error) {
    console.error('Error creating WG task:', error);
    throw error;
  }
};

export const updateWGTask = async (taskId: string, updates: Partial<WGTask>): Promise<WGTask> => {
  try {
    return await db.update<WGTask>('wg_tasks', taskId, updates);
  } catch (error) {
    console.error('Error updating WG task:', error);
    throw error;
  }
};

export const deleteWGTask = async (taskId: string): Promise<void> => {
  try {
    await db.delete('wg_tasks', taskId);
  } catch (error) {
    console.error('Error deleting WG task:', error);
    throw error;
  }
};

// ============================================
// WG Feed Posts Functions
// ============================================

export const loadWGFeedPosts = async (workingGroupId: string): Promise<WGFeedPostWithUser[]> => {
  try {
    const { data, error } = await supabase
      .from('wg_feed_posts')
      .select(`
        *,
        user:users!wg_feed_posts_user_id_fkey(id, name, email, image),
        comments:wg_comments(
          *,
          user:users!wg_comments_user_id_fkey(id, name, email, image)
        )
      `)
      .eq('working_group_id', workingGroupId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as WGFeedPostWithUser[];
  } catch (error) {
    console.error('Error loading WG feed posts:', error);
    throw error;
  }
};

export const createWGFeedPost = async (post: Omit<WGFeedPost, 'id' | 'created_at' | 'updated_at'>): Promise<WGFeedPost> => {
  try {
    return await db.insert<WGFeedPost>('wg_feed_posts', post);
  } catch (error) {
    console.error('Error creating WG feed post:', error);
    throw error;
  }
};

export const updateWGFeedPost = async (postId: string, updates: Partial<WGFeedPost>): Promise<WGFeedPost> => {
  try {
    return await db.update<WGFeedPost>('wg_feed_posts', postId, updates);
  } catch (error) {
    console.error('Error updating WG feed post:', error);
    throw error;
  }
};

export const deleteWGFeedPost = async (postId: string): Promise<void> => {
  try {
    await db.delete('wg_feed_posts', postId);
  } catch (error) {
    console.error('Error deleting WG feed post:', error);
    throw error;
  }
};

// ============================================
// WG Comments Functions
// ============================================

export const createWGComment = async (comment: Omit<WGComment, 'id' | 'created_at' | 'updated_at'>): Promise<WGComment> => {
  try {
    return await db.insert<WGComment>('wg_comments', comment);
  } catch (error) {
    console.error('Error creating WG comment:', error);
    throw error;
  }
};

export const updateWGComment = async (commentId: string, updates: Partial<WGComment>): Promise<WGComment> => {
  try {
    return await db.update<WGComment>('wg_comments', commentId, updates);
  } catch (error) {
    console.error('Error updating WG comment:', error);
    throw error;
  }
};

export const deleteWGComment = async (commentId: string): Promise<void> => {
  try {
    await db.delete('wg_comments', commentId);
  } catch (error) {
    console.error('Error deleting WG comment:', error);
    throw error;
  }
};

// ============================================
// WG Resources Functions
// ============================================

export const loadWGResources = async (workingGroupId: string): Promise<WGResource[]> => {
  try {
    return await db.fetchWithFilters<WGResource>('wg_resources', { working_group_id: workingGroupId }, { column: 'created_at', ascending: false });
  } catch (error) {
    console.error('Error loading WG resources:', error);
    throw error;
  }
};

export const createWGResource = async (resource: Omit<WGResource, 'id' | 'created_at' | 'updated_at'>): Promise<WGResource> => {
  try {
    return await db.insert<WGResource>('wg_resources', resource);
  } catch (error) {
    console.error('Error creating WG resource:', error);
    throw error;
  }
};

export const updateWGResource = async (resourceId: string, updates: Partial<WGResource>): Promise<WGResource> => {
  try {
    return await db.update<WGResource>('wg_resources', resourceId, updates);
  } catch (error) {
    console.error('Error updating WG resource:', error);
    throw error;
  }
};

export const deleteWGResource = async (resourceId: string): Promise<void> => {
  try {
    await db.delete('wg_resources', resourceId);
  } catch (error) {
    console.error('Error deleting WG resource:', error);
    throw error;
  }
};

export const approveWGResource = async (resourceId: string, approvedBy: string): Promise<WGResource> => {
  try {
    return await db.update<WGResource>('wg_resources', resourceId, {
      is_approved: true,
      approved_by: approvedBy,
    });
  } catch (error) {
    console.error('Error approving WG resource:', error);
    throw error;
  }
};

