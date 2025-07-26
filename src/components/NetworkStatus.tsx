import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getErrorMessage } from '@/lib/errorUtils';

export const NetworkStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [supabaseConnected, setSupabaseConnected] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  const checkSupabaseConnection = async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const { error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
        .abortSignal(controller.signal);
      
      clearTimeout(timeoutId);
      return !error;
    } catch (error) {
      console.warn('Supabase connection check failed:', error);
      return false;
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Recheck Supabase when coming back online
      checkSupabaseConnection().then(setSupabaseConnected);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSupabaseConnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check Supabase connection periodically
    const interval = setInterval(async () => {
      if (isOnline) {
        const connected = await checkSupabaseConnection();
        setSupabaseConnected(connected);
        setLastCheck(new Date());
      }
    }, 30000); // Check every 30 seconds

    // Initial check
    checkSupabaseConnection().then(setSupabaseConnected);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [isOnline]);

  if (!isOnline) {
    return (
      <Alert className="m-4 bg-red-50 border-red-200">
        <WifiOff className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>No internet connection</strong> - Working in offline mode. Some features may be limited.
        </AlertDescription>
      </Alert>
    );
  }

  if (!supabaseConnected) {
    return (
      <Alert className="m-4 bg-yellow-50 border-yellow-200">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <strong>Connection issues</strong> - Having trouble connecting to the server. Using cached data where available.
          <br />
          <small className="text-yellow-600">
            Last checked: {lastCheck.toLocaleTimeString()}
          </small>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

export default NetworkStatus;
