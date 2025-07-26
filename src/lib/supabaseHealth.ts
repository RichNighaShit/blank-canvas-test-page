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

    // Check 2: Database connectivity with reasonable timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // Increased to 8 seconds
    
    const { error: dbError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .abortSignal(controller.signal);
    
    clearTimeout(timeoutId);
    
    if (dbError) {
      // Handle AbortError specifically when it comes as a dbError
      if (dbError instanceof DOMException && dbError.name === 'AbortError') {
        return {
          healthy: false,
          details: 'Database connection timeout (8 seconds) - please check your internet connection',
          timestamp: new Date(),
          latency: Date.now() - startTime
        };
      }

      const errorMessage = getErrorMessage(dbError);
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
    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        healthy: false,
        details: 'Database connection timeout (8 seconds) - please check your internet connection',
        timestamp: new Date(),
        latency: Date.now() - startTime
      };
    }

    const errorMessage = getErrorMessage(error);
    return {
      healthy: false,
      details: `Unexpected error: ${errorMessage}`,
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
