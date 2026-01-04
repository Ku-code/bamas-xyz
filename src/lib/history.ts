import { db } from './database';
import { User } from '@/contexts/AuthContext';

export type HistoryType =
  | "document_created"
  | "document_updated"
  | "document_deleted"
  | "document_imported_drive"
  | "document_imported_computer"
  | "vote_created"
  | "vote_updated"
  | "vote_deleted"
  | "vote_submitted"
  | "agenda_created"
  | "agenda_updated"
  | "agenda_deleted"
  | "agenda_commented"
  | "member_added"
  | "member_approved"
  | "member_rejected"
  | "member_suspended"
  | "member_restored"
  | "member_banned"
  | "member_deleted"
  | "member_role_changed"
  | "member_removed"
  | "profile_updated"
  | "resource_uploaded"
  | "resource_updated"
  | "resource_deleted"
  | "resource_downloaded"
  | "other";

export interface HistoryItem {
  id: string;
  type: HistoryType;
  action?: string;
  description?: string;
  user_id: string | null;
  user_name: string;
  user_image?: string | null;
  target_id?: string | null;
  target_title?: string | null;
  metadata?: Record<string, any>;
  created_at: string;
}

/**
 * Log a history item to Supabase
 */
export const logHistory = async (
  type: HistoryType,
  user: User | null,
  targetId?: string,
  targetTitle?: string,
  metadata?: Record<string, any>
): Promise<void> => {
  try {
    if (!user) {
      console.warn('Cannot log history: no user provided');
      return;
    }

    // Map history type to action and description
    const actionMap: Record<HistoryType, { action: string; description: string }> = {
      document_created: { action: 'Created document', description: `Created document "${targetTitle || targetId}"` },
      document_updated: { action: 'Updated document', description: `Updated document "${targetTitle || targetId}"` },
      document_deleted: { action: 'Deleted document', description: `Deleted document "${targetTitle || targetId}"` },
      document_imported_drive: { action: 'Imported from Google Drive', description: `Imported document "${targetTitle || targetId}" from Google Drive` },
      document_imported_computer: { action: 'Imported from computer', description: `Imported document "${targetTitle || targetId}" from computer` },
      vote_created: { action: 'Created poll', description: `Created poll "${targetTitle || targetId}"` },
      vote_updated: { action: 'Updated poll', description: `Updated poll "${targetTitle || targetId}"` },
      vote_deleted: { action: 'Deleted poll', description: `Deleted poll "${targetTitle || targetId}"` },
      vote_submitted: { action: 'Voted on poll', description: `Voted on poll "${targetTitle || targetId}"` },
      agenda_created: { action: 'Created agenda', description: `Created agenda "${targetTitle || targetId}"` },
      agenda_updated: { action: 'Updated agenda', description: `Updated agenda "${targetTitle || targetId}"` },
      agenda_deleted: { action: 'Deleted agenda', description: `Deleted agenda "${targetTitle || targetId}"` },
      agenda_commented: { action: 'Commented on agenda', description: `Commented on agenda "${targetTitle || targetId}"` },
      member_added: { action: 'Added member', description: `Added member "${targetTitle || targetId}"` },
      member_approved: { action: 'Approved member', description: `Approved member "${targetTitle || targetId}"` },
      member_rejected: { action: 'Rejected member', description: `Rejected member "${targetTitle || targetId}"` },
      member_suspended: { action: 'Suspended member', description: `Suspended member "${targetTitle || targetId}"` },
      member_restored: { action: 'Restored member', description: `Restored member "${targetTitle || targetId}"` },
      member_banned: { action: 'Banned member', description: `Banned member "${targetTitle || targetId}"` },
      member_deleted: { action: 'Deleted member', description: `Deleted member "${targetTitle || targetId}"` },
      member_role_changed: { action: 'Changed member role', description: `Changed role of "${targetTitle || targetId}"` },
      member_removed: { action: 'Removed member', description: `Removed member "${targetTitle || targetId}"` },
      profile_updated: { action: 'Updated profile', description: 'Updated their profile' },
      resource_uploaded: { action: 'Uploaded resource', description: `Uploaded resource "${targetTitle || targetId}"` },
      resource_updated: { action: 'Updated resource', description: `Updated resource "${targetTitle || targetId}"` },
      resource_deleted: { action: 'Deleted resource', description: `Deleted resource "${targetTitle || targetId}"` },
      resource_downloaded: { action: 'Downloaded resource', description: `Downloaded resource "${targetTitle || targetId}"` },
      other: { action: 'Other action', description: targetTitle || 'Performed an action' },
    };

    const { action, description } = actionMap[type] || actionMap.other;

    await db.insert('activity_history', {
      type,
      action,
      description,
      user_id: user.id,
      user_name: user.name,
      user_image: user.image || null,
      target_id: targetId || null,
      target_title: targetTitle || null,
      metadata: metadata || null,
    });
  } catch (error) {
    console.error('Error logging history:', error);
    // Don't throw - history logging should not break the main flow
  }
};

/**
 * Get history items from Supabase
 */
export const getHistory = async (limit: number = 1000): Promise<HistoryItem[]> => {
  try {
    const history = await db.fetchWithFilters(
      'activity_history',
      {},
      { column: 'created_at', ascending: false }
    );
    return (history || []).slice(0, limit) as HistoryItem[];
  } catch (error) {
    console.error('Error getting history:', error);
    return [];
  }
};

/**
 * Delete a specific history item
 */
export const deleteHistoryItem = async (historyId: string): Promise<void> => {
  try {
    await db.delete('activity_history', historyId);
  } catch (error) {
    console.error('Error deleting history item:', error);
    throw error;
  }
};

/**
 * Clear all history (superadmin only)
 */
export const clearHistory = async (): Promise<void> => {
  try {
    // Get all history items
    const allHistory = await db.fetchAll('activity_history');
    
    // Delete all items
    for (const item of allHistory) {
      await db.delete('activity_history', item.id);
    }
  } catch (error) {
    console.error('Error clearing history:', error);
    throw error;
  }
};
