import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { db } from '@/lib/database';

export type UserRole = 'superadmin' | 'admin' | 'member';
export type MemberStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

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
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
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
  const [isLoading, setIsLoading] = useState(true);

  // Load user from Supabase on mount and listen for auth changes
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/50346ba1-6398-4d3a-b7ae-e83d28e057d9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:82',message:'AuthContext useEffect started',data:{isSupabaseConfigured:isSupabaseConfigured()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    // Only initialize Supabase if it's configured
    if (!isSupabaseConfigured()) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/50346ba1-6398-4d3a-b7ae-e83d28e057d9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:87',message:'Supabase not configured, setting isLoading=false',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      console.warn('⚠️ Supabase is not configured. Authentication features will not work.');
      setIsLoading(false);
      return;
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/50346ba1-6398-4d3a-b7ae-e83d28e057d9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:95',message:'Starting getSession with timeout',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    // Add timeout to prevent infinite loading
    const sessionTimeout = setTimeout(() => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/50346ba1-6398-4d3a-b7ae-e83d28e057d9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:100',message:'getSession timeout, forcing isLoading=false',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      console.warn('⚠️ Supabase session check timed out. Continuing without session.');
      setIsLoading(false);
    }, 10000); // 10 second timeout

    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        clearTimeout(sessionTimeout);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/50346ba1-6398-4d3a-b7ae-e83d28e057d9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:108',message:'getSession resolved',data:{hasSession:!!session,hasError:!!error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        if (error) {
          console.error('Error getting session:', error);
          setIsLoading(false);
          return;
        }
        if (session) {
          loadUserFromDatabase(session.user.id);
        } else {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/50346ba1-6398-4d3a-b7ae-e83d28e057d9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:118',message:'No session, setting isLoading=false',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          setIsLoading(false);
        }
      })
      .catch((error) => {
        clearTimeout(sessionTimeout);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/50346ba1-6398-4d3a-b7ae-e83d28e057d9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:124',message:'getSession rejected',data:{error:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        console.error('Failed to get session:', error);
        setIsLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await loadUserFromDatabase(session.user.id);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUserFromDatabase = async (userId: string) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/50346ba1-6398-4d3a-b7ae-e83d28e057d9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:133',message:'loadUserFromDatabase started',data:{userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    try {
      // Add timeout for database fetch
      const fetchPromise = db.fetchById('users', userId);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database fetch timeout')), 8000)
      );
      let dbUser = await Promise.race([fetchPromise, timeoutPromise]) as any;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/50346ba1-6398-4d3a-b7ae-e83d28e057d9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:140',message:'db.fetchById completed',data:{hasUser:!!dbUser},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      if (!dbUser) {
        // User doesn't exist in database yet - create it using the function
        // This can happen if signup was interrupted or email confirmation is pending
        const { data: authUser } = await supabase.auth.getUser();
        if (authUser?.user) {
          const userMetadata = authUser.user.user_metadata || {};
          const { error: functionError } = await (supabase.rpc as any)('create_user_profile', {
            user_id: userId,
            user_name: userMetadata.name || authUser.user.email?.split('@')[0] || 'User',
            user_email: authUser.user.email || '',
            user_provider: authUser.user.app_metadata?.provider || 'email',
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
        setUser(null);
      }
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/50346ba1-6398-4d3a-b7ae-e83d28e057d9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:177',message:'loadUserFromDatabase error',data:{error:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      console.error('Error loading user from database:', error);
      setUser(null);
    } finally {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/50346ba1-6398-4d3a-b7ae-e83d28e057d9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:182',message:'loadUserFromDatabase finally, isLoading=false',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
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
        await loadUserFromDatabase(data.user.id);
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

        // Wait a bit for the session to be established
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Try to load user from database
        await loadUserFromDatabase(data.user.id);
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
        }

        await loadUserFromDatabase(data.user.id);
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

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin,
        isSuperAdmin,
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
