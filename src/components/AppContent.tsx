import React from 'react';
import { useOnboarding } from './onboarding/OnboardingProvider';
import { ProfessionalTutorialOverlay } from './onboarding/ProfessionalTutorialOverlay';
import { TermsAcceptanceModal } from './onboarding/TermsAcceptanceModal';

interface AppContentProps {
  children: React.ReactNode;
}

export const AppContent: React.FC<AppContentProps> = ({ children }) => {
  const { 
    needsTermsAcceptance, 
    acceptTerms, 
    declineTerms, 
    isActive: isOnboardingActive,
    termsAccepted 
  } = useOnboarding();

  return (
    <>
      {children}

      {/* Terms Acceptance Modal - shows ONLY when terms haven't been accepted */}
      {needsTermsAcceptance && !termsAccepted && (
        <TermsAcceptanceModal
          isOpen={true}
          onAccept={acceptTerms}
          onDecline={declineTerms}
        />
      )}

      {/* Tutorial Overlay - shows ONLY when terms are accepted AND onboarding is active */}
      {termsAccepted && !needsTermsAcceptance && isOnboardingActive && (
        <ProfessionalTutorialOverlay />
      )}
    </>
  );
};
