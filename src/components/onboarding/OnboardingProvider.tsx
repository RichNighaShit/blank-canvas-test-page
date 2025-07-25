import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUserFlow } from '@/hooks/useUserFlow';

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
  // Tutorial-specific state
  isActive: boolean;
  currentFlow: OnboardingFlow | null;
  currentStepIndex: number;
  currentStep: OnboardingStep | null;
  totalSteps: number;

  // User flow state from centralized manager
  flowState: any;

  // Tutorial actions
  startOnboarding: (flowId: string) => void;
  nextStep: () => void;
  previousStep: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;

  // Terms and flow actions
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
  const { flowState, markTermsAccepted, markOnboardingCompleted, markTutorialSkipped } = useUserFlow();
  const [isActive, setIsActive] = useState(false);
  const [currentFlow, setCurrentFlow] = useState<OnboardingFlow | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [hasStartedTutorial, setHasStartedTutorial] = useState(false);

  // Auto-start tutorial when appropriate (only once per session)
  useEffect(() => {
    if (flowState.canShowTutorial && !isActive && !hasStartedTutorial && flowState.currentStage === 'ready') {
      // Delay starting tutorial to ensure UI is ready
      setTimeout(() => {
        setHasStartedTutorial(true);
        startOnboarding('first-time-user');
      }, 1000);
    }
  }, [flowState.canShowTutorial, flowState.currentStage, isActive, hasStartedTutorial]);

  const startOnboarding = (flowId: string) => {
    const flow = onboardingFlows.find(f => f.id === flowId);
    if (!flow || flowState.isLoading || !flowState.canShowTutorial) {
      console.log('Cannot start onboarding: missing prerequisites', {
        hasFlow: !!flow,
        isLoading: flowState.isLoading,
        canShowTutorial: flowState.canShowTutorial
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
    await markTutorialSkipped();
    setIsActive(false);
    setCurrentFlow(null);
    setCurrentStepIndex(0);
  };

  const completeOnboarding = async () => {
    if (!currentFlow) return;

    await markOnboardingCompleted();
    setIsActive(false);
    setCurrentFlow(null);
    setCurrentStepIndex(0);
  };



  const acceptTerms = async () => {
    await markTermsAccepted();
  };

  const declineTerms = () => {
    // User declined terms - they can't use the app
    // For now, just keep the modal open
    console.log('User declined terms');
  };

  const currentStep = currentFlow?.steps[currentStepIndex] || null;

  const contextValue: OnboardingContextType = {
    isActive,
    currentFlow,
    currentStepIndex,
    currentStep,
    totalSteps: currentFlow?.steps.length || 0,
    flowState,
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
