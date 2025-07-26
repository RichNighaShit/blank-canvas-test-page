import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

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

  // Load user's completed experiences
  useEffect(() => {
    const loadExperiences = async () => {
      if (!user) {
        setExperiences([]);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_one_time_experiences')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error loading one-time experiences:', error);
          setExperiences([]);
        } else {
          setExperiences(data || []);
        }
      } catch (error) {
        console.error('Unexpected error loading experiences:', error);
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
        console.error('Error marking experience complete:', error);
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
      console.error('Unexpected error marking experience complete:', error);
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
