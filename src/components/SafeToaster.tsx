import React from 'react';
import { Toaster } from '@/components/ui/toaster';

export function SafeToaster() {
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    // Ensure React is fully initialized before rendering toast components
    setIsReady(true);
  }, []);

  // Don't render anything until React is ready
  if (!isReady) {
    return null;
  }

  return <Toaster />;
}