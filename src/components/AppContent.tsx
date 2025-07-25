import React from 'react';
import { useOnboarding } from './onboarding/OnboardingProvider';
import { ProfessionalTutorialOverlay } from './onboarding/ProfessionalTutorialOverlay';
import { TermsAcceptanceModal } from './onboarding/TermsAcceptanceModal';

interface AppContentProps {
  children: React.ReactNode;
}

export const AppContent: React.FC<AppContentProps> = ({ children }) => {
  const { needsTermsAcceptance, acceptTerms, declineTerms, isActive: isOnboardingActive } = useOnboarding();

  return (
    <>
      {children}

      {/* Terms Acceptance Modal - shows first for new users */}
      {needsTermsAcceptance && (
        <TermsAcceptanceModal
          isOpen={needsTermsAcceptance}
          onAccept={acceptTerms}
          onDecline={declineTerms}
        />
      )}

      {/* Professional Tutorial Overlay - shows ONLY after terms acceptance and when not showing terms */}
      {!needsTermsAcceptance && isOnboardingActive && (
        <ProfessionalTutorialOverlay />
      )}
    </>
  );
};
