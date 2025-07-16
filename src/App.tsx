
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Wardrobe from './pages/Wardrobe';
import WardrobeSetup from './pages/WardrobeSetup';
import EditProfile from './pages/EditProfile';
import StyleRecommendations from './pages/StyleRecommendations';
import Analytics from './pages/Analytics';
import VirtualTryOn from './pages/VirtualTryOn';
import Auth from './pages/Auth';
import StyleMeImproved from "@/pages/StyleMeImproved";
import WardrobeAnalyticsPage from "@/pages/WardrobeAnalyticsPage";
import Onboarding from './pages/Onboarding';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import { PerformanceDashboard } from './components/PerformanceDashboard';

function App() {
  return (
    <div className="min-h-screen bg-background">
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
      {/* Performance Dashboard - Development Only */}
      {import.meta.env.DEV && <PerformanceDashboard />}
    </div>
  );
}

export default App;
