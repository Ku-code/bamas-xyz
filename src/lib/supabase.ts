import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create Supabase client with fallback values to prevent app crash
// The app will show appropriate errors if Supabase is not configured
let supabase: ReturnType<typeof createClient>;

try {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      '⚠️ Missing Supabase environment variables. Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
    );
    // Create a dummy client to prevent crashes - operations will fail gracefully
    supabase = createClient(
      'https://placeholder.supabase.co',
      'placeholder-key',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    );
  } else {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
        storageKey: 'sb-auth-token',
      },
    });
  }
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
  // Create a dummy client as fallback
  supabase = createClient(
    'https://placeholder.supabase.co',
    'placeholder-key',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}

export { supabase };

// Export URL for use in other modules
export const getSupabaseUrl = (): string => {
  return supabaseUrl;
};

// Helper to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey && 
    supabaseUrl !== 'https://placeholder.supabase.co' &&
    supabaseAnonKey !== 'placeholder-key');
};

// Database types (will be generated from Supabase later)
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          image: string | null;
          provider: 'google' | 'email' | null;
          bio: string | null;
          hashtags: string[] | null;
          location: string | null;
          website: string | null;
          phone: string | null;
          role: 'superadmin' | 'admin' | 'member' | 'board_member' | 'wg_lead';
          status: 'pending' | 'approved' | 'rejected' | 'suspended';
          created_at: string;
          updated_at: string | null;
          approved_at: string | null;
          approved_by: string | null;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
    };
  };
};

