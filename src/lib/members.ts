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
    const member = await db.fetch('users', memberId);
    if (!member) {
      throw new Error('Member not found');
    }

    // Prevent self-suspension
    if (memberId === adminUser.id) {
      throw new Error('Cannot suspend yourself');
    }

    // Prevent suspending last superadmin
    if (member.role === 'superadmin') {
      const allAdmins = await db.fetchWithFilters('users', {
        role: 'superadmin',
        status: 'approved'
      });
      if (allAdmins.length <= 1) {
        throw new Error('Cannot suspend the last superadmin');
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
    throw error;
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
    const member = await db.fetch('users', memberId);
    if (!member) {
      throw new Error('Member not found');
    }

    if (member.status !== 'suspended') {
      throw new Error('Member is not suspended');
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
    const member = await db.fetch('users', memberId);
    if (!member) {
      throw new Error('Member not found');
    }

    // Prevent self-ban
    if (memberId === adminUser.id) {
      throw new Error('Cannot ban yourself');
    }

    // Prevent banning last superadmin
    if (member.role === 'superadmin') {
      const allAdmins = await db.fetchWithFilters('users', {
        role: 'superadmin',
        status: 'approved'
      });
      if (allAdmins.length <= 1) {
        throw new Error('Cannot ban the last superadmin');
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
    const member = await db.fetch('users', memberId);
    if (!member) {
      throw new Error('Member not found');
    }

    // Prevent self-deletion
    if (memberId === adminUser.id) {
      throw new Error('Cannot delete yourself');
    }

    // Prevent deleting last superadmin
    if (member.role === 'superadmin') {
      const allAdmins = await db.fetchWithFilters('users', {
        role: 'superadmin',
        status: 'approved'
      });
      if (allAdmins.length <= 1) {
        throw new Error('Cannot delete the last superadmin');
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

