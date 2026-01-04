import { db } from './database';
import { User } from '@/contexts/AuthContext';
import { logHistory } from './history';

/**
 * Suspend a member (temporary ban)
 */
export const suspendMember = async (
  memberId: string,
  reason: string,
  adminUser: User
): Promise<void> => {
  try {
    const member = await db.fetchById('users', memberId);
    if (!member) {
      throw new Error('Member not found. The member may have been deleted or does not exist.');
    }

    // Prevent self-suspension
    if (memberId === adminUser.id) {
      throw new Error('You cannot suspend your own account. Please ask another superadmin to perform this action.');
    }

    // Prevent suspending last superadmin
    if (member.role === 'superadmin') {
      const allAdmins = await db.fetchWithFilters('users', {
        role: 'superadmin',
        status: 'approved'
      });
      if (allAdmins.length <= 1) {
        throw new Error('Cannot suspend the last superadmin. At least one superadmin must remain active to manage the platform.');
      }
    }

    await db.update('users', memberId, {
      status: 'suspended',
      suspended_at: new Date().toISOString(),
      suspended_by: adminUser.id,
      suspension_reason: reason,
      updated_at: new Date().toISOString(),
    });

    await logHistory(
      'member_suspended',
      adminUser,
      memberId,
      member.name,
      { reason }
    );
  } catch (error: any) {
    console.error('Error suspending member:', error);
    // Provide more descriptive error messages
    if (error.message) {
      throw error;
    }
    if (error.code === 'PGRST301' || error.code === '23503') {
      throw new Error('Database constraint violation. The member may be referenced by other records. Please contact support.');
    }
    if (error.code === '42501') {
      throw new Error('Permission denied. You do not have sufficient permissions to suspend members. Please contact a superadmin.');
    }
    throw new Error(`Failed to suspend member: ${error.message || 'Unknown database error. Please try again or contact support.'}`);
  }
};

/**
 * Restore a suspended member
 */
export const restoreMember = async (
  memberId: string,
  adminUser: User
): Promise<void> => {
  try {
    const member = await db.fetchById('users', memberId);
    if (!member) {
      throw new Error('Member not found. The member may have been deleted or does not exist.');
    }

    if (member.status !== 'suspended') {
      throw new Error(`Member is not suspended. Current status: ${member.status || 'unknown'}. Only suspended members can be restored.`);
    }

    await db.update('users', memberId, {
      status: 'approved',
      suspended_at: null,
      suspended_by: null,
      suspension_reason: null,
      updated_at: new Date().toISOString(),
    });

    await logHistory(
      'member_restored',
      adminUser,
      memberId,
      member.name
    );
  } catch (error: any) {
    console.error('Error restoring member:', error);
    throw error;
  }
};

/**
 * Ban a member (permanent removal)
 */
export const banMember = async (
  memberId: string,
  reason: string,
  adminUser: User
): Promise<void> => {
  try {
    const member = await db.fetchById('users', memberId);
    if (!member) {
      throw new Error('Member not found. The member may have been deleted or does not exist.');
    }

    // Prevent self-ban
    if (memberId === adminUser.id) {
      throw new Error('You cannot ban your own account. Please ask another superadmin to perform this action.');
    }

    // Prevent banning last superadmin
    if (member.role === 'superadmin') {
      const allAdmins = await db.fetchWithFilters('users', {
        role: 'superadmin',
        status: 'approved'
      });
      if (allAdmins.length <= 1) {
        throw new Error('Cannot ban the last superadmin. At least one superadmin must remain active to manage the platform.');
      }
    }

    await db.update('users', memberId, {
      status: 'rejected',
      suspended_at: new Date().toISOString(),
      suspended_by: adminUser.id,
      suspension_reason: reason,
      updated_at: new Date().toISOString(),
    });

    await logHistory(
      'member_banned',
      adminUser,
      memberId,
      member.name,
      { reason }
    );
  } catch (error: any) {
    console.error('Error banning member:', error);
    throw error;
  }
};

/**
 * Soft delete a member (marks as deleted but keeps data)
 */
export const deleteMember = async (
  memberId: string,
  reason: string,
  adminUser: User
): Promise<void> => {
  try {
    const member = await db.fetchById('users', memberId);
    if (!member) {
      throw new Error('Member not found. The member may have been deleted or does not exist.');
    }

    // Prevent self-deletion
    if (memberId === adminUser.id) {
      throw new Error('You cannot delete your own account. Please ask another superadmin to perform this action.');
    }

    // Prevent deleting last superadmin
    if (member.role === 'superadmin') {
      const allAdmins = await db.fetchWithFilters('users', {
        role: 'superadmin',
        status: 'approved'
      });
      if (allAdmins.length <= 1) {
        throw new Error('Cannot delete the last superadmin. At least one superadmin must remain active to manage the platform.');
      }
    }

    await db.update('users', memberId, {
      deleted_at: new Date().toISOString(),
      deleted_by: adminUser.id,
      deletion_reason: reason,
      updated_at: new Date().toISOString(),
    });

    await logHistory(
      'member_deleted',
      adminUser,
      memberId,
      member.name,
      { reason }
    );
  } catch (error: any) {
    console.error('Error deleting member:', error);
    throw error;
  }
};

/**
 * Get member activity/history
 */
export const getMemberActivity = async (memberId: string): Promise<any[]> => {
  try {
    const history = await db.fetchWithFilters(
      'activity_history',
      { user_id: memberId },
      { column: 'created_at', ascending: false }
    );
    return history || [];
  } catch (error) {
    console.error('Error getting member activity:', error);
    return [];
  }
};

