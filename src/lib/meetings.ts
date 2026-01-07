import { supabase } from './supabase';

export type MeetingType = 'general_assembly' | 'board_meeting';
export type MeetingStatus = 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface Meeting {
  id: string;
  type: MeetingType;
  title: string;
  scheduled_date: string;
  scheduled_time: string;
  location?: string;
  status: MeetingStatus;
  chairperson_id?: string;
  created_by: string;
  created_at: string;
  started_at?: string;
  ended_at?: string;
  updated_at?: string;
}

export interface MeetingWithAgenda extends Meeting {
  agenda?: {
    id: string;
    version: number;
    rules?: any;
    status: string;
    adopted_at?: string;
    adopted_by?: string;
  };
}

/**
 * Create a new meeting
 */
export const createMeeting = async (
  meetingData: {
    type: MeetingType;
    title: string;
    scheduled_date: string;
    scheduled_time: string;
    location?: string;
    chairperson_id?: string;
    created_by: string;
  }
): Promise<Meeting> => {
  try {
    const { data, error } = await supabase
      .from('meetings')
      .insert({
        type: meetingData.type,
        title: meetingData.title,
        scheduled_date: meetingData.scheduled_date,
        scheduled_time: meetingData.scheduled_time,
        location: meetingData.location || null,
        chairperson_id: meetingData.chairperson_id || null,
        created_by: meetingData.created_by,
        status: 'draft',
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      type: data.type,
      title: data.title,
      scheduled_date: data.scheduled_date,
      scheduled_time: data.scheduled_time,
      location: data.location || undefined,
      status: data.status,
      chairperson_id: data.chairperson_id || undefined,
      created_by: data.created_by,
      created_at: data.created_at,
      started_at: data.started_at || undefined,
      ended_at: data.ended_at || undefined,
      updated_at: data.updated_at || undefined,
    };
  } catch (error) {
    console.error('Error creating meeting:', error);
    throw error;
  }
};

/**
 * Load all meetings with optional filters
 */
export const loadMeetings = async (filters?: {
  type?: MeetingType;
  status?: MeetingStatus;
  startDate?: string;
  endDate?: string;
}): Promise<Meeting[]> => {
  try {
    let query = supabase
      .from('meetings')
      .select('*')
      .order('scheduled_date', { ascending: false })
      .order('scheduled_time', { ascending: false });

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.startDate) {
      query = query.gte('scheduled_date', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('scheduled_date', filters.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    if (!data) return [];

    return data.map((meeting: any) => ({
      id: meeting.id,
      type: meeting.type,
      title: meeting.title,
      scheduled_date: meeting.scheduled_date,
      scheduled_time: meeting.scheduled_time,
      location: meeting.location || undefined,
      status: meeting.status,
      chairperson_id: meeting.chairperson_id || undefined,
      created_by: meeting.created_by,
      created_at: meeting.created_at,
      started_at: meeting.started_at || undefined,
      ended_at: meeting.ended_at || undefined,
      updated_at: meeting.updated_at || undefined,
    }));
  } catch (error) {
    console.error('Error loading meetings:', error);
    throw error;
  }
};

/**
 * Load a single meeting by ID with its agenda
 */
export const loadMeetingById = async (meetingId: string): Promise<MeetingWithAgenda | null> => {
  try {
    // Load meeting
    const { data: meetingData, error: meetingError } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', meetingId)
      .single();

    if (meetingError) throw meetingError;
    if (!meetingData) return null;

    // Load current agenda (latest version)
    const { data: agendaData, error: agendaError } = await supabase
      .from('agendas')
      .select('*')
      .eq('meeting_id', meetingId)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (agendaError && agendaError.code !== 'PGRST116') {
      // PGRST116 is "not found" - acceptable if no agenda yet
      throw agendaError;
    }

    const meeting: MeetingWithAgenda = {
      id: meetingData.id,
      type: meetingData.type,
      title: meetingData.title,
      scheduled_date: meetingData.scheduled_date,
      scheduled_time: meetingData.scheduled_time,
      location: meetingData.location || undefined,
      status: meetingData.status,
      chairperson_id: meetingData.chairperson_id || undefined,
      created_by: meetingData.created_by,
      created_at: meetingData.created_at,
      started_at: meetingData.started_at || undefined,
      ended_at: meetingData.ended_at || undefined,
      updated_at: meetingData.updated_at || undefined,
      agenda: agendaData ? {
        id: agendaData.id,
        version: agendaData.version,
        rules: agendaData.rules,
        status: agendaData.status,
        adopted_at: agendaData.adopted_at || undefined,
        adopted_by: agendaData.adopted_by || undefined,
      } : undefined,
    };

    return meeting;
  } catch (error) {
    console.error('Error loading meeting:', error);
    throw error;
  }
};

/**
 * Update meeting details
 */
export const updateMeeting = async (
  meetingId: string,
  updates: {
    title?: string;
    scheduled_date?: string;
    scheduled_time?: string;
    location?: string;
    chairperson_id?: string;
    status?: MeetingStatus;
  }
): Promise<Meeting> => {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.scheduled_date !== undefined) updateData.scheduled_date = updates.scheduled_date;
    if (updates.scheduled_time !== undefined) updateData.scheduled_time = updates.scheduled_time;
    if (updates.location !== undefined) updateData.location = updates.location || null;
    if (updates.chairperson_id !== undefined) updateData.chairperson_id = updates.chairperson_id || null;
    if (updates.status !== undefined) updateData.status = updates.status;

    const { data, error } = await supabase
      .from('meetings')
      .update(updateData)
      .eq('id', meetingId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      type: data.type,
      title: data.title,
      scheduled_date: data.scheduled_date,
      scheduled_time: data.scheduled_time,
      location: data.location || undefined,
      status: data.status,
      chairperson_id: data.chairperson_id || undefined,
      created_by: data.created_by,
      created_at: data.created_at,
      started_at: data.started_at || undefined,
      ended_at: data.ended_at || undefined,
      updated_at: data.updated_at || undefined,
    };
  } catch (error) {
    console.error('Error updating meeting:', error);
    throw error;
  }
};

/**
 * Start a meeting (change status to in_progress)
 */
export const startMeeting = async (meetingId: string): Promise<Meeting> => {
  try {
    const { data, error } = await supabase
      .from('meetings')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', meetingId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      type: data.type,
      title: data.title,
      scheduled_date: data.scheduled_date,
      scheduled_time: data.scheduled_time,
      location: data.location || undefined,
      status: data.status,
      chairperson_id: data.chairperson_id || undefined,
      created_by: data.created_by,
      created_at: data.created_at,
      started_at: data.started_at || undefined,
      ended_at: data.ended_at || undefined,
      updated_at: data.updated_at || undefined,
    };
  } catch (error) {
    console.error('Error starting meeting:', error);
    throw error;
  }
};

/**
 * Complete a meeting (change status to completed)
 */
export const completeMeeting = async (meetingId: string): Promise<Meeting> => {
  try {
    const { data, error } = await supabase
      .from('meetings')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', meetingId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      type: data.type,
      title: data.title,
      scheduled_date: data.scheduled_date,
      scheduled_time: data.scheduled_time,
      location: data.location || undefined,
      status: data.status,
      chairperson_id: data.chairperson_id || undefined,
      created_by: data.created_by,
      created_at: data.created_at,
      started_at: data.started_at || undefined,
      ended_at: data.ended_at || undefined,
      updated_at: data.updated_at || undefined,
    };
  } catch (error) {
    console.error('Error completing meeting:', error);
    throw error;
  }
};

/**
 * Delete a meeting (only for superadmins)
 */
export const deleteMeeting = async (meetingId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('meetings')
      .delete()
      .eq('id', meetingId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting meeting:', error);
    throw error;
  }
};

