import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Simple components without complex dependencies
const Dashboard = () => (
  <div className="min-h-screen bg-white p-8">
    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
    <p className="mt-4 text-gray-600">Welcome to your fashion AI assistant!</p>
  </div>
);

const Wardrobe = () => (
  <div className="min-h-screen bg-white p-8">
    <h1 className="text-2xl font-bold text-gray-900">Wardrobe</h1>
    <p className="mt-4 text-gray-600">Manage your wardrobe items here.</p>
  </div>
);

const StyleRecommendations = () => (
  <div className="min-h-screen bg-white p-8">
    <h1 className="text-2xl font-bold text-gray-900">Style Recommendations</h1>
    <p className="mt-4 text-gray-600">Get AI-powered style recommendations.</p>
  </div>
);

const Analytics = () => (
  <div className="min-h-screen bg-white p-8">
    <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
    <p className="mt-4 text-gray-600">View your style analytics.</p>
  </div>
);

const VirtualTryOn = () => (
  <div className="min-h-screen bg-white p-8">
    <h1 className="text-2xl font-bold text-gray-900">Virtual Try-On</h1>
    <p className="mt-4 text-gray-600">Try on clothes virtually.</p>
  </div>
);

const Auth = () => (
  <div className="min-h-screen bg-white p-8">
    <h1 className="text-2xl font-bold text-gray-900">Authentication</h1>
    <p className="mt-4 text-gray-600">Login or sign up.</p>
  </div>
);

const NotFound = () => (
  <div className="min-h-screen bg-white p-8">
    <h1 className="text-2xl font-bold text-gray-900">Page Not Found</h1>
    <p className="mt-4 text-gray-600">The page you're looking for doesn't exist.</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">StyleAI</h1>
              </div>
              <div className="flex items-center space-x-4">
                <a href="/" className="text-gray-600 hover:text-gray-900">Dashboard</a>
                <a href="/wardrobe" className="text-gray-600 hover:text-gray-900">Wardrobe</a>
                <a href="/recommendations" className="text-gray-600 hover:text-gray-900">Recommendations</a>
                <a href="/analytics" className="text-gray-600 hover:text-gray-900">Analytics</a>
                <a href="/virtual-try-on" className="text-gray-600 hover:text-gray-900">Try-On</a>
              </div>
            </div>
          </div>
        </nav>
        
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/wardrobe" element={<Wardrobe />} />
          <Route path="/recommendations" element={<StyleRecommendations />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/virtual-try-on" element={<VirtualTryOn />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;