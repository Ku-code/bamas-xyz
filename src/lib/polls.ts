import { db } from './database';
import { supabase } from './supabase';

export interface PollOption {
  id: string;
  text: string;
  order_index: number;
  votes?: string[]; // Array of user IDs - computed from poll_votes
}

export interface Poll {
  id: string;
  title: string;
  description?: string;
  type: 'single' | 'multiple';
  end_date?: string;
  is_active: boolean;
  created_by: string;
  created_by_name: string;
  created_by_image?: string;
  created_at: string;
  updated_at?: string;
  options: PollOption[];
}

/**
 * Load all polls with their options and votes
 */
export const loadPolls = async (): Promise<Poll[]> => {
  try {
    // Load polls
    const { data: pollsData, error: pollsError } = await supabase
      .from('polls')
      .select('*')
      .order('created_at', { ascending: false });

    if (pollsError) throw pollsError;
    if (!pollsData) return [];

    // Load all poll options
    const { data: optionsData, error: optionsError } = await supabase
      .from('poll_options')
      .select('*')
      .order('order_index', { ascending: true });

    if (optionsError) throw optionsError;

    // Load all votes
    const { data: votesData, error: votesError } = await supabase
      .from('poll_votes')
      .select('*');

    if (votesError) throw votesError;

    // Group options by poll_id
    const optionsByPoll: Record<string, any[]> = {};
    optionsData?.forEach((option) => {
      if (!optionsByPoll[option.poll_id]) {
        optionsByPoll[option.poll_id] = [];
      }
      optionsByPoll[option.poll_id].push(option);
    });

    // Group votes by option_id
    const votesByOption: Record<string, string[]> = {};
    votesData?.forEach((vote) => {
      if (!votesByOption[vote.option_id]) {
        votesByOption[vote.option_id] = [];
      }
      votesByOption[vote.option_id].push(vote.user_id);
    });

    // Combine polls with options and votes
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
    console.error('Error loading polls:', error);
    throw error;
  }
};

/**
 * Create a new poll with options
 */
export const createPoll = async (
  pollData: {
    title: string;
    description?: string;
    type: 'single' | 'multiple';
    end_date?: string;
    created_by: string;
    created_by_name: string;
    created_by_image?: string;
  },
  options: string[]
): Promise<Poll> => {
  try {
    // Create poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({
        title: pollData.title,
        description: pollData.description || null,
        type: pollData.type,
        end_date: pollData.end_date || null,
        created_by: pollData.created_by,
        created_by_name: pollData.created_by_name,
        created_by_image: pollData.created_by_image || null,
        is_active: true,
      })
      .select()
      .single();

    if (pollError) throw pollError;

    // Create options
    const optionsToInsert = options.map((text, index) => ({
      poll_id: poll.id,
      text: text.trim(),
      order_index: index,
    }));

    const { data: createdOptions, error: optionsError } = await supabase
      .from('poll_options')
      .insert(optionsToInsert)
      .select();

    if (optionsError) throw optionsError;

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
      options: (createdOptions || []).map((opt: any) => ({
        id: opt.id,
        text: opt.text,
        order_index: opt.order_index,
        votes: [],
      })),
    };
  } catch (error) {
    console.error('Error creating poll:', error);
    throw error;
  }
};

/**
 * Update a poll and its options
 */
export const updatePoll = async (
  pollId: string,
  pollData: {
    title: string;
    description?: string;
    type: 'single' | 'multiple';
    end_date?: string;
  },
  options: string[]
): Promise<Poll> => {
  try {
    // Update poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .update({
        title: pollData.title,
        description: pollData.description || null,
        type: pollData.type,
        end_date: pollData.end_date || null,
      })
      .eq('id', pollId)
      .select()
      .single();

    if (pollError) throw pollError;

    // Get existing options
    const { data: existingOptions } = await supabase
      .from('poll_options')
      .select('*')
      .eq('poll_id', pollId)
      .order('order_index', { ascending: true });

    // Delete all existing options (cascade will delete votes)
    await supabase.from('poll_options').delete().eq('poll_id', pollId);

    // Create new options
    const optionsToInsert = options.map((text, index) => ({
      poll_id: pollId,
      text: text.trim(),
      order_index: index,
    }));

    const { data: createdOptions, error: optionsError } = await supabase
      .from('poll_options')
      .insert(optionsToInsert)
      .select();

    if (optionsError) throw optionsError;

    // Reload poll with votes
    const polls = await loadPolls();
    const updatedPoll = polls.find((p) => p.id === pollId);
    if (!updatedPoll) throw new Error('Poll not found after update');

    return updatedPoll;
  } catch (error) {
    console.error('Error updating poll:', error);
    throw error;
  }
};

/**
 * Delete a poll (cascade will delete options and votes)
 */
export const deletePoll = async (pollId: string): Promise<void> => {
  try {
    const { error } = await supabase.from('polls').delete().eq('id', pollId);
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting poll:', error);
    throw error;
  }
};

/**
 * Submit votes for a poll
 */
export const submitVotes = async (
  pollId: string,
  optionIds: string[],
  userId: string
): Promise<void> => {
  try {
    if (!pollId || !userId || !optionIds || optionIds.length === 0) {
      throw new Error('Missing required parameters: pollId, userId, or optionIds');
    }

    // Validate UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(pollId)) {
      throw new Error('Invalid poll ID format');
    }
    if (!uuidRegex.test(userId)) {
      throw new Error('Invalid user ID format');
    }
    optionIds.forEach((id) => {
      if (!uuidRegex.test(id)) {
        throw new Error(`Invalid option ID format: ${id}`);
      }
    });

    // Get poll to check type and verify it exists
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('type, is_active')
      .eq('id', pollId)
      .single();

    if (pollError) {
      console.error('Error fetching poll:', pollError);
      throw new Error(`Failed to fetch poll: ${pollError.message}`);
    }

    if (!poll) {
      throw new Error('Poll not found');
    }

    if (!poll.is_active) {
      throw new Error('This poll is no longer active');
    }

    // For single choice, ensure only one vote
    if (poll.type === 'single' && optionIds.length > 1) {
      optionIds = [optionIds[0]];
    }

    // Verify all option IDs belong to this poll
    const { data: pollOptions, error: optionsError } = await supabase
      .from('poll_options')
      .select('id')
      .eq('poll_id', pollId)
      .in('id', optionIds);

    if (optionsError) {
      console.error('Error verifying poll options:', optionsError);
      throw new Error(`Failed to verify poll options: ${optionsError.message}`);
    }

    if (!pollOptions || pollOptions.length !== optionIds.length) {
      throw new Error('One or more option IDs are invalid for this poll');
    }

    // Remove existing votes for this user in this poll
    const { error: deleteError } = await supabase
      .from('poll_votes')
      .delete()
      .eq('poll_id', pollId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error deleting existing votes:', deleteError);
      // Don't throw - continue to insert new votes
    }

    // Insert new votes - ensure UUIDs are properly formatted
    const votesToInsert = optionIds.map((optionId) => ({
      poll_id: pollId,
      option_id: optionId,
      user_id: userId, // Supabase will handle UUID conversion
    }));

    console.log('Inserting votes:', votesToInsert);
    
    const { data: insertedVotes, error: insertError } = await supabase
      .from('poll_votes')
      .insert(votesToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting votes:', insertError);
      console.error('Error details:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
      console.error('Votes to insert:', votesToInsert);
      throw new Error(`Failed to submit votes: ${insertError.message}. Code: ${insertError.code || 'UNKNOWN'}`);
    }

    if (!insertedVotes || insertedVotes.length === 0) {
      console.warn('No votes were inserted, but no error was returned');
      throw new Error('Votes were not inserted. Please try again.');
    }

    console.log('Successfully inserted votes:', insertedVotes);
  } catch (error) {
    console.error('Error submitting votes:', error);
    throw error;
  }
};

/**
 * Get user's votes for a poll
 */
export const getUserVotes = async (
  pollId: string,
  userId: string
): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('poll_votes')
      .select('option_id')
      .eq('poll_id', pollId)
      .eq('user_id', userId);

    if (error) throw error;
    return (data || []).map((v) => v.option_id);
  } catch (error) {
    console.error('Error getting user votes:', error);
    return [];
  }
};

