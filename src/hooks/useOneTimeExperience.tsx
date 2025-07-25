import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getErrorMessage, logError } from '@/lib/errorUtils';
import { supabaseWithRetry, getNetworkErrorMessage } from '@/lib/networkUtils';

interface OneTimeExperience {
  user_id: string;
  experience_id: string;
  completed_at: string;
  metadata?: any;
}

interface UseOneTimeExperienceReturn {
  hasSeenExperience: (experienceId: string) => boolean;
  markExperienceComplete: (experienceId: string, metadata?: any) => Promise<void>;
  isLoading: boolean;
}

/**
 * Hook to manage one-time user experiences like tutorials, welcome messages, etc.
 * Ensures users only see certain UI elements once per lifetime.
 */
export const useOneTimeExperience = (): UseOneTimeExperienceReturn => {
  const { user } = useAuth();
  const [experiences, setExperiences] = useState<OneTimeExperience[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load user's completed experiences with network retry
  useEffect(() => {
    const loadExperiences = async () => {
      if (!user) {
        setExperiences([]);
        setIsLoading(false);
        return;
      }

      try {
        const data = await supabaseWithRetry(
          () => supabase
            .from('user_one_time_experiences')
            .select('*')
            .eq('user_id', user.id),
          {
            retries: 2,
            timeout: 10000,
            onRetry: (attempt, error) => {
              const errorMsg = getNetworkErrorMessage(error);
              console.log(`Loading experiences failed (attempt ${attempt}): ${errorMsg}`);
            }
          }
        );

        setExperiences(data || []);
      } catch (error) {
        const errorMsg = getNetworkErrorMessage(error);
        console.error('Error loading one-time experiences:', errorMsg);
        // Set empty experiences for graceful fallback
        setExperiences([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadExperiences();
  }, [user]);

  const hasSeenExperience = (experienceId: string): boolean => {
    return experiences.some(exp => exp.experience_id === experienceId);
  };

  const markExperienceComplete = async (experienceId: string, metadata?: any): Promise<void> => {
    if (!user) return;

    try {
      await supabaseWithRetry(
        () => supabase
          .from('user_one_time_experiences')
          .upsert({
            user_id: user.id,
            experience_id: experienceId,
            completed_at: new Date().toISOString(),
            metadata: metadata || {}
          }, {
            onConflict: 'user_id,experience_id'
          }),
        {
          retries: 2,
          timeout: 8000,
          onRetry: (attempt, error) => {
            const errorMsg = getNetworkErrorMessage(error);
            console.log(`Marking experience complete failed (attempt ${attempt}): ${errorMsg}`);
          }
        }
      );

      // Update local state on success
      setExperiences(prev => {
        const existing = prev.find(exp => exp.experience_id === experienceId);
        if (existing) {
          return prev.map(exp =>
            exp.experience_id === experienceId
              ? { ...exp, completed_at: new Date().toISOString(), metadata: metadata || {} }
              : exp
          );
        } else {
          return [...prev, {
            user_id: user.id,
            experience_id: experienceId,
            completed_at: new Date().toISOString(),
            metadata: metadata || {}
          }];
        }
      });
    } catch (error) {
      const errorMsg = getNetworkErrorMessage(error);
      console.error('Error marking experience complete:', errorMsg);
    }
  };

  return {
    hasSeenExperience,
    markExperienceComplete,
    isLoading
  };
};

// Common experience IDs
export const EXPERIENCE_IDS = {
  WELCOME_TUTORIAL: 'welcome_tutorial',
  FIRST_WARDROBE_UPLOAD: 'first_wardrobe_upload', 
  FIRST_COLOR_ANALYSIS: 'first_color_analysis',
  FIRST_STYLE_RECOMMENDATION: 'first_style_recommendation',
  DASHBOARD_TOUR: 'dashboard_tour',
  WARDROBE_FEATURES_INTRO: 'wardrobe_features_intro',
  ANALYTICS_INTRO: 'analytics_intro'
} as const;
