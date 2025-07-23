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
  startOnboarding: (flowId: string) => void;
  nextStep: () => void;
  previousStep: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  markAsExperienced: () => void;
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

  // Check if user is first-time user
  useEffect(() => {
    const checkFirstTimeUser = async () => {
      if (!user) return;

      try {
        // Check localStorage first (faster)
        const localFlag = localStorage.getItem(`onboarding_completed_${user.id}`);
        if (localFlag === 'true') {
          setIsFirstTimeUser(false);
          return;
        }

        // Check database
        const { data, error } = await supabase
          .from('user_onboarding' as any) // Use 'as any' to bypass TypeScript checks temporarily
          .select('completed_flows')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          // Check if it's a "table does not exist" error and handle gracefully
          if (error.message?.includes('relation "public.user_onboarding" does not exist')) {
            if (import.meta.env.DEV) {
              console.warn('Onboarding table not created yet. Using localStorage-only mode.');
            }
            // Assume first-time user and start onboarding
            setIsFirstTimeUser(true);
            setTimeout(() => {
              startOnboarding('first-time-user');
            }, 1000);
            return;
          }
          console.error('Error checking onboarding status:', error.message || JSON.stringify(error));
          return;
        }

        const hasCompletedFirstTime = data?.completed_flows?.includes('first-time-user');
        setIsFirstTimeUser(!hasCompletedFirstTime);

        // Start onboarding for first-time users
        if (!hasCompletedFirstTime) {
          setTimeout(() => {
            startOnboarding('first-time-user');
          }, 1000); // Delay to let page load
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        // Check if it's a "table does not exist" error
        if (errorMessage.includes('relation "public.user_onboarding" does not exist')) {
          if (import.meta.env.DEV) {
            console.warn('Onboarding table not created yet. Using localStorage-only mode.');
          }
        } else {
          // Log other errors normally
          console.error('Error checking first-time user status:', errorMessage);
        }

        // If database check fails, assume first-time user for better UX
        setIsFirstTimeUser(true);
        setTimeout(() => {
          startOnboarding('first-time-user');
        }, 1000);
      }
    };

    checkFirstTimeUser();
  }, [user]);

  const startOnboarding = (flowId: string) => {
    const flow = onboardingFlows.find(f => f.id === flowId);
    if (!flow) return;

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

  const skipOnboarding = () => {
    setIsActive(false);
    setCurrentFlow(null);
    setCurrentStepIndex(0);
    markAsExperienced();
  };

  const completeOnboarding = async () => {
    if (!currentFlow || !user) return;

    try {
      // Try to save to database, but don't fail if table doesn't exist
      const { error } = await supabase
        .from('user_onboarding' as any) // Use 'as any' to bypass TypeScript checks temporarily
        .upsert({
          user_id: user.id,
          completed_flows: [currentFlow.id],
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        if (error.message?.includes('relation "user_onboarding" does not exist')) {
          if (import.meta.env.DEV) {
            console.warn('Onboarding table not set up yet. Using localStorage only.');
          }
        } else {
          console.error('Error saving onboarding completion:', error.message || JSON.stringify(error));
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Database unavailable for onboarding. Using localStorage only.',
          error instanceof Error ? error.message : String(error));
      }
    }

    // Always save to localStorage as backup
    localStorage.setItem(`onboarding_completed_${user.id}`, 'true');

    setIsActive(false);
    setCurrentFlow(null);
    setCurrentStepIndex(0);
    setIsFirstTimeUser(false);
  };

  const markAsExperienced = async () => {
    if (!user) return;

    // Always save to localStorage first
    localStorage.setItem(`onboarding_completed_${user.id}`, 'true');

    try {
      // Try to save to database if available
      await supabase
        .from('user_onboarding' as any) // Use 'as any' to bypass TypeScript checks temporarily
        .upsert({
          user_id: user.id,
          completed_flows: ['first-time-user'],
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
    } catch (error) {
      // Silently fail if database is not available - localStorage is sufficient
      if (import.meta.env.DEV) {
        console.warn('Database unavailable for onboarding persistence. Using localStorage only.');
      }
    }

    setIsFirstTimeUser(false);
  };

  const currentStep = currentFlow?.steps[currentStepIndex] || null;

  const contextValue: OnboardingContextType = {
    isActive,
    currentFlow,
    currentStepIndex,
    currentStep,
    totalSteps: currentFlow?.steps.length || 0,
    isFirstTimeUser,
    startOnboarding,
    nextStep,
    previousStep,
    skipOnboarding,
    completeOnboarding,
    markAsExperienced
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
    </OnboardingContext.Provider>
  );
};
