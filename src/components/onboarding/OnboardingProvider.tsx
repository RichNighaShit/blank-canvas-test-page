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
        title: 'Welcome to DripMuse! ✨',
        description: 'Ready to transform your style? Let\'s take a quick interactive tour to show you how your AI fashion stylist works. You can interact with everything you see!',
        position: 'center'
      },
      {
        id: 'dashboard-overview',
        title: 'Your Style Command Center',
        description: 'This is your personal dashboard where the magic happens. Here you\'ll find outfit recommendations, wardrobe insights, and style analytics—all powered by AI.',
        page: '/dashboard',
        position: 'center'
      },
      {
        id: 'wardrobe-setup',
        title: 'Click Here: Build Your Digital Wardrobe',
        description: 'Start by adding your clothes! Simply upload photos and our AI will analyze colors, styles, and create categories automatically. Click this button to try it!',
        targetSelector: '[data-tour="wardrobe-nav"]',
        position: 'bottom'
      },
      {
        id: 'color-palette',
        title: 'Discover Your Perfect Colors',
        description: 'Complete a quick color analysis to discover which colors make you look amazing. Our AI will analyze your skin tone and recommend your ideal palette.',
        targetSelector: '[data-tour="color-palette-nav"]',
        position: 'bottom'
      },
      {
        id: 'style-me',
        title: 'Get AI-Powered Outfit Ideas',
        description: 'Once you have some clothes uploaded, this is where you\'ll get personalized outfit recommendations based on the weather, your schedule, and your style preferences.',
        targetSelector: '[data-tour="style-me-nav"]',
        position: 'bottom'
      },
      {
        id: 'completion',
        title: 'Your Style Journey Begins Now! 🚀',
        description: 'You\'re all set to start using DripMuse! The more you interact with the app, the smarter your AI stylist becomes. Ready to build your perfect wardrobe?',
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

      // Add a small delay to ensure auth is fully established
      await new Promise(resolve => setTimeout(resolve, 100));

      try {
        // Check database for authoritative data with proper error handling
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
          // Handle other errors gracefully
          console.warn('Error checking onboarding status, using safe defaults:', error);
          // Default to showing terms for new users to be safe
          setIsFirstTimeUser(true);
          setNeedsTermsAcceptance(true);
          setTermsAccepted(false);
          setHasInitialized(true);
          return;
        }

        // Process successful response
        const hasAcceptedTerms = data?.terms_accepted && data?.privacy_accepted && data?.age_confirmed;
        const hasCompletedOnboarding = data?.onboarding_completed || data?.tutorial_skipped;

        setTermsAccepted(!!hasAcceptedTerms);
        setIsFirstTimeUser(!hasCompletedOnboarding);

        if (!hasAcceptedTerms) {
          setNeedsTermsAcceptance(true);
        } else if (!hasCompletedOnboarding) {
          setNeedsTermsAcceptance(false);
          // Delay starting onboarding to ensure UI is ready
          setTimeout(() => {
            startOnboarding('first-time-user');
          }, 1000);
        } else {
          setNeedsTermsAcceptance(false);
        }

        setHasInitialized(true);
      } catch (error) {
        console.warn('Exception in onboarding check, using safe defaults:', error);
        // Safe fallback - assume new user
        setIsFirstTimeUser(true);
        setNeedsTermsAcceptance(true);
        setTermsAccepted(false);
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
    if (!user) {
      console.warn('Cannot accept terms: no user available');
      return;
    }

    setTermsAccepted(true);
    setNeedsTermsAcceptance(false);

    try {
      // Save terms acceptance to database with timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database timeout')), 5000)
      );

      const dbPromise = supabase
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

      const { error } = await Promise.race([dbPromise, timeoutPromise]) as any;

      if (error) {
        console.warn('Error saving terms acceptance, continuing anyway:', error);
      }

      // Start onboarding tutorial ONLY if user is first-time
      if (isFirstTimeUser) {
        setTimeout(() => {
          startOnboarding('first-time-user');
        }, 800);
      }
    } catch (error) {
      console.warn('Database error during terms acceptance, continuing anyway:', error);
      // Continue with onboarding even if database fails
      if (isFirstTimeUser) {
        setTimeout(() => {
          startOnboarding('first-time-user');
        }, 800);
      }
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
