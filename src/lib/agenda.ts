import { supabase } from './supabase';

export interface Comment {
  id: string;
  agenda_id: string;
  user_id: string;
  user_name: string;
  user_image?: string;
  text: string;
  created_at: string;
  parent_comment_id?: string; // For threaded discussions
}

export type AgendaItemStatus = 'proposed' | 'approved' | 'in_discussion' | 'completed' | 'deferred';

export interface AgendaItem {
  id: string;
  meeting_id?: string;
  agenda_id?: string;
  parent_item_id?: string; // For sub-items
  title: string;
  description: string;
  date: string;
  time: string;
  location?: string;
  order_index: number;
  status: AgendaItemStatus;
  created_by: string;
  created_by_name: string;
  created_by_image?: string;
  created_at: string;
  updated_at?: string;
  proposed_by?: string;
  proposed_at?: string;
  approved_by?: string;
  approved_at?: string;
  discussion_notes?: any; // JSONB
  minutes?: string;
  comments: Comment[];
  sub_items?: AgendaItem[]; // Nested sub-items
}

/**
 * Load all agenda items with their comments and sub-items
 */
export const loadAgendaItems = async (filters?: {
  meeting_id?: string;
  agenda_id?: string;
  parent_item_id?: string | null; // null for top-level only
  status?: AgendaItemStatus;
}): Promise<AgendaItem[]> => {
  try {
    let query = supabase
      .from('agenda_items')
      .select('*');

    if (filters?.meeting_id) {
      query = query.eq('meeting_id', filters.meeting_id);
    }

    if (filters?.agenda_id) {
      query = query.eq('agenda_id', filters.agenda_id);
    }

    if (filters?.parent_item_id !== undefined) {
      if (filters.parent_item_id === null) {
        query = query.is('parent_item_id', null);
      } else {
        query = query.eq('parent_item_id', filters.parent_item_id);
      }
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    query = query.order('order_index', { ascending: true })
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    const { data: agendaData, error: agendaError } = await query;

    if (agendaError) throw agendaError;
    if (!agendaData) return [];

    // Load all comments
    const { data: commentsData, error: commentsError } = await supabase
      .from('agenda_comments')
      .select('*')
      .order('created_at', { ascending: true });

    if (commentsError) throw commentsError;

    // Group comments by agenda_id
    const commentsByAgenda: Record<string, Comment[]> = {};
    commentsData?.forEach((comment: any) => {
      if (!commentsByAgenda[comment.agenda_id]) {
        commentsByAgenda[comment.agenda_id] = [];
      }
      commentsByAgenda[comment.agenda_id].push({
        id: comment.id,
        agenda_id: comment.agenda_id,
        user_id: comment.user_id,
        user_name: comment.user_name,
        user_image: comment.user_image || undefined,
        text: comment.text,
        created_at: comment.created_at,
        parent_comment_id: comment.parent_comment_id || undefined,
      });
    });

    // Combine agenda items with comments
    const agendaItems: AgendaItem[] = agendaData.map((item: any) => ({
      id: item.id,
      meeting_id: item.meeting_id || undefined,
      agenda_id: item.agenda_id || undefined,
      parent_item_id: item.parent_item_id || undefined,
      title: item.title,
      description: item.description,
      date: item.date,
      time: item.time,
      location: item.location || undefined,
      order_index: item.order_index || 0,
      status: item.status || 'approved',
      created_by: item.created_by,
      created_by_name: item.created_by_name,
      created_by_image: item.created_by_image || undefined,
      created_at: item.created_at,
      updated_at: item.updated_at || undefined,
      proposed_by: item.proposed_by || undefined,
      proposed_at: item.proposed_at || undefined,
      approved_by: item.approved_by || undefined,
      approved_at: item.approved_at || undefined,
      discussion_notes: item.discussion_notes,
      minutes: item.minutes || undefined,
      comments: commentsByAgenda[item.id] || [],
    }));

    return agendaItems;
  } catch (error) {
    console.error('Error loading agenda items:', error);
    throw error;
  }
};

/**
 * Load agenda items with nested sub-items
 */
export const loadAgendaItemsWithSubItems = async (filters?: {
  meeting_id?: string;
  agenda_id?: string;
  status?: AgendaItemStatus;
}): Promise<AgendaItem[]> => {
  try {
    // Load all items (both top-level and sub-items)
    const allItems = await loadAgendaItems({
      ...filters,
      parent_item_id: undefined, // Get all items
    });

    // Separate top-level items and sub-items
    const topLevelItems = allItems.filter(item => !item.parent_item_id);
    const subItems = allItems.filter(item => item.parent_item_id);

    // Build a map of sub-items by parent
    const subItemsByParent: Record<string, AgendaItem[]> = {};
    subItems.forEach(subItem => {
      const parentId = subItem.parent_item_id!;
      if (!subItemsByParent[parentId]) {
        subItemsByParent[parentId] = [];
      }
      subItemsByParent[parentId].push(subItem);
    });

    // Attach sub-items to their parents
    const itemsWithSubItems = topLevelItems.map(item => ({
      ...item,
      sub_items: subItemsByParent[item.id] || [],
    }));

    return itemsWithSubItems;
  } catch (error) {
    console.error('Error loading agenda items with sub-items:', error);
    throw error;
  }
};

/**
 * Create a new agenda item
 */
export const createAgendaItem = async (
  agendaData: {
    meeting_id?: string;
    agenda_id?: string;
    parent_item_id?: string;
    title: string;
    description: string;
    date: string;
    time: string;
    location?: string;
    order_index?: number;
    status?: AgendaItemStatus;
    created_by: string;
    created_by_name: string;
    created_by_image?: string;
    proposed_by?: string;
    approved_by?: string;
  }
): Promise<AgendaItem> => {
  try {
    // Get max order_index if not provided
    let orderIndex = agendaData.order_index;
    if (orderIndex === undefined) {
      const { data: existingItems } = await supabase
        .from('agenda_items')
        .select('order_index')
        .eq('agenda_id', agendaData.agenda_id || '')
        .is('parent_item_id', agendaData.parent_item_id ? null : null)
        .order('order_index', { ascending: false })
        .limit(1);

      orderIndex = existingItems && existingItems.length > 0
        ? (existingItems[0].order_index || 0) + 1
        : 0;
    }

    const { data, error } = await supabase
      .from('agenda_items')
      .insert({
        meeting_id: agendaData.meeting_id || null,
        agenda_id: agendaData.agenda_id || null,
        parent_item_id: agendaData.parent_item_id || null,
        title: agendaData.title,
        description: agendaData.description,
        date: agendaData.date,
        time: agendaData.time,
        location: agendaData.location || null,
        order_index: orderIndex,
        status: agendaData.status || 'approved',
        created_by: agendaData.created_by,
        created_by_name: agendaData.created_by_name,
        created_by_image: agendaData.created_by_image || null,
        proposed_by: agendaData.proposed_by || null,
        proposed_at: agendaData.proposed_by ? new Date().toISOString() : null,
        approved_by: agendaData.approved_by || null,
        approved_at: agendaData.approved_by ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      meeting_id: data.meeting_id || undefined,
      agenda_id: data.agenda_id || undefined,
      parent_item_id: data.parent_item_id || undefined,
      title: data.title,
      description: data.description,
      date: data.date,
      time: data.time,
      location: data.location || undefined,
      order_index: data.order_index || 0,
      status: data.status || 'approved',
      created_by: data.created_by,
      created_by_name: data.created_by_name,
      created_by_image: data.created_by_image || undefined,
      created_at: data.created_at,
      updated_at: data.updated_at || undefined,
      proposed_by: data.proposed_by || undefined,
      proposed_at: data.proposed_at || undefined,
      approved_by: data.approved_by || undefined,
      approved_at: data.approved_at || undefined,
      discussion_notes: data.discussion_notes,
      minutes: data.minutes || undefined,
      comments: [],
    };
  } catch (error) {
    console.error('Error creating agenda item:', error);
    throw error;
  }
};

/**
 * Update an agenda item
 */
export const updateAgendaItem = async (
  agendaId: string,
  updates: {
    title?: string;
    description?: string;
    date?: string;
    time?: string;
    location?: string;
    order_index?: number;
    status?: AgendaItemStatus;
    discussion_notes?: any;
    minutes?: string;
  }
): Promise<AgendaItem> => {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.date !== undefined) updateData.date = updates.date;
    if (updates.time !== undefined) updateData.time = updates.time;
    if (updates.location !== undefined) updateData.location = updates.location || null;
    if (updates.order_index !== undefined) updateData.order_index = updates.order_index;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.discussion_notes !== undefined) updateData.discussion_notes = updates.discussion_notes;
    if (updates.minutes !== undefined) updateData.minutes = updates.minutes;

    const { data, error } = await supabase
      .from('agenda_items')
      .update(updateData)
      .eq('id', agendaId)
      .select()
      .single();

    if (error) throw error;

    // Reload to get comments and full structure
    const agendaItems = await loadAgendaItems();
    const updated = agendaItems.find((item) => item.id === agendaId);
    if (!updated) throw new Error('Agenda item not found after update');

    return updated;
  } catch (error) {
    console.error('Error updating agenda item:', error);
    throw error;
  }
};

/**
 * Update agenda item order
 */
export const updateAgendaItemOrder = async (
  itemOrders: Array<{ id: string; order_index: number }>
): Promise<void> => {
  try {
    // Update each item's order_index
    for (const itemOrder of itemOrders) {
      const { error } = await supabase
        .from('agenda_items')
        .update({ order_index: itemOrder.order_index, updated_at: new Date().toISOString() })
        .eq('id', itemOrder.id);

      if (error) throw error;
    }
  } catch (error) {
    console.error('Error updating agenda item order:', error);
    throw error;
  }
};

/**
 * Delete an agenda item (cascade will delete comments)
 */
export const deleteAgendaItem = async (agendaId: string): Promise<void> => {
  try {
    const { error } = await supabase.from('agenda_items').delete().eq('id', agendaId);
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting agenda item:', error);
    throw error;
  }
};

/**
 * Add a comment to an agenda item (supports threaded comments)
 */
export const addComment = async (
  agendaId: string,
  commentData: {
    user_id: string;
    user_name: string;
    user_image?: string;
    text: string;
    parent_comment_id?: string;
  }
): Promise<Comment> => {
  try {
    const { data, error } = await supabase
      .from('agenda_comments')
      .insert({
        agenda_id: agendaId,
        user_id: commentData.user_id,
        user_name: commentData.user_name,
        user_image: commentData.user_image || null,
        text: commentData.text,
        parent_comment_id: commentData.parent_comment_id || null,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      agenda_id: data.agenda_id,
      user_id: data.user_id,
      user_name: data.user_name,
      user_image: data.user_image || undefined,
      text: data.text,
      created_at: data.created_at,
      parent_comment_id: data.parent_comment_id || undefined,
    };
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

