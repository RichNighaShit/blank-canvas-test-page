
import React, { Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ThemeProvider } from '@/hooks/useTheme';
import { Toaster } from '@/components/ui/toaster';

// Lazy load pages for better performance
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Wardrobe = React.lazy(() => import('./pages/Wardrobe'));
const WardrobeSetup = React.lazy(() => import('./pages/WardrobeSetup'));
const EditProfile = React.lazy(() => import('./pages/EditProfile'));
const StyleRecommendations = React.lazy(() => import('./pages/StyleRecommendations'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const VirtualTryOn = React.lazy(() => import('./pages/VirtualTryOn'));
const Auth = React.lazy(() => import('./pages/Auth'));
const StyleMeImproved = React.lazy(() => import("./pages/StyleMeImproved"));
const WardrobeAnalyticsPage = React.lazy(() => import("./pages/WardrobeAnalyticsPage"));
const Onboarding = React.lazy(() => import('./pages/Onboarding'));
const Index = React.lazy(() => import('./pages/Index'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="default">
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/wardrobe" element={<Wardrobe />} />
                <Route path="/wardrobe-setup" element={<WardrobeSetup />} />
                <Route path="/edit-profile" element={<EditProfile />} />
                <Route path="/recommendations" element={<StyleRecommendations />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/wardrobe-analytics" element={<WardrobeAnalyticsPage />} />
                <Route path="/virtual-try-on" element={<VirtualTryOn />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/style-me-improved" element={<StyleMeImproved />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/index" element={<Index />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </div>
          <Toaster />
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
