import { supabase } from './supabase';

export interface Decision {
  id: string;
  description: string;
  voting_result?: {
    type: 'simple_majority' | 'qualified_majority' | 'unanimous';
    votes_for: number;
    votes_against: number;
    votes_abstain?: number;
  };
}

export interface ActionItem {
  id: string;
  description: string;
  assigned_to?: string;
  assigned_to_name?: string;
  due_date?: string;
  status?: 'pending' | 'in_progress' | 'completed';
}

export interface AssignedResponsibility {
  user_id: string;
  user_name: string;
  responsibility: string;
  due_date?: string;
}

export interface MeetingMinutes {
  id: string;
  meeting_id: string;
  agenda_item_id: string;
  discussion_summary?: string;
  decisions?: Decision[];
  action_items?: ActionItem[];
  assigned_responsibilities?: AssignedResponsibility[];
  ai_generated: boolean;
  ai_model?: string;
  created_by: string;
  created_at: string;
  approved_by?: string;
  approved_at?: string;
  updated_at?: string;
}

/**
 * Create minutes for an agenda item
 */
export const createMinutes = async (
  minutesData: {
    meeting_id: string;
    agenda_item_id: string;
    discussion_summary?: string;
    decisions?: Decision[];
    action_items?: ActionItem[];
    assigned_responsibilities?: AssignedResponsibility[];
    ai_generated?: boolean;
    ai_model?: string;
    created_by: string;
  }
): Promise<MeetingMinutes> => {
  try {
    const { data, error } = await supabase
      .from('meeting_minutes')
      .insert({
        meeting_id: minutesData.meeting_id,
        agenda_item_id: minutesData.agenda_item_id,
        discussion_summary: minutesData.discussion_summary || null,
        decisions: minutesData.decisions || null,
        action_items: minutesData.action_items || null,
        assigned_responsibilities: minutesData.assigned_responsibilities || null,
        ai_generated: minutesData.ai_generated || false,
        ai_model: minutesData.ai_model || null,
        created_by: minutesData.created_by,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      meeting_id: data.meeting_id,
      agenda_item_id: data.agenda_item_id,
      discussion_summary: data.discussion_summary || undefined,
      decisions: data.decisions || undefined,
      action_items: data.action_items || undefined,
      assigned_responsibilities: data.assigned_responsibilities || undefined,
      ai_generated: data.ai_generated,
      ai_model: data.ai_model || undefined,
      created_by: data.created_by,
      created_at: data.created_at,
      approved_by: data.approved_by || undefined,
      approved_at: data.approved_at || undefined,
      updated_at: data.updated_at || undefined,
    };
  } catch (error) {
    console.error('Error creating minutes:', error);
    throw error;
  }
};

/**
 * Update minutes
 */
export const updateMinutes = async (
  minutesId: string,
  updates: {
    discussion_summary?: string;
    decisions?: Decision[];
    action_items?: ActionItem[];
    assigned_responsibilities?: AssignedResponsibility[];
    ai_generated?: boolean;
    ai_model?: string;
  }
): Promise<MeetingMinutes> => {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.discussion_summary !== undefined) {
      updateData.discussion_summary = updates.discussion_summary || null;
    }
    if (updates.decisions !== undefined) {
      updateData.decisions = updates.decisions || null;
    }
    if (updates.action_items !== undefined) {
      updateData.action_items = updates.action_items || null;
    }
    if (updates.assigned_responsibilities !== undefined) {
      updateData.assigned_responsibilities = updates.assigned_responsibilities || null;
    }
    if (updates.ai_generated !== undefined) {
      updateData.ai_generated = updates.ai_generated;
    }
    if (updates.ai_model !== undefined) {
      updateData.ai_model = updates.ai_model || null;
    }

    const { data, error } = await supabase
      .from('meeting_minutes')
      .update(updateData)
      .eq('id', minutesId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      meeting_id: data.meeting_id,
      agenda_item_id: data.agenda_item_id,
      discussion_summary: data.discussion_summary || undefined,
      decisions: data.decisions || undefined,
      action_items: data.action_items || undefined,
      assigned_responsibilities: data.assigned_responsibilities || undefined,
      ai_generated: data.ai_generated,
      ai_model: data.ai_model || undefined,
      created_by: data.created_by,
      created_at: data.created_at,
      approved_by: data.approved_by || undefined,
      approved_at: data.approved_at || undefined,
      updated_at: data.updated_at || undefined,
    };
  } catch (error) {
    console.error('Error updating minutes:', error);
    throw error;
  }
};

/**
 * Approve minutes
 */
export const approveMinutes = async (
  minutesId: string,
  approvedBy: string
): Promise<MeetingMinutes> => {
  try {
    const { data, error } = await supabase
      .from('meeting_minutes')
      .update({
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', minutesId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      meeting_id: data.meeting_id,
      agenda_item_id: data.agenda_item_id,
      discussion_summary: data.discussion_summary || undefined,
      decisions: data.decisions || undefined,
      action_items: data.action_items || undefined,
      assigned_responsibilities: data.assigned_responsibilities || undefined,
      ai_generated: data.ai_generated,
      ai_model: data.ai_model || undefined,
      created_by: data.created_by,
      created_at: data.created_at,
      approved_by: data.approved_by || undefined,
      approved_at: data.approved_at || undefined,
      updated_at: data.updated_at || undefined,
    };
  } catch (error) {
    console.error('Error approving minutes:', error);
    throw error;
  }
};

/**
 * Load minutes by meeting ID
 */
export const loadMinutesByMeeting = async (meetingId: string): Promise<MeetingMinutes[]> => {
  try {
    const { data, error } = await supabase
      .from('meeting_minutes')
      .select('*')
      .eq('meeting_id', meetingId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!data) return [];

    return data.map((minutes: any) => ({
      id: minutes.id,
      meeting_id: minutes.meeting_id,
      agenda_item_id: minutes.agenda_item_id,
      discussion_summary: minutes.discussion_summary || undefined,
      decisions: minutes.decisions || undefined,
      action_items: minutes.action_items || undefined,
      assigned_responsibilities: minutes.assigned_responsibilities || undefined,
      ai_generated: minutes.ai_generated,
      ai_model: minutes.ai_model || undefined,
      created_by: minutes.created_by,
      created_at: minutes.created_at,
      approved_by: minutes.approved_by || undefined,
      approved_at: minutes.approved_at || undefined,
      updated_at: minutes.updated_at || undefined,
    }));
  } catch (error) {
    console.error('Error loading minutes:', error);
    throw error;
  }
};

/**
 * Load minutes by agenda item ID
 */
export const loadMinutesByAgendaItem = async (agendaItemId: string): Promise<MeetingMinutes | null> => {
  try {
    const { data, error } = await supabase
      .from('meeting_minutes')
      .select('*')
      .eq('agenda_item_id', agendaItemId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) return null;

    return {
      id: data.id,
      meeting_id: data.meeting_id,
      agenda_item_id: data.agenda_item_id,
      discussion_summary: data.discussion_summary || undefined,
      decisions: data.decisions || undefined,
      action_items: data.action_items || undefined,
      assigned_responsibilities: data.assigned_responsibilities || undefined,
      ai_generated: data.ai_generated,
      ai_model: data.ai_model || undefined,
      created_by: data.created_by,
      created_at: data.created_at,
      approved_by: data.approved_by || undefined,
      approved_at: data.approved_at || undefined,
      updated_at: data.updated_at || undefined,
    };
  } catch (error) {
    console.error('Error loading minutes:', error);
    throw error;
  }
};

/**
 * Generate a summary of all minutes for a meeting
 */
export const generateMinutesSummary = async (meetingId: string): Promise<{
  meeting_id: string;
  total_items: number;
  items_with_minutes: number;
  total_decisions: number;
  total_action_items: number;
  total_responsibilities: number;
  minutes: MeetingMinutes[];
}> => {
  try {
    const minutes = await loadMinutesByMeeting(meetingId);

    let totalDecisions = 0;
    let totalActionItems = 0;
    let totalResponsibilities = 0;

    minutes.forEach(m => {
      if (m.decisions) totalDecisions += m.decisions.length;
      if (m.action_items) totalActionItems += m.action_items.length;
      if (m.assigned_responsibilities) totalResponsibilities += m.assigned_responsibilities.length;
    });

    // Get total agenda items for the meeting
    const { data: agendaItems } = await supabase
      .from('agenda_items')
      .select('id')
      .eq('meeting_id', meetingId)
      .is('parent_item_id', null); // Only top-level items

    return {
      meeting_id: meetingId,
      total_items: agendaItems?.length || 0,
      items_with_minutes: minutes.length,
      total_decisions: totalDecisions,
      total_action_items: totalActionItems,
      total_responsibilities: totalResponsibilities,
      minutes,
    };
  } catch (error) {
    console.error('Error generating minutes summary:', error);
    throw error;
  }
};

