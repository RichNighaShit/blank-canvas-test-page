
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  location: string;
  culture: string;
  preferred_style: string;
  favorite_colors?: string[];
  goals?: string[];
  gender_identity?: string;
  face_photo_url?: string;
  // Add the missing properties that components expect
  style_preferences?: string[];
  preferred_colors?: string[];
  lifestyle?: string;
  budget_range?: string;
}

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching profile for user:', user.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found, create a basic one
          console.log('No profile found, creating basic profile');
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              user_id: user.id,
              display_name: user.email?.split('@')[0] || 'User',
              location: '',
              preferred_style: null,
              favorite_colors: [],
              goals: []
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating profile:', createError);
          } else {
            console.log('Created new profile:', newProfile);
            // Add default values for the expected properties
            const enhancedProfile = {
              ...newProfile,
              style_preferences: [],
              preferred_colors: [],
              lifestyle: '',
              budget_range: ''
            };
            setProfile(enhancedProfile);
          }
        } else {
          console.error('Error fetching profile:', error);
        }
      } else {
        console.log('Profile fetched successfully:', data);
        // Ensure all expected properties exist
        const enhancedProfile = {
          ...data,
          style_preferences: data.style_preferences || [],
          preferred_colors: data.preferred_colors || data.favorite_colors || [],
          lifestyle: data.lifestyle || '',
          budget_range: data.budget_range || ''
        };
        setProfile(enhancedProfile);
      }
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  return { profile, loading, refetch: fetchProfile };
};
