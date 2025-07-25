import { supabase } from '@/integrations/supabase/client';
import { getErrorMessage } from './errorUtils';
import { withNetworkRetry, getNetworkErrorMessage } from './networkUtils';

export interface HealthCheckResult {
  healthy: boolean;
  details: string;
  timestamp: Date;
  latency?: number;
}

export const checkSupabaseHealth = async (): Promise<HealthCheckResult> => {
  const startTime = Date.now();
  
  try {
    // Check 1: Authentication with timeout
    const authController = new AbortController();
    const authTimeoutId = setTimeout(() => authController.abort(), 5000);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    clearTimeout(authTimeoutId);

    if (authError) {
      const errorMessage = getErrorMessage(authError);
      return {
        healthy: false,
        details: `Authentication failed: ${errorMessage}`,
        timestamp: new Date(),
        latency: Date.now() - startTime
      };
    }

    // Check 2: Database connectivity with network retry
    try {
      await withNetworkRetry(
        () => supabase
          .from('profiles')
          .select('count')
          .limit(1)
          .then(({ error }) => {
            if (error) throw error;
            return true;
          }),
        {
          retries: 1, // Only one retry for health check
          timeout: 8000
        }
      );
    } catch (dbError) {
      const errorMessage = getNetworkErrorMessage(dbError);
      return {
        healthy: false,
        details: `Database error: ${errorMessage}`,
        timestamp: new Date(),
        latency: Date.now() - startTime
      };
    }

    return {
      healthy: true,
      details: 'All systems operational',
      timestamp: new Date(),
      latency: Date.now() - startTime
    };
    
  } catch (error) {
    const errorMessage = getNetworkErrorMessage(error);
    return {
      healthy: false,
      details: `Health check failed: ${errorMessage}`,
      timestamp: new Date(),
      latency: Date.now() - startTime
    };
  }
};

// Helper to create a simple connectivity test
export const isSupabaseReachable = async (): Promise<boolean> => {
  const result = await checkSupabaseHealth();
  return result.healthy;
};
