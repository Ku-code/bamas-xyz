import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { isSupabaseConfigured } from '@/lib/supabase';

const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes - more frequent for better stability
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff: 1s, 2s, 4s

/**
 * Silently refreshes the Supabase session every 5 minutes while the user
 * is active in the dashboard. This extends the session life and prevents
 * "ghost logouts" when the JWT expires but the refresh token is still valid.
 * Includes retry logic with exponential backoff for network instability.
 * Must be used inside Dashboard (or any protected layout).
 */
export function useSessionHeartbeat() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const refreshWithRetry = async (retryCount = 0): Promise<boolean> => {
      try {
        const { error } = await supabase.auth.refreshSession();
        if (error) {
          if (retryCount < MAX_RETRIES - 1) {
            console.warn(`[useSessionHeartbeat] Refresh failed, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[retryCount]));
            return refreshWithRetry(retryCount + 1);
          }
          console.warn('[useSessionHeartbeat] Refresh failed after retries:', error.message);
          return false;
        }
        return true;
      } catch (e) {
        if (retryCount < MAX_RETRIES - 1) {
          console.warn(`[useSessionHeartbeat] Refresh error, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[retryCount]));
          return refreshWithRetry(retryCount + 1);
        }
        console.warn('[useSessionHeartbeat] Refresh error after retries:', e);
        return false;
      }
    };

    const refresh = async () => {
      await refreshWithRetry(0);
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
