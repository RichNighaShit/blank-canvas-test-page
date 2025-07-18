import React, { Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { PerformanceDashboard } from "./components/PerformanceDashboard";

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
const Auth = React.lazy(() => import("./pages/Auth"));
const StyleMeImproved = React.lazy(() => import("./pages/StyleMeImproved"));
const WardrobeAnalyticsPage = React.lazy(
  () => import("./pages/WardrobeAnalyticsPage"),
);
const Onboarding = React.lazy(() => import("./pages/Onboarding"));
const Index = React.lazy(() => import("./pages/Index"));
const ClothingAnalyzerTestPage = React.lazy(
  () => import("./pages/ClothingAnalyzerTestPage"),
);
const NotFound = React.lazy(() => import("./pages/NotFound"));

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
    <div className="min-h-screen bg-background">
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/wardrobe" element={<Wardrobe />} />
          <Route path="/wardrobe-setup" element={<WardrobeSetup />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/recommendations" element={<StyleRecommendations />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route
            path="/wardrobe-analytics"
            element={<WardrobeAnalyticsPage />}
          />
          <Route path="/virtual-try-on" element={<VirtualTryOn />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/style-me-improved" element={<StyleMeImproved />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/index" element={<Index />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>

      {/* Performance Dashboard - Development Only */}
      {import.meta.env.DEV && <PerformanceDashboard />}
    </div>
  );
}

export default App;
