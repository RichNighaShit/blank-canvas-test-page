
import React from 'react';
import { Toaster } from '@/components/ui/toaster';

export function SafeToaster() {
  // More comprehensive check for React readiness
  if (typeof React === 'undefined' || 
      typeof React.useState !== 'function' ||
      typeof React.useEffect !== 'function') {
    console.warn('React is not fully loaded, skipping Toaster render');
    return null;
  }

  // Additional check for React internals dispatcher
  try {
    const internals = (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
    if (!internals?.ReactCurrentDispatcher?.current) {
      console.warn('React dispatcher not ready, skipping Toaster render');
      return null;
    }
  } catch (error) {
    console.warn('Error checking React internals, skipping Toaster render');
    return null;
  }

  return <Toaster />;
}
