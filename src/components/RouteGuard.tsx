import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserFlow } from '@/hooks/useUserFlow';

interface RouteGuardProps {
  children: React.ReactNode;
  requiresAuth?: boolean;
  requiresProfile?: boolean;
  allowedStages?: string[];
}

/**
 * Navigation guard that protects routes based on user flow state
 */
export const RouteGuard: React.FC<RouteGuardProps> = ({ 
  children, 
  requiresAuth = true, 
  requiresProfile = true,
  allowedStages 
}) => {
  const { flowState } = useUserFlow();
  const location = useLocation();

  // Show loading while determining flow state
  if (flowState.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="flex flex-col items-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center animate-pulse">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-muted-foreground text-lg animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if route is allowed based on current stage
  if (allowedStages && !allowedStages.includes(flowState.currentStage)) {
    // Only redirect if it's a significant mismatch, not for edge cases
    if (flowState.needsAuth && !allowedStages.includes('auth')) {
      return <Navigate to="/auth" state={{ from: location }} replace />;
    }
    if (flowState.needsProfileCreation && !allowedStages.includes('onboarding')) {
      return <Navigate to="/onboarding" state={{ from: location }} replace />;
    }
    if (flowState.currentStage === 'ready' && !allowedStages.includes('ready')) {
      return <Navigate to="/dashboard" state={{ from: location }} replace />;
    }
  }

  // Auth guard
  if (requiresAuth && flowState.needsAuth) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Profile creation guard
  if (requiresProfile && flowState.needsProfileCreation) {
    return <Navigate to="/onboarding" state={{ from: location }} replace />;
  }

  // Terms acceptance is handled by AppContent overlay, no redirect needed

  // Allow access to protected route
  return <>{children}</>;
};

// Convenience components for common guard patterns
export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RouteGuard requiresAuth={false} requiresProfile={false} allowedStages={['auth', 'terms']}>
    {children}
  </RouteGuard>
);

export const AuthenticatedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RouteGuard requiresAuth={true} requiresProfile={false} allowedStages={['ready', 'terms', 'onboarding']}>
    {children}
  </RouteGuard>
);

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RouteGuard requiresAuth={true} requiresProfile={true} allowedStages={['ready']}>
    {children}
  </RouteGuard>
);

export const OnboardingRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RouteGuard requiresAuth={true} requiresProfile={false} allowedStages={['onboarding', 'terms']}>
    {children}
  </RouteGuard>
);
