import { supabase } from './supabase';

export type AgendaStatus = 'draft' | 'proposed' | 'adopted' | 'locked';

export interface Agenda {
  id: string;
  meeting_id: string;
  version: number;
  rules?: any; // JSONB - procedural framework
  status: AgendaStatus;
  adopted_at?: string;
  adopted_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface AgendaRules {
  quorum?: {
    required: number;
    description?: string;
  };
  voting_rules?: {
    simple_majority?: boolean;
    qualified_majority?: {
      percentage: number;
      description?: string;
    };
    unanimous?: boolean;
  };
  discussion_time_limits?: {
    per_item?: number; // minutes
    per_sub_item?: number; // minutes
  };
  other_rules?: string[];
}

/**
 * Create an agenda for a meeting
 */
export const createAgenda = async (
  meetingId: string,
  rules?: AgendaRules
): Promise<Agenda> => {
  try {
    // Get next version number
    const { data: existingAgendas } = await supabase
      .from('agendas')
      .select('version')
      .eq('meeting_id', meetingId)
      .order('version', { ascending: false })
      .limit(1);

    const nextVersion = existingAgendas && existingAgendas.length > 0
      ? existingAgendas[0].version + 1
      : 1;

    const { data, error } = await supabase
      .from('agendas')
      .insert({
        meeting_id: meetingId,
        version: nextVersion,
        rules: rules || null,
        status: 'draft',
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      meeting_id: data.meeting_id,
      version: data.version,
      rules: data.rules,
      status: data.status,
      adopted_at: data.adopted_at || undefined,
      adopted_by: data.adopted_by || undefined,
      created_at: data.created_at,
      updated_at: data.updated_at || undefined,
    };
  } catch (error) {
    console.error('Error creating agenda:', error);
    throw error;
  }
};

/**
 * Load agenda by meeting ID (gets latest version)
 */
export const loadAgendaByMeeting = async (meetingId: string): Promise<Agenda | null> => {
  try {
    const { data, error } = await supabase
      .from('agendas')
      .select('*')
      .eq('meeting_id', meetingId)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" - acceptable if no agenda yet
      throw error;
    }

    if (!data) return null;

    return {
      id: data.id,
      meeting_id: data.meeting_id,
      version: data.version,
      rules: data.rules,
      status: data.status,
      adopted_at: data.adopted_at || undefined,
      adopted_by: data.adopted_by || undefined,
      created_at: data.created_at,
      updated_at: data.updated_at || undefined,
    };
  } catch (error) {
    console.error('Error loading agenda:', error);
    throw error;
  }
};

/**
 * Load all agenda versions for a meeting
 */
export const loadAgendaVersions = async (meetingId: string): Promise<Agenda[]> => {
  try {
    const { data, error } = await supabase
      .from('agendas')
      .select('*')
      .eq('meeting_id', meetingId)
      .order('version', { ascending: false });

    if (error) throw error;
    if (!data) return [];

    return data.map((agenda: any) => ({
      id: agenda.id,
      meeting_id: agenda.meeting_id,
      version: agenda.version,
      rules: agenda.rules,
      status: agenda.status,
      adopted_at: agenda.adopted_at || undefined,
      adopted_by: agenda.adopted_by || undefined,
      created_at: agenda.created_at,
      updated_at: agenda.updated_at || undefined,
    }));
  } catch (error) {
    console.error('Error loading agenda versions:', error);
    throw error;
  }
};

/**
 * Adopt an agenda (formal adoption process)
 */
export const adoptAgenda = async (
  agendaId: string,
  adoptedBy: string
): Promise<Agenda> => {
  try {
    const { data, error } = await supabase
      .from('agendas')
      .update({
        status: 'adopted',
        adopted_at: new Date().toISOString(),
        adopted_by: adoptedBy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', agendaId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      meeting_id: data.meeting_id,
      version: data.version,
      rules: data.rules,
      status: data.status,
      adopted_at: data.adopted_at || undefined,
      adopted_by: data.adopted_by || undefined,
      created_at: data.created_at,
      updated_at: data.updated_at || undefined,
    };
  } catch (error) {
    console.error('Error adopting agenda:', error);
    throw error;
  }
};

/**
 * Lock an agenda (after adoption, prevents further changes)
 */
export const lockAgenda = async (agendaId: string): Promise<Agenda> => {
  try {
    const { data, error } = await supabase
      .from('agendas')
      .update({
        status: 'locked',
        updated_at: new Date().toISOString(),
      })
      .eq('id', agendaId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      meeting_id: data.meeting_id,
      version: data.version,
      rules: data.rules,
      status: data.status,
      adopted_at: data.adopted_at || undefined,
      adopted_by: data.adopted_by || undefined,
      created_at: data.created_at,
      updated_at: data.updated_at || undefined,
    };
  } catch (error) {
    console.error('Error locking agenda:', error);
    throw error;
  }
};

/**
 * Update agenda rules
 */
export const updateAgendaRules = async (
  agendaId: string,
  rules: AgendaRules
): Promise<Agenda> => {
  try {
    const { data, error } = await supabase
      .from('agendas')
      .update({
        rules: rules,
        updated_at: new Date().toISOString(),
      })
      .eq('id', agendaId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      meeting_id: data.meeting_id,
      version: data.version,
      rules: data.rules,
      status: data.status,
      adopted_at: data.adopted_at || undefined,
      adopted_by: data.adopted_by || undefined,
      created_at: data.created_at,
      updated_at: data.updated_at || undefined,
    };
  } catch (error) {
    console.error('Error updating agenda rules:', error);
    throw error;
  }
};

/**
 * Create a new version of an agenda (for changes after adoption)
 */
export const versionAgenda = async (
  meetingId: string,
  rules?: AgendaRules
): Promise<Agenda> => {
  try {
    // Get current agenda to copy rules if not provided
    const currentAgenda = await loadAgendaByMeeting(meetingId);
    const newRules = rules || currentAgenda?.rules;

    return await createAgenda(meetingId, newRules);
  } catch (error) {
    console.error('Error creating agenda version:', error);
    throw error;
  }
};

/**
 * Update agenda status
 */
export const updateAgendaStatus = async (
  agendaId: string,
  status: AgendaStatus
): Promise<Agenda> => {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    // If adopting, set adoption fields
    if (status === 'adopted') {
      // Note: adopted_by should be set via adoptAgenda function
      // This is a lower-level function
    }

    const { data, error } = await supabase
      .from('agendas')
      .update(updateData)
      .eq('id', agendaId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      meeting_id: data.meeting_id,
      version: data.version,
      rules: data.rules,
      status: data.status,
      adopted_at: data.adopted_at || undefined,
      adopted_by: data.adopted_by || undefined,
      created_at: data.created_at,
      updated_at: data.updated_at || undefined,
    };
  } catch (error) {
    console.error('Error updating agenda status:', error);
    throw error;
  }
};

