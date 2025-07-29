
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { SEOHead } from './SEOHead';
import Index from '@/pages/Index';

const HomePage: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is authenticated, redirect to dashboard
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <>
        <SEOHead 
          title="Loading - DripMuse"
          noIndex={true}
        />
        <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse">
              <div className="w-8 h-8 bg-white rounded-full"></div>
            </div>
            <p className="text-lg text-muted-foreground">Loading...</p>
          </div>
        </div>
      </>
    );
  }

  // If not authenticated, show the landing page
  if (!user) {
    return (
      <>
        <SEOHead 
          title="DripMuse - AI-Powered Personal Stylist & Fashion Assistant"
          description="Discover your perfect style with DripMuse's AI-powered fashion recommendations. Upload your wardrobe, get personalized outfit suggestions, and find your ideal color palette. Start your style transformation today!"
          keywords="AI stylist, personal fashion assistant, outfit recommendations, wardrobe analysis, color palette analysis, virtual styling, fashion AI, style transformation"
          url="https://dripmuse.com/"
        />
        <Index />
      </>
    );
  }

  // If authenticated, return null (will redirect via useEffect)
  return null;
};

export default HomePage;
