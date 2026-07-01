import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

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
  /** True when the DB profile could not be loaded (timeout/error) and this is a
   *  degraded fallback. Status/role may be unknown — don't gate on them. */
  profileIncomplete?: boolean;
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
 * Creates a minimal User object from Supabase Auth metadata, used when the
 * database profile can't be loaded.
 *
 * @param degraded When true the DB errored/timed out (status unknown) — we mark
 *   the profile incomplete and leave status undefined so the UI shows a retry
 *   state instead of falsely claiming the user is "pending approval". When false
 *   the profile is genuinely missing (first login), so pending is correct.
 */
function getFallbackUser(authUser: SupabaseUser, degraded: boolean): User {
  const email = authUser.email?.toLowerCase() || '';
  const isHardcoded = SUPERADMIN_EMAILS.includes(email);
  const meta = authUser.user_metadata || {};
  console.warn('Auth: Using fallback user for', email, degraded ? '(degraded)' : '(new profile)');
  return {
    id: authUser.id,
    email: email,
    name: (meta.name as string) || (meta.full_name as string) || email.split('@')[0] || 'User',
    role: isHardcoded ? 'superadmin' : 'member',
    status: isHardcoded ? 'approved' : degraded ? undefined : 'pending',
    profileIncomplete: degraded && !isHardcoded,
    createdAt: authUser.created_at,
    provider: (authUser.app_metadata?.provider as 'google' | 'email') || 'email',
    image: (meta.avatar_url as string) || (meta.picture as string) || undefined,
  };
}

type ProfileFetch =
  | { kind: 'found'; row: Record<string, unknown> }
  | { kind: 'missing' }
  | { kind: 'error' };

/**
 * Fetches the user row, distinguishing "not found" from "error/timeout" so the
 * caller doesn't run the profile-creation RPC (which overwrites name/image)
 * just because a fetch was slow.
 */
async function fetchUserRow(userId: string): Promise<ProfileFetch> {
  try {
    const fetchPromise = supabase.from('users').select('*').eq('id', userId).maybeSingle();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('DB timeout')), DB_TIMEOUT_MS)
    );
    const { data, error } = (await Promise.race([fetchPromise, timeoutPromise])) as Awaited<typeof fetchPromise>;
    if (error) {
      console.warn('Auth: user row fetch error', error.message);
      return { kind: 'error' };
    }
    return data ? { kind: 'found', row: data as Record<string, unknown> } : { kind: 'missing' };
  } catch {
    console.warn('Auth: user row fetch slow/timed out');
    return { kind: 'error' };
  }
}

/**
 * Loads a user profile from the database. Retries once on transient error,
 * creates the profile via RPC only when it's genuinely missing, and returns a
 * degraded fallback (never a false "pending") if the DB stays unreachable.
 */
async function loadUserProfile(userId: string, authUser?: SupabaseUser | null): Promise<User | null> {
  try {
    // 1. Fetch, retrying once on a transient error/timeout.
    let result = await fetchUserRow(userId);
    if (result.kind === 'error') {
      result = await fetchUserRow(userId);
    }

    if (result.kind === 'found') {
      return mapDbUserToUser(result.row);
    }

    // 2. Profile genuinely missing (first login) -> create it via the RPC.
    if (result.kind === 'missing' && authUser) {
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
        const after = await fetchUserRow(userId);
        if (after.kind === 'found') return mapDbUserToUser(after.row);
      } catch (rpcErr) {
        console.error('Auth: RPC create_user_profile failed', rpcErr);
      }
    }

    // 3. Couldn't resolve from DB -> degraded fallback (status unknown on error).
    if (authUser) {
      return getFallbackUser(authUser, result.kind === 'error');
    }
    return null;
  } catch (err) {
    console.error('Auth: Critical error loading profile', err);
    return authUser ? getFallbackUser(authUser, true) : null;
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

    // Resolve the current session into a User profile and clear the loading
    // flag ONLY after the profile is actually set. supabase-js fires an
    // INITIAL_SESSION event on subscribe carrying the session restored from
    // storage, so we don't need a separate getUser() init (which caused a race
    // where isLoading flipped to false before the profile loaded, bouncing
    // authenticated users to /login on refresh).
    const resolveSession = async (session: Session | null) => {
      if (pendingProfileLoadRef.current) return;
      pendingProfileLoadRef.current = true;
      try {
        if (session?.user) {
          const profile = await loadUserProfile(session.user.id, session.user);
          if (isMounted) setUser(profile);
        } else if (isMounted) {
          setUser(null);
        }
      } finally {
        pendingProfileLoadRef.current = false;
        if (isMounted) setIsLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      console.log('Auth: Processing event', event);

      // SIGNED_OUT: clear immediately, no debounce.
      if (event === 'SIGNED_OUT') {
        if (authDebounceRef.current) clearTimeout(authDebounceRef.current);
        setUser(null);
        setIsLoading(false);
        return;
      }

      // TOKEN_REFRESHED: keep the current user; nothing to reload. Do NOT touch
      // isLoading here — INITIAL_SESSION is responsible for the initial resolve.
      if (event === 'TOKEN_REFRESHED') {
        console.log('Auth: Token refreshed, preserving current user');
        return;
      }

      // INITIAL_SESSION / SIGNED_IN / USER_UPDATED: (re)load the profile.
      // Debounced to coalesce the burst of events fired at startup/sign-in.
      if (authDebounceRef.current) clearTimeout(authDebounceRef.current);
      authDebounceRef.current = setTimeout(() => {
        if (isMounted) void resolveSession(session);
      }, 200);
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
