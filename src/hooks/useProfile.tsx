import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { checkSupabaseHealth } from "@/lib/supabaseHealth";
import { logError } from "@/lib/errorLogger";
import { getErrorMessage, logError as logErrorWithMessage } from "@/lib/errorUtils";

// Test basic Supabase connectivity with detailed diagnostics
const testConnection = async (): Promise<{ connected: boolean; details: string }> => {
  try {
    console.log('Testing Supabase connection...');

    // Test 1: Check auth status
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      return { connected: false, details: `Auth error: ${authError.message}` };
    }
    if (!user) {
      return { connected: false, details: 'User not authenticated' };
    }
    console.log('✓ Auth check passed, user ID:', user.id);

    // Test 2: Simple query with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);

    if (error) {
      return { connected: false, details: `Query error: ${error.message}` };
    }

    console.log('✓ Database connection successful');
    return { connected: true, details: 'Connection successful' };

  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { connected: false, details: 'Connection timeout (5s)' };
    }
    return { connected: false, details: `Connection test failed: ${error}` };
  }
};

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
  const [retryCount, setRetryCount] = useState(0);
  const [isOffline, setIsOffline] = useState(false);
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

      // Run connection diagnostics first
      const healthCheck = await checkSupabaseHealth();
      console.log('Supabase health check:', healthCheck);

      if (!healthCheck.healthy) {
        console.error('Health check failed:', healthCheck.details);
        setIsOffline(true);

        // Try to load from localStorage as fallback
        const localProfile = localStorage.getItem(`profile_${user.id}`);
        if (localProfile) {
          try {
            const parsedProfile = JSON.parse(localProfile);
            console.log('✓ Loaded profile from localStorage cache');
            setProfile(parsedProfile);
            profileCache[user.id] = parsedProfile;
            setLoading(false);
            return;
          } catch (parseError) {
            console.error('Failed to parse cached profile:', parseError);
          }
        }

        // If no cache available, create a basic offline profile
        const offlineProfile: Profile = {
          id: 'offline',
          user_id: user.id,
          display_name: user.email?.split('@')[0] || 'User',
          location: '',
          culture: '',
          preferred_style: '',
        };

        console.log('Created offline profile');
        setProfile(offlineProfile);
        setLoading(false);
        return;
      }

      setIsOffline(false);

      // Add timeout and better error handling - generous timeout to prevent abort errors
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      // Start with a minimal query to test basic connectivity
      console.log('Attempting minimal profile query first...');
      let { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, display_name")
        .eq("user_id", user.id)
        .single()
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      // If minimal query succeeds, try to get more fields
      if (!error && data) {
        console.log('✓ Minimal query successful, fetching full profile...');
        const fullResult = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        // Use full data if available, otherwise stick with minimal
        if (!fullResult.error && fullResult.data) {
          data = fullResult.data;
        }
      }

      if (error) {
        if (error.code === "PGRST116") {
          // No profile found, create a basic one
          console.log("No profile found, creating basic profile");
          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert({
              user_id: user.id,
              display_name: user.email?.split("@")[0] || "User",
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
          const errorMessage = getErrorMessage(error);
          console.error("Error details:", errorMessage);

          // Check for specific network errors
          if (error.message && error.message.includes('NetworkError')) {
            console.error("Network connectivity issue detected. Checking connection...");
            // Try a simple health check
            try {
              const response = await fetch('https://dskruszbxlndmnhwcudx.supabase.co/health', {
                method: 'GET',
                mode: 'no-cors'
              });
              console.log("Supabase health check status:", response.status);
            } catch (healthError) {
              console.error("Health check failed:", healthError);
            }
          }
        }
      } else {
        console.log("Profile fetched successfully:", data);
        setProfile(data);
        profileCache[user.id] = data;

        // Save to localStorage for offline fallback
        try {
          localStorage.setItem(`profile_${user.id}`, JSON.stringify(data));
        } catch (storageError) {
          console.warn('Failed to save profile to localStorage:', storageError);
        }

        // Notify all listeners of the profile update
        if (profileCacheListeners[user.id]) {
          profileCacheListeners[user.id].forEach(fn => fn());
        }
      }
    } catch (error) {
      console.error("Unexpected error fetching profile:", error);
      const errorMessage = getErrorMessage(error);
      console.error("Unexpected error details:", errorMessage);

      // Log the error with context
      logError(error, {
        action: 'fetchProfile',
        userId: user.id,
        retryCount,
        forceRefresh,
        userAgent: navigator.userAgent,
        online: navigator.onLine
      });

      // Handle specific error types with retry logic
      if (error instanceof TypeError && error.message.includes('NetworkError')) {
        console.error("Network error detected - possible connectivity issue");
        if (retryCount < 2) {
          console.log(`Retrying in 2 seconds... (attempt ${retryCount + 1}/2)`);
          setRetryCount(prev => prev + 1);
          setTimeout(() => {
            fetchProfile(forceRefresh);
          }, 2000);
          return;
        } else {
          console.error("Max retries reached for network error");
          setRetryCount(0);
        }
      } else if (error instanceof DOMException && error.name === 'AbortError') {
        console.error("Request timed out after 10 seconds");
        if (retryCount < 1) {
          console.log("Retrying after timeout...");
          setRetryCount(prev => prev + 1);
          setTimeout(() => {
            fetchProfile(forceRefresh);
          }, 1000);
          return;
        } else {
          console.error("Max retries reached for timeout");
          setRetryCount(0);
        }
      } else {
        setRetryCount(0);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const refetch = async () => {
    setLoading(true);
    // Clear cache before refetching to ensure fresh data
    if (user?.id) {
      delete profileCache[user.id];
      // Also clear local state to force re-render
      setProfile(null);
    }
    await fetchProfile(true);
  };

  return { profile, loading, refetch, isOffline };
};

// Export global cache invalidation function
export const invalidateProfileCache = (userId: string) => {
  console.log('Invalidating profile cache for user:', userId);
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
