import React from 'react';
import { useOnboarding } from './onboarding/OnboardingProvider';
import { EnhancedOnboardingOverlay } from './onboarding/EnhancedOnboardingOverlay';
import { TermsAcceptanceModal } from './onboarding/TermsAcceptanceModal';

interface AppContentProps {
  children: React.ReactNode;
}

export const AppContent: React.FC<AppContentProps> = ({ children }) => {
  const { needsTermsAcceptance, acceptTerms, declineTerms } = useOnboarding();

  return (
    <>
      {children}
      
      {/* Terms Acceptance Modal - shows first for new users */}
      <TermsAcceptanceModal
        isOpen={needsTermsAcceptance}
        onAccept={acceptTerms}
        onDecline={declineTerms}
      />
      
      {/* Enhanced Onboarding Overlay - shows after terms acceptance */}
      <EnhancedOnboardingOverlay />
    </>
  );
};
