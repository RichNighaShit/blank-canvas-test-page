
import { useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';

export function SafeToaster() {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // Small delay to ensure React context is fully initialized
    const timer = setTimeout(() => {
      setShouldRender(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  if (!shouldRender) {
    return null;
  }

  return <Toaster />;
}
