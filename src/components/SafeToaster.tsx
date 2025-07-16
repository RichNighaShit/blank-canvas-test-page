
import React from 'react';
import { Toaster } from '@/components/ui/toaster';

export function SafeToaster() {
  // Only render if React hooks are available
  if (typeof React === 'undefined' || !React.useState) {
    return null;
  }

  return <Toaster />;
}
