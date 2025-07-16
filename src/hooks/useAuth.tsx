import React, { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

/**
 * Custom hook for authentication state management using Supabase
 * Provides real-time authentication state, user data, and session management
 *
 * @returns {Object} Authentication state and utilities
 * @returns {User | null} user - Current authenticated user object or null
 * @returns {Session | null} session - Current session object or null
 * @returns {boolean} loading - Loading state for authentication operations
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, session, loading } = useAuth();
 *
 *   if (loading) return <LoadingSpinner />;
 *   if (!user) return <LoginForm />;
 *
 *   return <DashboardContent user={user} />;
 * }
 * ```
 */
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        logger.error("Error getting initial session", {
          error,
          context: {
            component: "useAuth",
            action: "getInitialSession",
          },
        });
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session?.user?.id);
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        setUser(null);
        setSession(null);
      }
      return { error };
    } catch (error) {
      console.error("Error signing out:", error);
      return { error };
    }
  };

  return {
    user,
    session,
    loading,
    signOut,
  };
};
