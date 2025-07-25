import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingContextType {
  // Core state
  needsTermsAcceptance: boolean;
  needsOnboarding: boolean;
  isLoading: boolean;
  
  // Actions
  acceptTerms: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  skipOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within CleanOnboardingProvider');
  }
  return context;
};

interface CleanOnboardingProviderProps {
  children: ReactNode;
}

export const CleanOnboardingProvider: React.FC<CleanOnboardingProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [needsTermsAcceptance, setNeedsTermsAcceptance] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check user status on auth change
  useEffect(() => {
    const checkUserStatus = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Check onboarding status
        const { data, error } = await supabase
          .from('user_onboarding')
          .select('terms_accepted, privacy_accepted, age_confirmed, onboarding_completed')
          .eq('user_id', user.id)
          .single();

        if (error && error.code === 'PGRST116') {
          // New user - needs everything
          setNeedsTermsAcceptance(true);
          setNeedsOnboarding(true);
        } else if (error) {
          // Error - assume new user to be safe
          setNeedsTermsAcceptance(true);
          setNeedsOnboarding(true);
        } else {
          // Existing user - check what they need
          const hasAcceptedTerms = data?.terms_accepted && data?.privacy_accepted && data?.age_confirmed;
          const hasCompletedOnboarding = data?.onboarding_completed;

          setNeedsTermsAcceptance(!hasAcceptedTerms);
          setNeedsOnboarding(hasAcceptedTerms && !hasCompletedOnboarding);
        }
      } catch (error) {
        console.error('Error checking user status:', error);
        // Safe fallback
        setNeedsTermsAcceptance(true);
        setNeedsOnboarding(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserStatus();
  }, [user]);

  const acceptTerms = async () => {
    if (!user) return;

    try {
      // Save to database
      await supabase
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

      // Create basic profile if it doesn't exist
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!existingProfile) {
        await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            display_name: user.email?.split('@')[0] || 'User',
            location: '',
            culture: '',
            preferred_style: ''
          });
      }

      setNeedsTermsAcceptance(false);
      setNeedsOnboarding(true);
    } catch (error) {
      console.error('Error accepting terms:', error);
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;

    try {
      await supabase
        .from('user_onboarding')
        .upsert({
          user_id: user.id,
          onboarding_completed: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      setNeedsOnboarding(false);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const skipOnboarding = async () => {
    if (!user) return;

    try {
      await supabase
        .from('user_onboarding')
        .upsert({
          user_id: user.id,
          onboarding_completed: true,
          tutorial_skipped: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      setNeedsOnboarding(false);
    } catch (error) {
      console.error('Error skipping onboarding:', error);
    }
  };

  return (
    <OnboardingContext.Provider value={{
      needsTermsAcceptance,
      needsOnboarding,
      isLoading,
      acceptTerms,
      completeOnboarding,
      skipOnboarding
    }}>
      {children}
    </OnboardingContext.Provider>
  );
};
