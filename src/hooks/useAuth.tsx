import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthService, User, AuthError } from '@/services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on app start
    const checkExistingSession = async () => {
      try {
        const currentUser = await AuthService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error checking existing session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkExistingSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await AuthService.signIn(email, password);
      
      if (result.user) {
        setUser(result.user);
        return { error: null };
      } else {
        return { error: result.error || { message: 'Sign in failed' } };
      }
    } catch (error) {
      return { error: { message: 'Network error. Please try again.' } };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await AuthService.signUp(email, password);
      
      if (result.user) {
        // Auto sign in after sign up
        const signInResult = await AuthService.signIn(email, password);
        if (signInResult.user) {
          setUser(signInResult.user);
        }
        return { error: null };
      } else {
        return { error: result.error || { message: 'Sign up failed' } };
      }
    } catch (error) {
      return { error: { message: 'Network error. Please try again.' } };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const result = await AuthService.signOut();
      setUser(null);
      return { error: result.error || null };
    } catch (error) {
      return { error: { message: 'Sign out failed' } };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
