import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Globe, AlertCircle } from 'lucide-react';
import { isRestrictiveEnvironment } from '@/lib/networkUtils';

export const NetworkHealthIndicator: React.FC = () => {
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'restricted'>('online');

  useEffect(() => {
    // Check if we're in a restrictive environment
    if (isRestrictiveEnvironment()) {
      setNetworkStatus('restricted');
      return;
    }

    // Monitor browser online/offline status
    const handleOnline = () => setNetworkStatus('online');
    const handleOffline = () => setNetworkStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial status
    setNetworkStatus(navigator.onLine ? 'online' : 'offline');

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Only show indicator when there are issues or in restricted environments
  if (networkStatus === 'online') return null;

  const getStatusConfig = () => {
    switch (networkStatus) {
      case 'offline':
        return {
          icon: WifiOff,
          text: 'Offline Mode',
          variant: 'destructive' as const,
          description: 'Using cached and simulated data'
        };
      case 'restricted':
        return {
          icon: Globe,
          text: 'Limited Mode',
          variant: 'secondary' as const,
          description: 'External APIs restricted - using simulated data'
        };
      default:
        return {
          icon: Wifi,
          text: 'Online',
          variant: 'default' as const,
          description: 'All services available'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Badge variant={config.variant} className="flex items-center gap-2 px-3 py-2">
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{config.text}</span>
      </Badge>
    </div>
  );
};

export default NetworkHealthIndicator;
