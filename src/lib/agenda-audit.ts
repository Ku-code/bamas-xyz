import { supabase } from './supabase';

export type AuditActionType =
  | 'proposal_submitted'
  | 'proposal_approved'
  | 'proposal_rejected'
  | 'agenda_created'
  | 'agenda_adopted'
  | 'agenda_locked'
  | 'agenda_versioned'
  | 'item_added'
  | 'item_updated'
  | 'item_status_changed'
  | 'item_completed'
  | 'item_deferred'
  | 'comment_added'
  | 'minutes_created'
  | 'minutes_updated'
  | 'minutes_approved'
  | 'vote_recorded'
  | 'poll_linked'
  | 'poll_unlinked'
  | 'meeting_started'
  | 'meeting_completed'
  | 'meeting_cancelled'
  | 'other';

export interface AgendaAuditLog {
  id: string;
  meeting_id?: string;
  agenda_id?: string;
  agenda_item_id?: string;
  action_type: AuditActionType;
  action_description: string;
  performed_by: string;
  old_value?: any;
  new_value?: any;
  created_at: string;
}

/**
 * Log an agenda action to the audit trail
 */
export const logAgendaAction = async (
  actionData: {
    meeting_id?: string;
    agenda_id?: string;
    agenda_item_id?: string;
    action_type: AuditActionType;
    action_description: string;
    performed_by: string;
    old_value?: any;
    new_value?: any;
  }
): Promise<AgendaAuditLog> => {
  try {
    const { data, error } = await supabase
      .from('agenda_audit_log')
      .insert({
        meeting_id: actionData.meeting_id || null,
        agenda_id: actionData.agenda_id || null,
        agenda_item_id: actionData.agenda_item_id || null,
        action_type: actionData.action_type,
        action_description: actionData.action_description,
        performed_by: actionData.performed_by,
        old_value: actionData.old_value || null,
        new_value: actionData.new_value || null,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      meeting_id: data.meeting_id || undefined,
      agenda_id: data.agenda_id || undefined,
      agenda_item_id: data.agenda_item_id || undefined,
      action_type: data.action_type,
      action_description: data.action_description,
      performed_by: data.performed_by,
      old_value: data.old_value,
      new_value: data.new_value,
      created_at: data.created_at,
    };
  } catch (error) {
    console.error('Error logging agenda action:', error);
    // Don't throw - audit logging should not break the main flow
    // Return a minimal log entry
    return {
      id: '',
      action_type: 'other',
      action_description: 'Failed to log action',
      performed_by: actionData.performed_by,
      created_at: new Date().toISOString(),
    };
  }
};

/**
 * Load audit trail with optional filters
 */
export const loadAuditTrail = async (filters?: {
  meeting_id?: string;
  agenda_id?: string;
  agenda_item_id?: string;
  action_type?: AuditActionType;
  performed_by?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}): Promise<AgendaAuditLog[]> => {
  try {
    let query = supabase
      .from('agenda_audit_log')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.meeting_id) {
      query = query.eq('meeting_id', filters.meeting_id);
    }

    if (filters?.agenda_id) {
      query = query.eq('agenda_id', filters.agenda_id);
    }

    if (filters?.agenda_item_id) {
      query = query.eq('agenda_item_id', filters.agenda_item_id);
    }

    if (filters?.action_type) {
      query = query.eq('action_type', filters.action_type);
    }

    if (filters?.performed_by) {
      query = query.eq('performed_by', filters.performed_by);
    }

    if (filters?.start_date) {
      query = query.gte('created_at', filters.start_date);
    }

    if (filters?.end_date) {
      query = query.lte('created_at', filters.end_date);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    if (!data) return [];

    return data.map((log: any) => ({
      id: log.id,
      meeting_id: log.meeting_id || undefined,
      agenda_id: log.agenda_id || undefined,
      agenda_item_id: log.agenda_item_id || undefined,
      action_type: log.action_type,
      action_description: log.action_description,
      performed_by: log.performed_by,
      old_value: log.old_value,
      new_value: log.new_value,
      created_at: log.created_at,
    }));
  } catch (error) {
    console.error('Error loading audit trail:', error);
    throw error;
  }
};

/**
 * Export audit log as structured data
 */
export const exportAuditLog = async (filters?: {
  meeting_id?: string;
  agenda_id?: string;
  start_date?: string;
  end_date?: string;
}): Promise<{
  metadata: {
    export_date: string;
    filters: any;
    total_entries: number;
  };
  entries: AgendaAuditLog[];
}> => {
  try {
    const entries = await loadAuditTrail(filters);

    return {
      metadata: {
        export_date: new Date().toISOString(),
        filters: filters || {},
        total_entries: entries.length,
      },
      entries,
    };
  } catch (error) {
    console.error('Error exporting audit log:', error);
    throw error;
  }
};

/**
 * Get audit summary for a meeting
 */
export const getAuditSummary = async (meetingId: string): Promise<{
  total_actions: number;
  actions_by_type: Record<string, number>;
  actions_by_user: Record<string, number>;
  first_action?: string;
  last_action?: string;
}> => {
  try {
    const logs = await loadAuditTrail({ meeting_id: meetingId });

    const actionsByType: Record<string, number> = {};
    const actionsByUser: Record<string, number> = {};

    logs.forEach(log => {
      actionsByType[log.action_type] = (actionsByType[log.action_type] || 0) + 1;
      actionsByUser[log.performed_by] = (actionsByUser[log.performed_by] || 0) + 1;
    });

    const sortedByDate = [...logs].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    return {
      total_actions: logs.length,
      actions_by_type: actionsByType,
      actions_by_user: actionsByUser,
      first_action: sortedByDate[0]?.created_at,
      last_action: sortedByDate[sortedByDate.length - 1]?.created_at,
    };
  } catch (error) {
    console.error('Error getting audit summary:', error);
    throw error;
  }
};

