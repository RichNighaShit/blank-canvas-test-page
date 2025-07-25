import React from 'react';
import { useOnboarding } from './onboarding/CleanOnboardingProvider';
import { CleanTermsModal } from './onboarding/CleanTermsModal';
import { CleanOnboardingTutorial } from './onboarding/CleanOnboardingTutorial';

interface CleanAppContentProps {
  children: React.ReactNode;
}

export const CleanAppContent: React.FC<CleanAppContentProps> = ({ children }) => {
  const { 
    needsTermsAcceptance, 
    needsOnboarding, 
    isLoading,
    acceptTerms, 
    completeOnboarding, 
    skipOnboarding 
  } = useOnboarding();

  // Show loading while checking user status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="flex flex-col items-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center animate-pulse">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-muted-foreground text-lg animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}

      {/* Terms Modal - First Priority */}
      <CleanTermsModal
        isOpen={needsTermsAcceptance}
        onAccept={acceptTerms}
      />

      {/* Onboarding Tutorial - Second Priority */}
      <CleanOnboardingTutorial
        isOpen={needsOnboarding}
        onComplete={completeOnboarding}
        onSkip={skipOnboarding}
      />
    </>
  );
};