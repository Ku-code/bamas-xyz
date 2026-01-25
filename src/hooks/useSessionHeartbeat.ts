import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { isSupabaseConfigured } from '@/lib/supabase';

const HEARTBEAT_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Silently refreshes the Supabase session every 10 minutes while the user
 * is active in the dashboard. This extends the session life and prevents
 * "ghost logouts" when the JWT expires but the refresh token is still valid.
 * Must be used inside Dashboard (or any protected layout).
 */
export function useSessionHeartbeat() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const refresh = async () => {
      try {
        const { error } = await supabase.auth.refreshSession();
        if (error) {
          console.warn('[useSessionHeartbeat] refresh failed:', error.message);
        }
      } catch (e) {
        console.warn('[useSessionHeartbeat] refresh error:', e);
      }
    };

    refresh(); // run once on mount to extend session immediately
    intervalRef.current = setInterval(refresh, HEARTBEAT_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);
}
