import { useAuth } from '@/contexts/AuthContext';
import { getUserWGMemberships } from './working-groups';
import { useEffect, useState } from 'react';

export interface WGPermissions {
  canView: boolean;
  canPost: boolean;
  canManageProjects: boolean;
  canManageTasks: boolean;
  canApproveResources: boolean;
  canManageMembers: boolean;
  isMember: boolean;
  isLead: boolean;
  isAdmin: boolean;
  loading?: boolean;
}

export const useWorkingGroupPermissions = (workingGroupId: string | null, leadUserId: string | null) => {
  const { user, isSuperAdmin, isAdmin } = useAuth();
  const [memberships, setMemberships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !workingGroupId) {
      setLoading(false);
      return;
    }

    getUserWGMemberships(user.id)
      .then((members) => {
        setMemberships(members);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error loading WG memberships:', error);
        setLoading(false);
      });
  }, [user, workingGroupId]);

  if (!user || !workingGroupId || loading) {
    return {
      canView: false,
      canPost: false,
      canManageProjects: false,
      canManageTasks: false,
      canApproveResources: false,
      canManageMembers: false,
      isMember: false,
      isLead: false,
      isAdmin: isSuperAdmin || isAdmin,
      loading: true,
    };
  }

  const membership = memberships.find((m) => m.working_group_id === workingGroupId);
  const isMember = !!membership;
  const isLead = membership?.role === 'lead' || user.id === leadUserId;
  const isAdminUser = isSuperAdmin || isAdmin;

  const permissions: WGPermissions = {
    canView: isMember || isAdminUser,
    canPost: isMember || isAdminUser,
    canManageProjects: isLead || isAdminUser,
    canManageTasks: isMember || isAdminUser,
    canApproveResources: isLead || isAdminUser,
    canManageMembers: isLead || isAdminUser,
    isMember,
    isLead,
    isAdmin: isAdminUser,
    loading: false,
  };

  return permissions;
};

export const checkWGMembership = async (userId: string, workingGroupId: string): Promise<boolean> => {
  try {
    const memberships = await getUserWGMemberships(userId);
    return memberships.some((m) => m.working_group_id === workingGroupId);
  } catch (error) {
    console.error('Error checking WG membership:', error);
    return false;
  }
};

export const checkWGLead = (userId: string | null, leadUserId: string | null, isSuperAdmin: boolean, isAdmin: boolean): boolean => {
  if (!userId) return false;
  return userId === leadUserId || isSuperAdmin || isAdmin;
};

