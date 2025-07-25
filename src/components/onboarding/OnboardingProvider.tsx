import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: () => void;
  condition?: () => boolean;
  page?: string;
}

export interface OnboardingFlow {
  id: string;
  name: string;
  steps: OnboardingStep[];
  condition?: () => boolean;
}

interface OnboardingContextType {
  isActive: boolean;
  currentFlow: OnboardingFlow | null;
  currentStepIndex: number;
  currentStep: OnboardingStep | null;
  totalSteps: number;
  isFirstTimeUser: boolean;
  needsTermsAcceptance: boolean;
  termsAccepted: boolean;
  startOnboarding: (flowId: string) => void;
  nextStep: () => void;
  previousStep: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  acceptTerms: () => void;
  declineTerms: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
};

// Define onboarding flows
const onboardingFlows: OnboardingFlow[] = [
  {
    id: 'first-time-user',
    name: 'Welcome to DripMuse',
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to DripMuse! 👋',
        description: 'Let\'s take a quick tour to get you started with your AI fashion stylist.',
        position: 'center'
      },
      {
        id: 'dashboard-overview',
        title: 'Your Dashboard',
        description: 'This is your style command center. Here you\'ll see outfit recommendations, wardrobe analytics, and quick actions.',
        page: '/dashboard',
        position: 'center'
      },
      {
        id: 'wardrobe-setup',
        title: 'Build Your Wardrobe',
        description: 'Add your clothing items here. Upload photos and our AI will automatically categorize and analyze them.',
        targetSelector: '[data-tour="wardrobe-nav"]',
        position: 'bottom',
        page: '/wardrobe'
      },
      {
        id: 'color-palette',
        title: 'Discover Your Colors',
        description: 'Complete your color analysis to get personalized recommendations that complement your skin tone.',
        targetSelector: '[data-tour="color-palette-nav"]',
        position: 'bottom',
        page: '/profile/palette'
      },
      {
        id: 'style-me',
        title: 'Get Styled',
        description: 'Once you\'ve added items, come here for AI-powered outfit recommendations based on weather, occasion, and your style.',
        targetSelector: '[data-tour="style-me-nav"]',
        position: 'bottom',
        page: '/recommendations'
      },
      {
        id: 'completion',
        title: 'You\'re All Set! 🎉',
        description: 'You\'re ready to start your style journey. Remember, the more you use DripMuse, the better it gets at understanding your preferences.',
        position: 'center'
      }
    ]
  }
];

interface OnboardingProviderProps {
  children: ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [currentFlow, setCurrentFlow] = useState<OnboardingFlow | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [needsTermsAcceptance, setNeedsTermsAcceptance] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Check user onboarding status from backend
  useEffect(() => {
    const checkUserOnboardingStatus = async () => {
      if (!user || hasInitialized) return;

      try {
        // Always check database first for authoritative data
        const { data, error } = await supabase
          .from('user_onboarding')
          .select('terms_accepted, privacy_accepted, age_confirmed, onboarding_completed, tutorial_skipped, completed_flows')
          .eq('user_id', user.id)
          .single();

        if (error && error.code === 'PGRST116') {
          // No record exists - this is a completely new user
          console.log('New user detected - no onboarding record');
          setIsFirstTimeUser(true);
          setNeedsTermsAcceptance(true);
          setTermsAccepted(false);
          setHasInitialized(true);
          return;
        }

        if (error) {
          console.error('Error checking onboarding status:', error);
          // Fallback to showing terms for safety
          setNeedsTermsAcceptance(true);
          setHasInitialized(true);
          return;
        }

        // Check if user has accepted all required terms
        const hasAcceptedTerms = data.terms_accepted && data.privacy_accepted && data.age_confirmed;
        const hasCompletedOnboarding = data.onboarding_completed || data.tutorial_skipped;

        setTermsAccepted(hasAcceptedTerms);
        setIsFirstTimeUser(!hasCompletedOnboarding);

        if (!hasAcceptedTerms) {
          // User hasn't accepted terms yet - show terms modal
          setNeedsTermsAcceptance(true);
        } else if (!hasCompletedOnboarding) {
          // User accepted terms but hasn't completed tutorial
          // Only start tutorial if terms modal is not showing
          setNeedsTermsAcceptance(false);
          setTimeout(() => {
            startOnboarding('first-time-user');
          }, 1000);
        } else {
          // User has completed everything
          setNeedsTermsAcceptance(false);
        }

        setHasInitialized(true);
      } catch (error) {
        console.error('Error in onboarding check:', error);
        // Safe fallback
        setNeedsTermsAcceptance(true);
        setHasInitialized(true);
      }
    };

    checkUserOnboardingStatus();
  }, [user, hasInitialized]);

  const startOnboarding = (flowId: string) => {
    const flow = onboardingFlows.find(f => f.id === flowId);
    if (!flow || !user || !termsAccepted || needsTermsAcceptance) {
      console.log('Cannot start onboarding: missing prerequisites', {
        hasFlow: !!flow,
        hasUser: !!user,
        termsAccepted,
        needsTermsAcceptance
      });
      return;
    }

    // Prevent starting if already active
    if (isActive) {
      console.log('Onboarding already active, skipping');
      return;
    }

    console.log('Starting onboarding flow:', flowId);
    setCurrentFlow(flow);
    setCurrentStepIndex(0);
    setIsActive(true);
  };

  const nextStep = () => {
    if (!currentFlow) return;

    if (currentStepIndex < currentFlow.steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      completeOnboarding();
    }
  };

  const previousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const skipOnboarding = async () => {
    if (!user) return;

    try {
      // Mark tutorial as skipped in database
      const { error } = await supabase
        .from('user_onboarding')
        .upsert({
          user_id: user.id,
          tutorial_skipped: true,
          onboarding_completed: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving tutorial skip:', error);
      }
    } catch (error) {
      console.error('Database error during tutorial skip:', error);
    }

    // Clear session flag
    sessionStorage.removeItem(`onboarding_session_${user.id}`);

    setIsActive(false);
    setCurrentFlow(null);
    setCurrentStepIndex(0);
    setIsFirstTimeUser(false);
  };

  const completeOnboarding = async () => {
    if (!currentFlow || !user) return;

    try {
      // Mark onboarding as completed in database
      const { error } = await supabase
        .from('user_onboarding')
        .upsert({
          user_id: user.id,
          onboarding_completed: true,
          completed_flows: [currentFlow.id],
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving onboarding completion:', error);
      }
    } catch (error) {
      console.error('Database error during onboarding completion:', error);
    }

    // Clear session flag
    sessionStorage.removeItem(`onboarding_session_${user.id}`);

    setIsActive(false);
    setCurrentFlow(null);
    setCurrentStepIndex(0);
    setIsFirstTimeUser(false);
  };



  const acceptTerms = async () => {
    if (!user) return;

    setTermsAccepted(true);
    setNeedsTermsAcceptance(false);

    try {
      // Save terms acceptance to database
      const { error } = await supabase
        .from('user_onboarding')
        .upsert({
          user_id: user.id,
          terms_accepted: true,
          privacy_accepted: true,
          age_confirmed: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving terms acceptance:', error);
      }

      // Start onboarding tutorial ONLY if user is first-time and terms modal is completely closed
      if (isFirstTimeUser) {
        setTimeout(() => {
          startOnboarding('first-time-user');
        }, 800); // Give time for modal to close
      }
    } catch (error) {
      console.error('Database error during terms acceptance:', error);
    }
  };

  const declineTerms = () => {
    // User declined terms - they can't use the app
    // Could redirect to a "terms required" page or sign them out
    setNeedsTermsAcceptance(true);
    // For now, just keep the modal open
  };

  const currentStep = currentFlow?.steps[currentStepIndex] || null;

  const contextValue: OnboardingContextType = {
    isActive,
    currentFlow,
    currentStepIndex,
    currentStep,
    totalSteps: currentFlow?.steps.length || 0,
    isFirstTimeUser,
    needsTermsAcceptance,
    termsAccepted,
    startOnboarding,
    nextStep,
    previousStep,
    skipOnboarding,
    completeOnboarding,
    acceptTerms,
    declineTerms
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
};
