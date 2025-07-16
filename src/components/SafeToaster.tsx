
import React from 'react';
import { Toaster } from '@/components/ui/toaster';

export function SafeToaster() {
  // Simple check - only render after a brief delay to ensure React is ready
  const [shouldRender, setShouldRender] = React.useState(false);

  React.useEffect(() => {
    // Delay rendering to ensure React context is fully initialized
    const timer = setTimeout(() => {
      setShouldRender(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (!shouldRender) {
    return null;
  }

  return <Toaster />;
}
