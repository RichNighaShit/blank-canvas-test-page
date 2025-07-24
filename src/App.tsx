import React, { Suspense } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { PerformanceDashboard } from "./components/PerformanceDashboard";
import RouteErrorBoundary from "./components/RouteErrorBoundary";
import { OnboardingProvider } from "./components/onboarding";
import { AppContent } from "./components/AppContent";
import NetworkStatus from "./components/NetworkStatus";
import Auth from "./pages/Auth"; // Regular import to avoid dynamic import issues

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
    <OnboardingProvider>
      <AppContent>
        <div className="min-h-screen bg-background">
          <NetworkStatus />
          <RouteErrorBoundary>
        <Routes>
          {/* Auth route loads immediately without lazy loading */}
          <Route path="/auth" element={<Auth />} />

          {/* All other routes with Suspense for lazy loading */}
          <Route
            path="/"
            element={
              <Suspense fallback={<PageLoader />}>
                <Dashboard />
              </Suspense>
            }
          />
          <Route
            path="/dashboard"
            element={
              <Suspense fallback={<PageLoader />}>
                <Dashboard />
              </Suspense>
            }
          />
          <Route
            path="/wardrobe"
            element={
              <Suspense fallback={<PageLoader />}>
                <Wardrobe />
              </Suspense>
            }
          />
          <Route
            path="/wardrobe-setup"
            element={
              <Suspense fallback={<PageLoader />}>
                <WardrobeSetup />
              </Suspense>
            }
          />
          <Route
            path="/edit-profile"
            element={
              <Suspense fallback={<PageLoader />}>
                <EditProfile />
              </Suspense>
            }
          />
          <Route
            path="/profile/palette"
            element={
              <Suspense fallback={<PageLoader />}>
                <YourColorPalette />
              </Suspense>
            }
          />

          <Route
            path="/recommendations"
            element={
              <Suspense fallback={<PageLoader />}>
                <StyleRecommendations />
              </Suspense>
            }
          />
          <Route
            path="/style-me"
            element={<Navigate to="/recommendations" replace />}
          />
          <Route
            path="/analytics"
            element={
              <Suspense fallback={<PageLoader />}>
                <Analytics />
              </Suspense>
            }
          />
          <Route
            path="/wardrobe-analytics"
            element={
              <Suspense fallback={<PageLoader />}>
                <WardrobeAnalyticsPage />
              </Suspense>
            }
          />
          <Route
            path="/virtual-try-on"
            element={
              <Suspense fallback={<PageLoader />}>
                <VirtualTryOn />
              </Suspense>
            }
          />
          <Route
            path="/style-me-improved"
            element={
              <Suspense fallback={<PageLoader />}>
                <StyleMeImproved />
              </Suspense>
            }
          />
          <Route
            path="/onboarding"
            element={
              <Suspense fallback={<PageLoader />}>
                <Onboarding />
              </Suspense>
            }
          />
          <Route
            path="/index"
            element={
              <Suspense fallback={<PageLoader />}>
                <Index />
              </Suspense>
            }
          />
          <Route
            path="/terms"
            element={
              <Suspense fallback={<PageLoader />}>
                <TermsOfUsePage />
              </Suspense>
            }
          />
          <Route
            path="/privacy"
            element={
              <Suspense fallback={<PageLoader />}>
                <PrivacyPolicyPage />
              </Suspense>
            }
          />
          <Route
            path="*"
            element={
              <Suspense fallback={<PageLoader />}>
                <NotFound />
              </Suspense>
            }
          />
          </Routes>
          </RouteErrorBoundary>

          {/* Performance Dashboard - Development Only */}
          {import.meta.env.DEV && <PerformanceDashboard />}
        </div>
      </AppContent>
    </OnboardingProvider>
  );
}

export default App;
