import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, isSupabaseConfigured, getSupabaseUrl } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { db } from '@/lib/database';

// CRITICAL: Fail-safe list of emails that are ALWAYS treated as superadmins
const SUPERADMIN_EMAILS = [
  'kuzodonchev@3dopendesign.com',
  'kuzodonchev@gmail.com',
  'info@bamas.xyz'
];

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

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isBoardMember: boolean;
  login: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const convertSupabaseUserToUser = (dbUser: any): User => {
  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    image: dbUser.image || undefined,
    provider: dbUser.provider || undefined,
    bio: dbUser.bio || undefined,
    hashtags: dbUser.hashtags || undefined,
    location: dbUser.location || undefined,
    website: dbUser.website || undefined,
    phone: dbUser.phone || undefined,
    role: dbUser.role || (SUPERADMIN_EMAILS.includes(dbUser.email) ? 'superadmin' : 'member'),
    status: dbUser.status || (SUPERADMIN_EMAILS.includes(dbUser.email) ? 'approved' : 'pending'),
    createdAt: dbUser.created_at,
    approvedAt: dbUser.approved_at || undefined,
    approvedBy: dbUser.approved_by || undefined,
  };
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      console.warn('⚠️ Supabase is not configured.');
      setIsLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        const { data: { user: authUser }, error } = await supabase.auth.getUser();
        if (authUser) {
          await loadUserFromDatabase(authUser.id, authUser);
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err);
        setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event change:', event);
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsLoading(false);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          await loadUserFromDatabase(session.user.id, session.user);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserFromDatabase = async (userId: string, authUser?: SupabaseUser) => {
    try {
      console.log('Fetching user profile for:', userId);
      const fetchPromise = db.fetchById('users', userId);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database fetch timeout')), 10000)
      );

      let dbUser = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (!dbUser && authUser) {
        console.log('User profile not found, attempting to create...');
        const userMetadata = authUser.user_metadata || {};
        const { error: functionError } = await supabase.rpc('create_user_profile', {
          user_id: userId,
          user_name: userMetadata.name || authUser.email?.split('@')[0] || 'User',
          user_email: authUser.email || '',
          user_provider: authUser.app_metadata?.provider || 'email',
          user_image: userMetadata.avatar_url || userMetadata.picture || null,
        } as any);

        if (!functionError) {
          dbUser = await db.fetchById('users', userId);
        }
      }

      if (dbUser) {
        setUser(convertSupabaseUserToUser(dbUser));
      } else if (authUser) {
        // Fallback
        const isHardcodedAdmin = authUser.email ? SUPERADMIN_EMAILS.includes(authUser.email) : false;
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
          role: isHardcodedAdmin ? 'superadmin' : 'member',
          status: isHardcodedAdmin ? 'approved' : 'pending',
          createdAt: authUser.created_at,
        });
      }
    } catch (error) {
      console.error('Error in loadUserFromDatabase:', error);
      if (!user) {
        const { data: { user: currentAuth } } = await supabase.auth.getUser();
        if (currentAuth) {
          const isHardcodedAdmin = currentAuth.email ? SUPERADMIN_EMAILS.includes(currentAuth.email) : false;
          setUser({
            id: currentAuth.id,
            email: currentAuth.email || '',
            name: currentAuth.user_metadata?.name || currentAuth.email?.split('@')[0] || 'User',
            role: isHardcodedAdmin ? 'superadmin' : 'member',
            status: isHardcodedAdmin ? 'approved' : 'pending',
            createdAt: currentAuth.created_at,
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData: User) => {
    // This function is mostly used for manual state setting, but we prefer loadUserFromDatabase
    setUser(userData);
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!user) throw new Error('No user logged in');
    try {
      const updated = await db.update('users', user.id, userData as any);
      setUser(convertSupabaseUserToUser(updated));
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      let message = error.message;
      if (message.includes('Invalid login credentials')) message = 'Invalid email or password.';
      throw new Error(message);
    }

    if (data.user) {
      await loadUserFromDatabase(data.user.id, data.user);
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    try {
      const trimmedEmail = email.trim().toLowerCase();

      // Check existing
      const { data: existingUser } = await (supabase.from('users') as any)
        .select('*')
        .eq('email', trimmedEmail)
        .maybeSingle();

      if (existingUser) {
        if (existingUser.status === 'rejected') {
          // Reactivate
          await (supabase.from('users') as any)
            .update({ status: 'pending', name, updated_at: new Date().toISOString() })
            .eq('id', existingUser.id);

          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password,
          });

          if (signInError) throw new Error('Correct credentials needed for reactivation.');
          if (signInData.user) await loadUserFromDatabase(signInData.user.id, signInData.user);
          return;
        } else {
          throw new Error('Account already exists. Please login.');
        }
      }

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: { data: { name } }
      });

      if (error) throw error;
      if (data.user) {
        await supabase.rpc('create_user_profile', {
          user_id: data.user.id,
          user_name: name,
          user_email: trimmedEmail,
          user_provider: 'email',
          user_image: null,
        } as any);
        await loadUserFromDatabase(data.user.id, data.user);
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      throw err;
    }
  };

  const signInWithGoogle = async (idToken: string) => {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) throw error;
    if (data.user) {
      await loadUserFromDatabase(data.user.id, data.user);
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

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
