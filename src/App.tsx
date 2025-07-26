import React, { Suspense } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { PerformanceDashboard } from "./components/PerformanceDashboard";
import RouteErrorBoundary from "./components/RouteErrorBoundary";
import LazyLoadErrorBoundary from "./components/LazyLoadErrorBoundary";
import { OnboardingProvider } from "./components/onboarding";
import { AppContent } from "./components/AppContent";
import NetworkStatus from "./components/NetworkStatus";
import HomePage from "./components/HomePage";
import Auth from "./pages/Auth"; // Regular import to avoid dynamic import issues
import { PublicRoute, AuthenticatedRoute, ProtectedRoute, OnboardingRoute } from "./components/RouteGuard";

// Lazy load components for better bundle splitting
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const Wardrobe = React.lazy(() => import("./pages/Wardrobe"));
const WardrobeSetup = React.lazy(() => import("./pages/WardrobeSetup"));
const EditProfile = React.lazy(() => import("./pages/EditProfile"));
const StyleRecommendations = React.lazy(
  () => import("./pages/StyleRecommendations"),
);
const Analytics = React.lazy(() => import("./pages/Analytics"));
const VirtualTryOn = React.lazy(() => import("./pages/VirtualTryOn"));
// Auth imported above as regular import for debugging
// const Auth = React.lazy(() => import("./pages/Auth"));
const StyleMeImproved = React.lazy(() => import("./pages/StyleMeImproved"));
const WardrobeAnalyticsPage = React.lazy(
  () => import("./pages/WardrobeAnalyticsPage"),
);
const Onboarding = React.lazy(() => import("./pages/Onboarding"));
const Index = React.lazy(() => import("./pages/Index"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const YourColorPalette = React.lazy(() => import("./pages/YourColorPalette"));
const TermsOfUsePage = React.lazy(() => import("./pages/TermsOfUsePage"));
const PrivacyPolicyPage = React.lazy(() => import("./pages/PrivacyPolicyPage"));


// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
    <div className="flex flex-col items-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center animate-pulse">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-muted-foreground text-lg animate-pulse">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <RouteErrorBoundary>
      <OnboardingProvider>
        <AppContent>
          <div className="min-h-screen bg-background">
            <NetworkStatus />
        <Routes>
          {/* Public routes */}
          <Route path="/auth" element={
            <PublicRoute>
              <Auth />
            </PublicRoute>
          } />

          <Route path="/" element={
            <PublicRoute>
              <HomePage />
            </PublicRoute>
          } />

          {/* Onboarding route */}
          <Route path="/onboarding" element={
            <OnboardingRoute>
              <Suspense fallback={<PageLoader />}>
                <Onboarding />
              </Suspense>
            </OnboardingRoute>
          } />

          {/* Protected routes requiring complete profile */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <Dashboard />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/wardrobe" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <Wardrobe />
              </Suspense>
            </ProtectedRoute>
          } />

          <Route path="/wardrobe-setup" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <WardrobeSetup />
              </Suspense>
            </ProtectedRoute>
          } />

          <Route path="/edit-profile" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <EditProfile />
              </Suspense>
            </ProtectedRoute>
          } />

          <Route path="/profile/palette" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <YourColorPalette />
              </Suspense>
            </ProtectedRoute>
          } />

          <Route path="/recommendations" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <StyleRecommendations />
              </Suspense>
            </ProtectedRoute>
          } />

          <Route path="/style-me" element={<Navigate to="/recommendations" replace />} />

          <Route path="/analytics" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <Analytics />
              </Suspense>
            </ProtectedRoute>
          } />

          <Route path="/wardrobe-analytics" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <WardrobeAnalyticsPage />
              </Suspense>
            </ProtectedRoute>
          } />

          <Route path="/virtual-try-on" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <VirtualTryOn />
              </Suspense>
            </ProtectedRoute>
          } />

          <Route path="/style-me-improved" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <StyleMeImproved />
              </Suspense>
            </ProtectedRoute>
          } />
          {/* Public/Legal pages */}
          <Route path="/index" element={
            <Suspense fallback={<PageLoader />}>
              <Index />
            </Suspense>
          } />

          <Route path="/terms" element={
            <Suspense fallback={<PageLoader />}>
              <TermsOfUsePage />
            </Suspense>
          } />

          <Route path="/privacy" element={
            <Suspense fallback={<PageLoader />}>
              <PrivacyPolicyPage />
            </Suspense>
          } />
          <Route
            path="*"
            element={
              <Suspense fallback={<PageLoader />}>
                <NotFound />
              </Suspense>
            }
          />
          </Routes>

          {/* Performance Dashboard - Development Only */}
          {import.meta.env.DEV && <PerformanceDashboard />}
        </div>
      </AppContent>
    </OnboardingProvider>
    </RouteErrorBoundary>
  );
}

export default App;
