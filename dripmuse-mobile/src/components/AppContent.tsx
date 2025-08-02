import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useOnboarding } from './onboarding/OnboardingProvider';
import { ProfessionalTutorialOverlay } from './onboarding/ProfessionalTutorialOverlay';
import { TermsAcceptanceModal } from './onboarding/TermsAcceptanceModal';
import { useUserFlow } from '@/hooks/useUserFlow';

interface AppContentProps {
  children: React.ReactNode;
}

export const AppContent: React.FC<AppContentProps> = ({ children }) => {
  const { flowState } = useUserFlow();
  const { acceptTerms, declineTerms, isActive: isOnboardingActive } = useOnboarding();

  // Remove automatic navigation - let route guards handle it

  return (
    <>
      {children}

      {/* Terms Acceptance Modal - shows for users who haven't accepted terms */}
      {flowState.needsTermsAcceptance && (
        <TermsAcceptanceModal
          isOpen={flowState.needsTermsAcceptance}
          onAccept={acceptTerms}
          onDecline={declineTerms}
        />
      )}

      {/* Tutorial Overlay - shows only when user is ready and tutorial is active */}
      {flowState.canShowTutorial && isOnboardingActive && (
        <ProfessionalTutorialOverlay />
      )}
    </>
  );
};
