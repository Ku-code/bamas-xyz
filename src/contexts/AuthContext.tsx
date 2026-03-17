import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { db } from '@/lib/database';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────
export type UserRole = 'superadmin' | 'admin' | 'member' | 'board_member' | 'wg_lead';
export type MemberStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type BillingStatus = 'paid' | 'pending' | 'overdue' | 'exempt';

export interface BillingInfo {
  status: BillingStatus;
  amount?: number;
  currency?: string;
  lastPaymentDate?: string;
  dueDate?: string;
  invoiceId?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  provider?: 'google' | 'email';
  bio?: string;
  hashtags?: string[];
  location?: string;
  website?: string;
  phone?: string;
  role?: UserRole;
  status?: MemberStatus;
  createdAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  billing?: BillingInfo;
  company_name?: string;
}

export type { SupabaseUser };

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isBoardMember: boolean;
  isLoading: boolean;
  login: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

// ────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────
const SUPERADMIN_EMAILS = [
  'kuzodonchev@3dopendesign.com',
  'kuzodonchev@gmail.com',
  'info@bamas.xyz'
];

const DB_TIMEOUT_MS = 5000;

// ────────────────────────────────────────────────────────────
// Pure helper functions (no React, no circular deps)
// ────────────────────────────────────────────────────────────

/**
 * Maps a database row to our application User interface.
 * Hardcoded superadmin emails are always granted superadmin role.
 */
function mapDbUserToUser(dbUser: Record<string, unknown>): User {
  const email = (dbUser.email as string)?.toLowerCase() ?? '';
  const isHardcoded = SUPERADMIN_EMAILS.includes(email);
  return {
    id: dbUser.id as string,
    name: dbUser.name as string,
    email: email,
    image: (dbUser.image as string) || undefined,
    provider: (dbUser.provider as 'google' | 'email') || undefined,
    bio: (dbUser.bio as string) || undefined,
    hashtags: (dbUser.hashtags as string[]) || undefined,
    location: (dbUser.location as string) || undefined,
    website: (dbUser.website as string) || undefined,
    phone: (dbUser.phone as string) || undefined,
    role: isHardcoded ? 'superadmin' : ((dbUser.role as UserRole) || 'member'),
    status: isHardcoded ? 'approved' : ((dbUser.status as MemberStatus) || 'pending'),
    createdAt: dbUser.created_at as string,
    approvedAt: (dbUser.approved_at as string) || undefined,
    approvedBy: (dbUser.approved_by as string) || undefined,
    company_name: (dbUser.company_name as string) || undefined,
  };
}

/**
 * Creates a minimal User object from Supabase Auth metadata.
 * Used as a fallback when the database is unreachable.
 */
function getFallbackUser(authUser: SupabaseUser): User {
  const email = authUser.email?.toLowerCase() || '';
  const isHardcoded = SUPERADMIN_EMAILS.includes(email);
  const meta = authUser.user_metadata || {};
  console.warn('Auth: Using fallback user for', email);
  return {
    id: authUser.id,
    email: email,
    name: (meta.name as string) || (meta.full_name as string) || email.split('@')[0] || 'User',
    role: isHardcoded ? 'superadmin' : 'member',
    status: isHardcoded ? 'approved' : 'pending',
    createdAt: authUser.created_at,
    provider: (authUser.app_metadata?.provider as 'google' | 'email') || 'email',
    image: (meta.avatar_url as string) || (meta.picture as string) || undefined,
  };
}

/**
 * Attempts to load a user profile from the database with a timeout.
 * Falls back to creating a profile via RPC if one doesn't exist.
 * Returns a mapped User or a fallback if everything fails.
 */
async function loadUserProfile(userId: string, authUser?: SupabaseUser | null): Promise<User | null> {
  try {
    // 1. Try fetching from database with a timeout
    let dbUser: Record<string, unknown> | null = null;
    try {
      const fetchPromise = db.fetchById<Record<string, unknown>>('users', userId);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('DB timeout')), DB_TIMEOUT_MS)
      );
      dbUser = await Promise.race([fetchPromise, timeoutPromise]);
    } catch {
      console.warn('Auth: DB fetch slow/failed, attempting fallback');
    }

    // 2. If no profile exists, create one via the SECURITY DEFINER RPC
    if (!dbUser && authUser) {
      console.log('Auth: Creating profile via RPC');
      const meta = authUser.user_metadata || {};
      try {
        await (supabase.rpc as CallableFunction)('create_user_profile', {
          user_id: userId,
          user_name: (meta.name as string) || authUser.email?.split('@')[0] || 'User',
          user_email: authUser.email || '',
          user_provider: (authUser.app_metadata?.provider as string) || 'email',
          user_image: (meta.avatar_url as string) || (meta.picture as string) || null,
        });
        // Re-fetch after creation
        dbUser = await db.fetchById<Record<string, unknown>>('users', userId);
      } catch (rpcErr) {
        console.error('Auth: RPC create_user_profile failed', rpcErr);
      }
    }

    // 3. Return the best available user object
    if (dbUser) {
      return mapDbUserToUser(dbUser);
    }
    if (authUser) {
      return getFallbackUser(authUser);
    }
    return null;
  } catch (err) {
    console.error('Auth: Critical error loading profile', err);
    return authUser ? getFallbackUser(authUser) : null;
  }
}

// ────────────────────────────────────────────────────────────
// Context
// ────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ────────────────────────────────────────────────────────────
// Provider
// ────────────────────────────────────────────────────────────
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Debounce timer for auth state changes
  const authDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track pending profile loads to prevent race conditions
  const pendingProfileLoadRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const initAuth = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser && isMounted) {
          const profile = await loadUserProfile(authUser.id, authUser);
          if (isMounted) setUser(profile);
        }
      } catch (err) {
        console.error('Auth: Init failure', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      // Debounce auth events to prevent rapid state changes causing race conditions
      if (authDebounceRef.current) {
        clearTimeout(authDebounceRef.current);
      }

      authDebounceRef.current = setTimeout(async () => {
        if (!isMounted) return;

        console.log('Auth: Processing event', event);

        // Only handle SIGNED_IN and USER_UPDATED - skip TOKEN_REFRESHED to prevent unnecessary profile reloads
        if (event === 'SIGNED_OUT') {
          setUser(null);
        } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          // Only process SIGNED_IN and USER_UPDATED - these are meaningful user state changes
          if (session?.user && !pendingProfileLoadRef.current) {
            pendingProfileLoadRef.current = true;
            try {
              const profile = await loadUserProfile(session.user.id, session.user);
              if (isMounted) setUser(profile);
            } finally {
              pendingProfileLoadRef.current = false;
            }
          }
        } else if (event === 'TOKEN_REFRESHED') {
          // Token refreshed - don't reload profile, just keep current user
          // This prevents unnecessary DB calls and potential race conditions
          console.log('Auth: Token refreshed, preserving current user');
        }
        
        if (isMounted) setIsLoading(false);
      }, 300); // 300ms debounce delay

      // For SIGNED_OUT, process immediately without debounce
      if (event === 'SIGNED_OUT') {
        if (authDebounceRef.current) {
          clearTimeout(authDebounceRef.current);
        }
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      if (authDebounceRef.current) {
        clearTimeout(authDebounceRef.current);
      }
      subscription.unsubscribe();
    };
  }, []);

  // ── Auth Methods ──────────────────────────────────────────

  const login = async (userData: User) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Auth: Logout error', error);
      throw error;
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!user) throw new Error('No active session');
    try {
      const { data, error } = await (supabase
        .from('users') as ReturnType<typeof supabase.from>)
        .update(userData as Record<string, unknown>)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      if (data) setUser(mapDbUserToUser(data as Record<string, unknown>));
    } catch (error) {
      console.error('Auth: Update error', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      const msg = error.message.includes('Invalid login credentials')
        ? 'Invalid email or password.'
        : error.message;
      throw new Error(msg);
    }

    if (data.user) {
      const profile = await loadUserProfile(data.user.id, data.user);
      setUser(profile);
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    const trimmedEmail = email.trim().toLowerCase();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: { data: { name } },
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        throw new Error('An account with this email already exists. Please login instead.');
      }
      throw signUpError;
    }

    if (data.user) {
      // The DB trigger (Migration 024) handles profile creation automatically.
      // We also call the RPC for immediate consistency.
      try {
        await (supabase.rpc as CallableFunction)('create_user_profile', {
          user_id: data.user.id,
          user_name: name,
          user_email: trimmedEmail,
          user_provider: 'email',
          user_image: null,
        });
      } catch (rpcErr) {
        console.warn('Auth: Signup RPC failed (trigger should cover it)', rpcErr);
      }

      const profile = await loadUserProfile(data.user.id, data.user);
      setUser(profile);
    }
  };

  const signInWithGoogle = async (idToken: string) => {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });
    if (error) throw error;
    if (data.user) {
      const profile = await loadUserProfile(data.user.id, data.user);
      setUser(profile);
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  // ── Derived State ─────────────────────────────────────────

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isSuperAdmin = user?.role === 'superadmin';
  const isBoardMember = user?.role === 'board_member';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin,
        isSuperAdmin,
        isBoardMember,
        isLoading,
        login,
        logout,
        updateUser,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
