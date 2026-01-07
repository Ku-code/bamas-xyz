import { supabase } from './supabase';
import { Poll } from './polls';

export interface PollAgendaLink {
  id: string;
  poll_id: string;
  agenda_item_id: string;
  created_at: string;
}

export interface PollWithAgendaLink extends Poll {
  agenda_item_id?: string;
  agenda_item_title?: string;
}

/**
 * Link a poll to an agenda item
 */
export const linkPollToAgendaItem = async (
  pollId: string,
  agendaItemId: string
): Promise<PollAgendaLink> => {
  try {
    const { data, error } = await supabase
      .from('poll_agenda_links')
      .insert({
        poll_id: pollId,
        agenda_item_id: agendaItemId,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      poll_id: data.poll_id,
      agenda_item_id: data.agenda_item_id,
      created_at: data.created_at,
    };
  } catch (error) {
    console.error('Error linking poll to agenda item:', error);
    throw error;
  }
};

/**
 * Unlink a poll from an agenda item
 */
export const unlinkPoll = async (
  pollId: string,
  agendaItemId: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('poll_agenda_links')
      .delete()
      .eq('poll_id', pollId)
      .eq('agenda_item_id', agendaItemId);

    if (error) throw error;
  } catch (error) {
    console.error('Error unlinking poll:', error);
    throw error;
  }
};

/**
 * Load all polls linked to an agenda item
 */
export const loadLinkedPolls = async (agendaItemId: string): Promise<Poll[]> => {
  try {
    // Get link records
    const { data: links, error: linksError } = await supabase
      .from('poll_agenda_links')
      .select('poll_id')
      .eq('agenda_item_id', agendaItemId);

    if (linksError) throw linksError;
    if (!links || links.length === 0) return [];

    const pollIds = links.map(link => link.poll_id);

    // Load polls
    const { data: pollsData, error: pollsError } = await supabase
      .from('polls')
      .select('*')
      .in('id', pollIds)
      .order('created_at', { ascending: false });

    if (pollsError) throw pollsError;
    if (!pollsData) return [];

    // Load poll options
    const { data: optionsData, error: optionsError } = await supabase
      .from('poll_options')
      .select('*')
      .in('poll_id', pollIds)
      .order('order_index', { ascending: true });

    if (optionsError) throw optionsError;

    // Load votes
    const { data: votesData, error: votesError } = await supabase
      .from('poll_votes')
      .select('*')
      .in('poll_id', pollIds);

    if (votesError) throw votesError;

    // Group options and votes
    const optionsByPoll: Record<string, any[]> = {};
    optionsData?.forEach((option) => {
      if (!optionsByPoll[option.poll_id]) {
        optionsByPoll[option.poll_id] = [];
      }
      optionsByPoll[option.poll_id].push(option);
    });

    const votesByOption: Record<string, string[]> = {};
    votesData?.forEach((vote) => {
      if (!votesByOption[vote.option_id]) {
        votesByOption[vote.option_id] = [];
      }
      votesByOption[vote.option_id].push(vote.user_id);
    });

    // Build poll objects
    const polls: Poll[] = pollsData.map((poll: any) => {
      const options = (optionsByPoll[poll.id] || []).map((option: any) => ({
        id: option.id,
        text: option.text,
        order_index: option.order_index,
        votes: votesByOption[option.id] || [],
      }));

      return {
        id: poll.id,
        title: poll.title,
        description: poll.description || undefined,
        type: poll.type,
        end_date: poll.end_date || undefined,
        is_active: poll.is_active,
        created_by: poll.created_by,
        created_by_name: poll.created_by_name,
        created_by_image: poll.created_by_image || undefined,
        created_at: poll.created_at,
        updated_at: poll.updated_at || undefined,
        options,
      };
    });

    return polls;
  } catch (error) {
    console.error('Error loading linked polls:', error);
    throw error;
  }
};

/**
 * Load all agenda items linked to a poll
 */
export const loadLinkedAgendaItems = async (pollId: string): Promise<Array<{
  id: string;
  title: string;
  description: string;
}>> => {
  try {
    // Get link records
    const { data: links, error: linksError } = await supabase
      .from('poll_agenda_links')
      .select('agenda_item_id')
      .eq('poll_id', pollId);

    if (linksError) throw linksError;
    if (!links || links.length === 0) return [];

    const agendaItemIds = links.map(link => link.agenda_item_id);

    // Load agenda items
    const { data: itemsData, error: itemsError } = await supabase
      .from('agenda_items')
      .select('id, title, description')
      .in('id', agendaItemIds);

    if (itemsError) throw itemsError;
    if (!itemsData) return [];

    return itemsData.map((item: any) => ({
      id: item.id,
      title: item.title,
      description: item.description,
    }));
  } catch (error) {
    console.error('Error loading linked agenda items:', error);
    throw error;
  }
};

/**
 * Check if a poll is linked to any agenda item
 */
export const isPollLinked = async (pollId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('poll_agenda_links')
      .select('id')
      .eq('poll_id', pollId)
      .limit(1);

    if (error) throw error;

    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking poll link:', error);
    throw error;
  }
};

/**
 * Get link information for a poll and agenda item
 */
export const getLink = async (
  pollId: string,
  agendaItemId: string
): Promise<PollAgendaLink | null> => {
  try {
    const { data, error } = await supabase
      .from('poll_agenda_links')
      .select('*')
      .eq('poll_id', pollId)
      .eq('agenda_item_id', agendaItemId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) return null;

    return {
      id: data.id,
      poll_id: data.poll_id,
      agenda_item_id: data.agenda_item_id,
      created_at: data.created_at,
    };
  } catch (error) {
    console.error('Error getting link:', error);
    throw error;
  }
};

