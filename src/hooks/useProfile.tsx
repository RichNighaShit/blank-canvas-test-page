import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  location: string;
  culture: string;
  preferred_style: string;
  favorite_colors?: string[];
  color_palette_colors?: string[];
  goals?: string[];
  gender_identity?: string;
  face_photo_url?: string;
  selected_palette_id?: string;
  color_season_analysis?: any;
}

// Add a simple in-memory cache for profile by user id with global invalidation
const profileCache: { [userId: string]: Profile } = {};
const profileCacheListeners: { [userId: string]: (() => void)[] } = {};

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Subscribe to global cache invalidation
  useEffect(() => {
    if (!user?.id) return;

    const updateProfile = () => {
      if (profileCache[user.id]) {
        setProfile(profileCache[user.id]);
      }
    };

    if (!profileCacheListeners[user.id]) {
      profileCacheListeners[user.id] = [];
    }
    profileCacheListeners[user.id].push(updateProfile);

    return () => {
      if (profileCacheListeners[user.id]) {
        profileCacheListeners[user.id] = profileCacheListeners[user.id].filter(fn => fn !== updateProfile);
      }
    };
  }, [user?.id]);

  const fetchProfile = async (forceRefresh = false) => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    // Check cache first, but skip if force refresh is requested
    if (!forceRefresh && profileCache[user.id]) {
      setProfile(profileCache[user.id]);
      setLoading(false);
      return;
    }

    try {
      console.log("Fetching profile for user:", user.id);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No profile found, create a basic one
          console.log("No profile found, creating basic profile");
          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert({
              user_id: user.id,
              display_name: user.email?.split("@")[0] || "User",
              location: "",
              preferred_style: null,
              favorite_colors: [],
              goals: [],
            })
            .select()
            .single();

          if (createError) {
            console.error("Error creating profile:", createError);
          } else {
            console.log("Created new profile:", newProfile);
            setProfile(newProfile);
            profileCache[user.id] = newProfile;
          }
        } else {
          console.error("Error fetching profile:", error);
        }
      } else {
        console.log("Profile fetched successfully:", data);
        setProfile(data);
        profileCache[user.id] = data;

        // Notify all listeners of the profile update
        if (profileCacheListeners[user.id]) {
          profileCacheListeners[user.id].forEach(fn => fn());
        }
      }
    } catch (error) {
      console.error("Unexpected error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const refetch = async () => {
    // Clear cache before refetching to ensure fresh data
    if (user?.id) {
      delete profileCache[user.id];
    }
    await fetchProfile(true);
  };

  return { profile, loading, refetch };
};

// Export global cache invalidation function
export const invalidateProfileCache = (userId: string) => {
  delete profileCache[userId];
  if (profileCacheListeners[userId]) {
    profileCacheListeners[userId].forEach(fn => fn());
  }
};

// Export function to clear all profile caches
export const clearAllProfileCaches = () => {
  Object.keys(profileCache).forEach(userId => {
    delete profileCache[userId];
    if (profileCacheListeners[userId]) {
      profileCacheListeners[userId].forEach(fn => fn());
    }
  });
};
