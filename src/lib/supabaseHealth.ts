import { supabase } from '@/integrations/supabase/client';
import { getErrorMessage } from './errorUtils';

export interface HealthCheckResult {
  healthy: boolean;
  details: string;
  timestamp: Date;
  latency?: number;
}

export const checkSupabaseHealth = async (): Promise<HealthCheckResult> => {
  const startTime = Date.now();
  
  try {
    // Check 1: Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      return {
        healthy: false,
        details: `Authentication failed: ${authError.message}`,
        timestamp: new Date(),
        latency: Date.now() - startTime
      };
    }

    // Check 2: Database connectivity
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
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
          details: 'Database connection timeout (5 seconds) - please check your internet connection',
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
        details: 'Database connection timeout (5 seconds) - please check your internet connection',
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
