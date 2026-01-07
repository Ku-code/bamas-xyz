import { supabase } from './supabase';

export type ProposalStatus = 'pending' | 'approved' | 'rejected';

export interface AgendaProposal {
  id: string;
  meeting_id: string;
  agenda_id?: string;
  parent_item_id?: string; // null for top-level, UUID for sub-item
  title: string;
  description: string;
  justification?: string;
  proposed_by: string;
  proposed_at: string;
  status: ProposalStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
}

/**
 * Submit a proposal for an agenda item or sub-item
 */
export const submitProposal = async (
  proposalData: {
    meeting_id: string;
    parent_item_id?: string;
    title: string;
    description: string;
    justification?: string;
    proposed_by: string;
  }
): Promise<AgendaProposal> => {
  try {
    const { data, error } = await supabase
      .from('agenda_proposals')
      .insert({
        meeting_id: proposalData.meeting_id,
        agenda_id: null, // Will be set when approved
        parent_item_id: proposalData.parent_item_id || null,
        title: proposalData.title,
        description: proposalData.description,
        justification: proposalData.justification || null,
        proposed_by: proposalData.proposed_by,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      meeting_id: data.meeting_id,
      agenda_id: data.agenda_id || undefined,
      parent_item_id: data.parent_item_id || undefined,
      title: data.title,
      description: data.description,
      justification: data.justification || undefined,
      proposed_by: data.proposed_by,
      proposed_at: data.proposed_at,
      status: data.status,
      reviewed_by: data.reviewed_by || undefined,
      reviewed_at: data.reviewed_at || undefined,
      review_notes: data.review_notes || undefined,
    };
  } catch (error) {
    console.error('Error submitting proposal:', error);
    throw error;
  }
};

/**
 * Load all proposals with optional filters
 */
export const loadProposals = async (filters?: {
  meeting_id?: string;
  status?: ProposalStatus;
  proposed_by?: string;
}): Promise<AgendaProposal[]> => {
  try {
    let query = supabase
      .from('agenda_proposals')
      .select('*')
      .order('proposed_at', { ascending: false });

    if (filters?.meeting_id) {
      query = query.eq('meeting_id', filters.meeting_id);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.proposed_by) {
      query = query.eq('proposed_by', filters.proposed_by);
    }

    const { data, error } = await query;

    if (error) throw error;
    if (!data) return [];

    return data.map((proposal: any) => ({
      id: proposal.id,
      meeting_id: proposal.meeting_id,
      agenda_id: proposal.agenda_id || undefined,
      parent_item_id: proposal.parent_item_id || undefined,
      title: proposal.title,
      description: proposal.description,
      justification: proposal.justification || undefined,
      proposed_by: proposal.proposed_by,
      proposed_at: proposal.proposed_at,
      status: proposal.status,
      reviewed_by: proposal.reviewed_by || undefined,
      reviewed_at: proposal.reviewed_at || undefined,
      review_notes: proposal.review_notes || undefined,
    }));
  } catch (error) {
    console.error('Error loading proposals:', error);
    throw error;
  }
};

/**
 * Load proposals for a specific meeting
 */
export const loadProposalsByMeeting = async (meetingId: string): Promise<AgendaProposal[]> => {
  return loadProposals({ meeting_id: meetingId });
};

/**
 * Approve a proposal and optionally add it to the agenda
 */
export const approveProposal = async (
  proposalId: string,
  reviewData: {
    reviewed_by: string;
    review_notes?: string;
    add_to_agenda?: boolean; // If true, creates agenda item from proposal
    agenda_id?: string; // Required if add_to_agenda is true
    order_index?: number; // Position in agenda
  }
): Promise<AgendaProposal> => {
  try {
    // Update proposal status
    const updateData: any = {
      status: 'approved',
      reviewed_by: reviewData.reviewed_by,
      reviewed_at: new Date().toISOString(),
      review_notes: reviewData.review_notes || null,
    };

    if (reviewData.add_to_agenda && reviewData.agenda_id) {
      updateData.agenda_id = reviewData.agenda_id;
    }

    const { data: proposalData, error: proposalError } = await supabase
      .from('agenda_proposals')
      .update(updateData)
      .eq('id', proposalId)
      .select()
      .single();

    if (proposalError) throw proposalError;

    // If requested, create agenda item from proposal
    if (reviewData.add_to_agenda && reviewData.agenda_id) {
      // Get meeting to get date/time
      const { data: meetingData } = await supabase
        .from('meetings')
        .select('scheduled_date, scheduled_time')
        .eq('id', proposalData.meeting_id)
        .single();

      // Get proposer info
      const { data: proposerData } = await supabase
        .from('users')
        .select('name, image')
        .eq('id', proposalData.proposed_by)
        .single();

      // Create agenda item
      const { error: itemError } = await supabase
        .from('agenda_items')
        .insert({
          meeting_id: proposalData.meeting_id,
          agenda_id: reviewData.agenda_id,
          parent_item_id: proposalData.parent_item_id || null,
          title: proposalData.title,
          description: proposalData.description,
          date: meetingData?.scheduled_date || new Date().toISOString().split('T')[0],
          time: meetingData?.scheduled_time || '00:00:00',
          created_by: proposalData.proposed_by,
          created_by_name: proposerData?.name || 'Unknown',
          created_by_image: proposerData?.image || null,
          order_index: reviewData.order_index || 0,
          status: 'approved',
          proposed_by: proposalData.proposed_by,
          proposed_at: proposalData.proposed_at,
          approved_by: reviewData.reviewed_by,
          approved_at: new Date().toISOString(),
        });

      if (itemError) {
        console.error('Error creating agenda item from proposal:', itemError);
        // Don't throw - proposal is still approved, just item creation failed
      }
    }

    return {
      id: proposalData.id,
      meeting_id: proposalData.meeting_id,
      agenda_id: proposalData.agenda_id || undefined,
      parent_item_id: proposalData.parent_item_id || undefined,
      title: proposalData.title,
      description: proposalData.description,
      justification: proposalData.justification || undefined,
      proposed_by: proposalData.proposed_by,
      proposed_at: proposalData.proposed_at,
      status: proposalData.status,
      reviewed_by: proposalData.reviewed_by || undefined,
      reviewed_at: proposalData.reviewed_at || undefined,
      review_notes: proposalData.review_notes || undefined,
    };
  } catch (error) {
    console.error('Error approving proposal:', error);
    throw error;
  }
};

/**
 * Reject a proposal
 */
export const rejectProposal = async (
  proposalId: string,
  reviewData: {
    reviewed_by: string;
    review_notes: string;
  }
): Promise<AgendaProposal> => {
  try {
    const { data, error } = await supabase
      .from('agenda_proposals')
      .update({
        status: 'rejected',
        reviewed_by: reviewData.reviewed_by,
        reviewed_at: new Date().toISOString(),
        review_notes: reviewData.review_notes,
      })
      .eq('id', proposalId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      meeting_id: data.meeting_id,
      agenda_id: data.agenda_id || undefined,
      parent_item_id: data.parent_item_id || undefined,
      title: data.title,
      description: data.description,
      justification: data.justification || undefined,
      proposed_by: data.proposed_by,
      proposed_at: data.proposed_at,
      status: data.status,
      reviewed_by: data.reviewed_by || undefined,
      reviewed_at: data.reviewed_at || undefined,
      review_notes: data.review_notes || undefined,
    };
  } catch (error) {
    console.error('Error rejecting proposal:', error);
    throw error;
  }
};

/**
 * Get proposal by ID
 */
export const getProposalById = async (proposalId: string): Promise<AgendaProposal | null> => {
  try {
    const { data, error } = await supabase
      .from('agenda_proposals')
      .select('*')
      .eq('id', proposalId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) return null;

    return {
      id: data.id,
      meeting_id: data.meeting_id,
      agenda_id: data.agenda_id || undefined,
      parent_item_id: data.parent_item_id || undefined,
      title: data.title,
      description: data.description,
      justification: data.justification || undefined,
      proposed_by: data.proposed_by,
      proposed_at: data.proposed_at,
      status: data.status,
      reviewed_by: data.reviewed_by || undefined,
      reviewed_at: data.reviewed_at || undefined,
      review_notes: data.review_notes || undefined,
    };
  } catch (error) {
    console.error('Error getting proposal:', error);
    throw error;
  }
};

