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
  const { flowState, navigateToCorrectPage } = useUserFlow();
  const { acceptTerms, declineTerms, isActive: isOnboardingActive } = useOnboarding();
  const location = useLocation();

  // Auto-navigate to correct page based on flow state
  useEffect(() => {
    navigateToCorrectPage(location.pathname);
  }, [flowState, location.pathname]);

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
