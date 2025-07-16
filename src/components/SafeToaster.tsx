
import React from 'react';
import { Toaster } from '@/components/ui/toaster';

export function SafeToaster() {
  // Only render if React hooks are available
  if (typeof React === 'undefined' || !React.useState) {
    return null;
  }

  // Additional safety check for the hook dispatcher
  try {
    React.useState(null);
  } catch (error) {
    console.warn('React hooks not ready, skipping Toaster render');
    return null;
  }

  return <Toaster />;
}
