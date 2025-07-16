
import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { ToastProvider } from '@/providers/ToastProvider';
import LoadingSpinner from '@/components/LoadingSpinner';

// Lazy load pages for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Wardrobe = lazy(() => import('./pages/Wardrobe'));
const WardrobeSetup = lazy(() => import('./pages/WardrobeSetup'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const StyleRecommendations = lazy(() => import('./pages/StyleRecommendations'));
const Analytics = lazy(() => import('./pages/Analytics'));
const VirtualTryOn = lazy(() => import('./pages/VirtualTryOn'));
const Auth = lazy(() => import('./pages/Auth'));
const StyleMeImproved = lazy(() => import('./pages/StyleMeImproved'));
const WardrobeAnalyticsPage = lazy(() => import('./pages/WardrobeAnalyticsPage'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Index = lazy(() => import('./pages/Index'));
const NotFound = lazy(() => import('./pages/NotFound'));

function App() {
  return (
    <ThemeProvider defaultTheme="default">
      <ToastProvider>
        <div className="min-h-screen bg-background">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<Index />} />
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
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
