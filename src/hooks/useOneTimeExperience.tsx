import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getErrorMessage, logError } from '@/lib/errorUtils';

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

  // Load user's completed experiences with retry logic
  useEffect(() => {
    const loadExperiences = async (retryCount = 0) => {
      if (!user) {
        setExperiences([]);
        setIsLoading(false);
        return;
      }

      try {
        // Add timeout for network requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const { data, error } = await supabase
          .from('user_one_time_experiences')
          .select('*')
          .eq('user_id', user.id)
          .abortSignal(controller.signal);

        clearTimeout(timeoutId);

        if (error) {
          // Check if this is a network error and retry
          if ((error.message?.includes('NetworkError') || error.message?.includes('Failed to fetch')) && retryCount < 2) {
            console.log(`Network error loading experiences, retrying... (${retryCount + 1}/2)`);
            setTimeout(() => loadExperiences(retryCount + 1), 2000);
            return;
          }

          logError(error, 'Error loading one-time experiences');
          // Set empty experiences for graceful fallback
          setExperiences([]);
        } else {
          setExperiences(data || []);
        }
      } catch (error) {
        // Handle AbortError and network errors
        if (error instanceof DOMException && error.name === 'AbortError') {
          if (retryCount < 2) {
            console.log(`Request timeout loading experiences, retrying... (${retryCount + 1}/2)`);
            setTimeout(() => loadExperiences(retryCount + 1), 1000);
            return;
          } else {
            console.error('Max retries reached for loading experiences');
          }
        } else if (error instanceof TypeError && error.message?.includes('NetworkError') && retryCount < 2) {
          console.log(`Network error loading experiences, retrying... (${retryCount + 1}/2)`);
          setTimeout(() => loadExperiences(retryCount + 1), 2000);
          return;
        }

        logError(error, 'Unexpected error loading experiences');
        // Set empty experiences for graceful fallback
        setExperiences([]);
      } finally {
        if (retryCount === 0) { // Only set loading to false on the initial call
          setIsLoading(false);
        }
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
      const { error } = await supabase
        .from('user_one_time_experiences')
        .upsert({
          user_id: user.id,
          experience_id: experienceId,
          completed_at: new Date().toISOString(),
          metadata: metadata || {}
        }, {
          onConflict: 'user_id,experience_id'
        });

      if (error) {
        logError(error, 'Error marking experience complete');
      } else {
        // Update local state
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
      }
    } catch (error) {
      logError(error, 'Unexpected error marking experience complete');
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
