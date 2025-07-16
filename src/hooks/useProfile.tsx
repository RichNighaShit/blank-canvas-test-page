
import React, { useState, useEffect } from 'react';
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
}

// Add a simple in-memory cache for profile by user id
const profileCache: { [userId: string]: Profile } = {};

export const useProfile = () => {
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const { user } = useAuth();

  const fetchProfile = React.useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    // Check cache first
    if (profileCache[user.id]) {
      setProfile(profileCache[user.id]);
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
            setProfile(newProfile);
            profileCache[user.id] = newProfile;
          }
        } else {
          console.error('Error fetching profile:', error);
        }
      } else {
        console.log('Profile fetched successfully:', data);
        setProfile(data);
        profileCache[user.id] = data;
      }
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, refetch: fetchProfile };
};
