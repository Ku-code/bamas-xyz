import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, isSupabaseConfigured, getSupabaseUrl } from '@/lib/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { db } from '@/lib/database';

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
  // Billing fields
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

// Helper function to convert Supabase user to our User type
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
    role: dbUser.role || 'member',
    status: dbUser.status || 'pending',
    createdAt: dbUser.created_at,
    approvedAt: dbUser.approved_at || undefined,
    approvedBy: dbUser.approved_by || undefined,
  };
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  // Start with isLoading=false to avoid blocking initial render
  const [isLoading, setIsLoading] = useState(false);

  // Load user from Supabase on mount and listen for auth changes
  useEffect(() => {
    // Only initialize Supabase if it's configured
    if (!isSupabaseConfigured()) {
      console.warn('⚠️ Supabase is not configured. Authentication features will not work.');
      return;
    }

    // Defer session check to avoid blocking initial render
    const deferSessionCheck = (callback: () => void) => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(callback, { timeout: 2000 });
      } else {
        setTimeout(callback, 0);
      }
    };

    deferSessionCheck(() => {
      // Add timeout to prevent infinite loading
      const sessionTimeout = setTimeout(() => {
        console.warn('⚠️ Supabase session check timed out. Continuing without session.');
        setIsLoading(false);
      }, 10000);

      // Use getUser() to validate session server-side and refresh token if needed.
      // getSession() can return stale cached data; getUser() forces a check and prevents
      // "sudden logout" when the JWT is expired but refresh token is still valid.
      supabase.auth.getUser()
        .then(({ data: { user: authUser }, error }) => {
          clearTimeout(sessionTimeout);
          if (error) {
            console.error('Error getting user (session):', error);
            setIsLoading(false);
            return;
          }
          if (authUser) {
            loadUserFromDatabase(authUser.id, authUser);
          } else {
            setIsLoading(false);
          }
        })
        .catch((error) => {
          clearTimeout(sessionTimeout);
          console.error('Failed to get user (session):', error);
          setIsLoading(false);
        });
    });

    // Listen for auth changes. Only clear user on explicit SIGNED_OUT to prevent
    // "Hero section kicks" during TOKEN_REFRESHED or other transient null sessions.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsLoading(false);
        return;
      }
      if (session) {
        await loadUserFromDatabase(session.user.id, session.user);
      }
      // Do NOT setUser(null) when session is null but event is not SIGNED_OUT
      // (e.g. during TOKEN_REFRESHED or INITIAL_SESSION) to avoid false logouts.
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUserFromDatabase = async (userId: string, authUser?: SupabaseUser) => {
    try {
      // Add timeout for database fetch
      const fetchPromise = db.fetchById('users', userId);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database fetch timeout')), 8000)
      );
      let dbUser = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (!dbUser) {
        // User doesn't exist in database yet - try to create it using the function
        // Use provided authUser or fetch it if missing
        const currentAuthUser = authUser || (await supabase.auth.getUser()).data.user;

        if (currentAuthUser) {
          const userMetadata = currentAuthUser.user_metadata || {};
          const { error: functionError } = await (supabase.rpc as any)('create_user_profile', {
            user_id: userId,
            user_name: userMetadata.name || currentAuthUser.email?.split('@')[0] || 'User',
            user_email: currentAuthUser.email || '',
            user_provider: currentAuthUser.app_metadata?.provider || 'email',
            user_image: userMetadata.avatar_url || userMetadata.picture || null,
          });

          if (!functionError) {
            // Retry fetching the user
            dbUser = await db.fetchById('users', userId);
          }
        }
      }

      if (dbUser) {
        setUser(convertSupabaseUserToUser(dbUser));
      } else {
        console.warn('User not found in database:', userId);
        // If we have a valid auth user but no DB profile, don't kick them out.
        // Create a temporary user object from auth data
        const fallbackUser = authUser || (await supabase.auth.getUser()).data.user;
        if (fallbackUser) {
          console.log('Using fallback auth user data');
          setUser({
            id: fallbackUser.id,
            email: fallbackUser.email || '',
            name: fallbackUser.user_metadata?.name || fallbackUser.email?.split('@')[0] || 'User',
            role: 'member', // Default safe role
            status: 'pending',
            createdAt: fallbackUser.created_at,
          });
        } else {
          // Only set to null if we absolutely cannot establish identity
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Error loading user from database:', error);

      // CRITICAL FIX: Do not log out the user on transient DB errors!
      // If we already have a user in state, keep it.
      // If we have an authUser, use it as fallback.

      if (user && user.id === userId) {
        console.log('Keeping existing user state despite DB error');
        // Do nothing, keep existing user
      } else if (authUser) {
        console.log('Constructing fallback user from auth session despite DB error');
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
          role: 'member',
          status: 'pending',
          createdAt: authUser.created_at,
        });
      } else {
        // Only if we have NO state and NO session info do we reset
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const checkIfFirstUser = async (): Promise<boolean> => {
    try {
      const users = await db.fetchAll('users');
      return users.length === 0;
    } catch (error) {
      console.error('Error checking if first user:', error);
      return false;
    }
  };

  const login = async (userData: User) => {
    try {
      // Check if user exists in database
      let dbUser;
      try {
        dbUser = await db.fetchById('users', userData.id);
      } catch (error) {
        // User doesn't exist, will create below
        dbUser = null;
      }

      if (dbUser) {
        // Existing user - update with latest data and load
        const updated = await db.update('users', userData.id, {
          name: userData.name,
          email: userData.email,
          image: userData.image,
          provider: userData.provider,
        });
        setUser(convertSupabaseUserToUser(updated));
      } else {
        // New user - use database function to create profile (bypasses RLS)
        const { error: functionError } = await (supabase.rpc as any)('create_user_profile', {
          user_id: userData.id,
          user_name: userData.name,
          user_email: userData.email,
          user_provider: userData.provider || null,
          user_image: userData.image || null,
        });

        if (functionError) {
          console.error('Error creating user profile:', functionError);
          throw functionError;
        }

        // Reload user from database
        const newUser = await db.fetchById('users', userData.id);
        if (newUser) {
          setUser(convertSupabaseUserToUser(newUser));
        }
      }
    } catch (error) {
      console.error('Error in login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!user) throw new Error('No user logged in');

    try {
      const updates: any = {};
      if (userData.name !== undefined) updates.name = userData.name;
      if (userData.email !== undefined) updates.email = userData.email;
      if (userData.image !== undefined) updates.image = userData.image || null;
      if (userData.bio !== undefined) updates.bio = userData.bio || null;
      if (userData.hashtags !== undefined) updates.hashtags = userData.hashtags || null;
      if (userData.location !== undefined) updates.location = userData.location || null;
      if (userData.website !== undefined) updates.website = userData.website || null;
      if (userData.phone !== undefined) updates.phone = userData.phone || null;

      const updated = await db.update('users', user.id, updates);
      setUser(convertSupabaseUserToUser(updated));
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      // Trim email to avoid whitespace issues
      const trimmedEmail = email.trim().toLowerCase();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        console.error('Supabase login error:', error);

        // Create user-friendly error message
        let errorMessage = 'Invalid email or password. Please check your credentials and try again.';

        if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
          errorMessage = 'Please confirm your email address before logging in. Check your inbox for the confirmation link from Supabase.';
        } else if (error.message.includes('Invalid login credentials') ||
          error.message.includes('invalid_credentials') ||
          error.message.includes('Invalid login')) {
          errorMessage = 'Invalid email or password. Please check your credentials. If you forgot your password, please reset it.';
        } else if (error.message) {
          errorMessage = error.message;
        }

        const authError = new Error(errorMessage);
        (authError as any).code = error.code;
        throw authError;
      }

      if (data.user) {
        // Ensure user profile exists in database
        await loadUserFromDatabase(data.user.id, data.user);
      } else {
        throw new Error('Login failed: No user data returned');
      }
    } catch (error: any) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error resetting password:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    try {
      // First, check if a user with this email already exists and was rejected
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('id, status, email')
        .eq('email', email.trim().toLowerCase())
        .limit(1) as any;

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 = not found, which is fine
        console.error('Error checking for existing user:', checkError);
      }

      // If user exists and was rejected, reset them to pending
      if (existingUsers && existingUsers.length > 0) {
        const existingUser = existingUsers[0];

        if (existingUser.status === 'rejected') {
          console.log('User was previously rejected. Resetting to pending status...');

          // Update their status back to pending and update their name
          const { error: updateError } = await supabase
            .from('users')
            .update({
              status: 'pending',
              name: name,
              approved_at: null,
              approved_by: null,
              updated_at: new Date().toISOString(),
            } as any)
            .eq('id', existingUser.id);

          if (updateError) {
            console.error('Error updating rejected user:', updateError);
            throw new Error('Failed to reactivate your account. Please contact support.');
          }

          // Now sign them in with their existing account
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
          });

          if (signInError) {
            // If password doesn't work, they need to reset it
            if (signInError.message.includes('Invalid') || signInError.message.includes('credentials')) {
              throw new Error('Your account has been reactivated, but the password is incorrect. Please use "Forgot Password" to reset your password.');
            }
            throw signInError;
          }

          if (signInData.user) {
            await loadUserFromDatabase(signInData.user.id, signInData.user);
          }

          return;
        } else if (existingUser.status === 'pending' || existingUser.status === 'approved') {
          // User already exists and is not rejected - they should login instead
          throw new Error('An account with this email already exists. Please login instead.');
        }
      }

      // Normal signup flow for new users
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Use database function to create user profile (bypasses RLS)
        const { data: userId, error: functionError } = await (supabase.rpc as any)('create_user_profile', {
          user_id: data.user.id,
          user_name: name,
          user_email: email,
          user_provider: 'email',
          user_image: null,
        });

        if (functionError) {
          console.error('Error creating user profile:', functionError);
          throw functionError;
        }

        // Send welcome email via Edge Function (non-blocking)
        try {
          const supabaseUrl = getSupabaseUrl();
          const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

          if (supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co' && supabaseAnonKey) {
            const edgeFunctionUrl = `${supabaseUrl}/functions/v1/send-welcome-email`;

            // Call Edge Function asynchronously (don't wait for response)
            fetch(edgeFunctionUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`,
              },
              body: JSON.stringify({
                email: email,
                name: name,
                user_id: data.user.id,
              }),
            }).catch((error) => {
              // Don't fail registration if email fails
              console.warn('Failed to send welcome email (non-critical):', error);
            });
          }
        } catch (emailError) {
          // Don't fail registration if email fails
          console.warn('Welcome email error (non-critical):', emailError);
        }

        // Wait a bit for the session to be established
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Try to load user from database
        await loadUserFromDatabase(data.user.id, data.user);
      }
    } catch (error: any) {
      console.error('Error signing up with email:', error);
      throw error;
    }
  };

  const signInWithGoogle = async (idToken: string) => {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured. Please check your environment variables.');
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) {
        console.error('Google OAuth error:', error);

        // Provide user-friendly error messages
        let errorMessage = 'Failed to sign in with Google. Please try again.';

        if (error.message.includes('provider_disabled') || error.message.includes('Provider not enabled')) {
          errorMessage = 'Google authentication is not enabled. Please contact the administrator or use email/password login.';
        } else if (error.message.includes('invalid_token') || error.message.includes('Invalid token')) {
          errorMessage = 'Invalid Google authentication token. Please try again.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.message) {
          errorMessage = error.message;
        }

        const authError = new Error(errorMessage);
        (authError as any).code = error.code;
        throw authError;
      }

      if (data.user) {
        // Check if user exists in database, if not create
        let dbUser;
        try {
          dbUser = await db.fetchById('users', data.user.id);
        } catch (error) {
          dbUser = null;
        }

        if (!dbUser) {
          // Use database function to create user profile (bypasses RLS)
          const userMetadata = data.user.user_metadata || {};
          const { error: functionError } = await (supabase.rpc as any)('create_user_profile', {
            user_id: data.user.id,
            user_name: userMetadata.name || userMetadata.full_name || data.user.email?.split('@')[0] || 'User',
            user_email: data.user.email || '',
            user_provider: 'google',
            user_image: userMetadata.avatar_url || userMetadata.picture || null,
          });

          if (functionError) {
            console.error('Error creating user profile:', functionError);
            throw functionError;
          }
        } else if (dbUser.status === 'rejected') {
          // If user was previously rejected, reset them to pending
          console.log('Google OAuth: User was previously rejected. Resetting to pending status...');

          const { error: updateError } = await supabase
            .from('users')
            .update({
              status: 'pending',
              approved_at: null,
              approved_by: null,
              updated_at: new Date().toISOString(),
            } as any)
            .eq('id', dbUser.id);

          if (updateError) {
            console.error('Error updating rejected Google user:', updateError);
            throw new Error('Failed to reactivate your account. Please contact support.');
          }
        }

        await loadUserFromDatabase(data.user.id, data.user);
      }
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
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
