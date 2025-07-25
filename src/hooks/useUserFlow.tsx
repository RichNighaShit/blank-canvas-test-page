import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export interface UserFlowState {
  isLoading: boolean;
  needsAuth: boolean;
  needsTermsAcceptance: boolean;
  needsProfileCreation: boolean;
  needsOnboarding: boolean;
  canShowTutorial: boolean;
  currentStage: 'loading' | 'auth' | 'terms' | 'profile-check' | 'onboarding' | 'ready';
}

/**
 * Central user flow management hook
 * Determines what the user should see based on their authentication and profile state
 */
export const useUserFlow = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();
  
  const [flowState, setFlowState] = useState<UserFlowState>({
    isLoading: true,
    needsAuth: false,
    needsTermsAcceptance: false,
    needsProfileCreation: false,
    needsOnboarding: false,
    canShowTutorial: false,
    currentStage: 'loading'
  });

  // Check onboarding status from database
  const [onboardingStatus, setOnboardingStatus] = useState<{
    terms_accepted: boolean;
    privacy_accepted: boolean;
    age_confirmed: boolean;
    onboarding_completed: boolean;
    tutorial_skipped: boolean;
  } | null>(null);

  // Fetch onboarding status when user is available
  useEffect(() => {
    const fetchOnboardingStatus = async () => {
      if (!user) {
        setOnboardingStatus(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_onboarding')
          .select('terms_accepted, privacy_accepted, age_confirmed, onboarding_completed, tutorial_skipped')
          .eq('user_id', user.id)
          .single();

        if (error && error.code === 'PGRST116') {
          // No record exists - completely new user
          setOnboardingStatus({
            terms_accepted: false,
            privacy_accepted: false,
            age_confirmed: false,
            onboarding_completed: false,
            tutorial_skipped: false
          });
        } else if (!error && data) {
          setOnboardingStatus(data);
        } else {
          // Error fetching - assume new user for safety
          setOnboardingStatus({
            terms_accepted: false,
            privacy_accepted: false,
            age_confirmed: false,
            onboarding_completed: false,
            tutorial_skipped: false
          });
        }
      } catch (error) {
        console.error('Error fetching onboarding status:', error);
        // Fallback to new user state
        setOnboardingStatus({
          terms_accepted: false,
          privacy_accepted: false,
          age_confirmed: false,
          onboarding_completed: false,
          tutorial_skipped: false
        });
      }
    };

    fetchOnboardingStatus();
  }, [user]);

  // Determine flow state based on auth, profile, and onboarding status
  useEffect(() => {
    if (authLoading || profileLoading || !onboardingStatus) {
      setFlowState({
        isLoading: true,
        needsAuth: false,
        needsTermsAcceptance: false,
        needsProfileCreation: false,
        needsOnboarding: false,
        canShowTutorial: false,
        currentStage: 'loading'
      });
      return;
    }

    // Not authenticated
    if (!user) {
      setFlowState({
        isLoading: false,
        needsAuth: true,
        needsTermsAcceptance: false,
        needsProfileCreation: false,
        needsOnboarding: false,
        canShowTutorial: false,
        currentStage: 'auth'
      });
      return;
    }

    // Check terms acceptance
    const hasAcceptedTerms = onboardingStatus.terms_accepted && 
                            onboardingStatus.privacy_accepted && 
                            onboardingStatus.age_confirmed;

    if (!hasAcceptedTerms) {
      setFlowState({
        isLoading: false,
        needsAuth: false,
        needsTermsAcceptance: true,
        needsProfileCreation: false,
        needsOnboarding: false,
        canShowTutorial: false,
        currentStage: 'terms'
      });
      return;
    }

    // Check profile existence and completeness
    const isProfileComplete = profile && 
                              profile.display_name && 
                              profile.location && 
                              profile.culture && 
                              profile.preferred_style &&
                              profile.display_name.trim() !== '' &&
                              profile.location.trim() !== '' &&
                              profile.culture.trim() !== '' &&
                              profile.preferred_style.trim() !== '';

    if (!isProfileComplete) {
      setFlowState({
        isLoading: false,
        needsAuth: false,
        needsTermsAcceptance: false,
        needsProfileCreation: true,
        needsOnboarding: false,
        canShowTutorial: false,
        currentStage: 'onboarding'
      });
      return;
    }

    // Check tutorial/onboarding completion
    const hasCompletedOnboarding = onboardingStatus.onboarding_completed || onboardingStatus.tutorial_skipped;
    
    setFlowState({
      isLoading: false,
      needsAuth: false,
      needsTermsAcceptance: false,
      needsProfileCreation: false,
      needsOnboarding: false,
      canShowTutorial: !hasCompletedOnboarding,
      currentStage: 'ready'
    });

  }, [authLoading, profileLoading, user, profile, onboardingStatus]);

  // Navigation helpers
  const navigateToCorrectPage = (currentPath: string) => {
    if (flowState.isLoading) return;

    if (flowState.needsAuth && currentPath !== '/auth') {
      navigate('/auth');
    } else if (flowState.needsProfileCreation && currentPath !== '/onboarding') {
      navigate('/onboarding');
    } else if (flowState.currentStage === 'ready' && (currentPath === '/auth' || currentPath === '/onboarding')) {
      navigate('/dashboard');
    }
  };

  // Update onboarding status helpers
  const markTermsAccepted = async () => {
    if (!user) return;

    try {
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

      setOnboardingStatus(prev => prev ? {
        ...prev,
        terms_accepted: true,
        privacy_accepted: true,
        age_confirmed: true
      } : null);
    } catch (error) {
      console.error('Error updating terms acceptance:', error);
    }
  };

  const markOnboardingCompleted = async () => {
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

      setOnboardingStatus(prev => prev ? {
        ...prev,
        onboarding_completed: true
      } : null);
    } catch (error) {
      console.error('Error updating onboarding completion:', error);
    }
  };

  const markTutorialSkipped = async () => {
    if (!user) return;

    try {
      await supabase
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

      setOnboardingStatus(prev => prev ? {
        ...prev,
        tutorial_skipped: true,
        onboarding_completed: true
      } : null);
    } catch (error) {
      console.error('Error updating tutorial skip:', error);
    }
  };

  return {
    flowState,
    navigateToCorrectPage,
    markTermsAccepted,
    markOnboardingCompleted,
    markTutorialSkipped,
    refreshStatus: () => {
      // Force refresh by clearing onboarding status
      setOnboardingStatus(null);
    }
  };
};
