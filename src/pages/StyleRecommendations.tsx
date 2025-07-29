import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import Header from "@/components/Header";
import { SmartShoppingSuggestions } from "@/components/SmartShoppingSuggestions";
import { StyleRecommendations as StyleRecs } from "@/components/StyleRecommendations";
import StyleRecommendationsErrorBoundary from "@/components/StyleRecommendationsWrapper";

import { OutfitPlanner } from "@/components/OutfitPlanner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  ShoppingCart,
  Sparkles,
  AlertCircle,
  Calendar,
  Crown,
  Camera,
  Zap,
  Star,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const StyleRecommendations = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showPhotoPrompt, setShowPhotoPrompt] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="flex flex-col items-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center animate-pulse">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <p className="text-muted-foreground text-lg animate-pulse">
            Loading your style assistant...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const needsPhoto = !profile?.face_photo_url;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Profile Photo Prompt */}
      {needsPhoto && showPhotoPrompt && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Camera className="h-6 w-6" />
                <div>
                  <p className="font-semibold">
                    Enhance Your Style Experience
                  </p>
                  <p className="text-purple-100 text-sm">
                    Add a profile photo for better color analysis and
                    personalized recommendations
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate("/edit-profile")}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  Add Photo
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPhotoPrompt(false)}
                  className="text-white hover:bg-white/20"
                >
                  <AlertCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-br from-purple-50/50 via-white to-pink-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20">
        {/* Hero Section with modern design */}
        <div className="relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-1/4 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-float"></div>
            <div className="absolute top-40 right-1/4 w-24 h-24 bg-gradient-to-br from-pink-400/20 to-purple-400/20 rounded-full blur-xl animate-float" style={{animationDelay: '1s'}}></div>
            <div className="absolute bottom-20 left-1/3 w-20 h-20 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-xl animate-float" style={{animationDelay: '2s'}}></div>
          </div>
          
          <div className="container mx-auto px-4 py-24 relative z-10">
            <div className="text-center mb-16">
              {/* Enhanced hero with animated elements */}
              <div className="flex flex-col items-center mb-8">
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/25 animate-pulse-soft">
                    <Sparkles className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                    <Star className="h-3 w-3 text-white fill-white" />
                  </div>
                </div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading bg-gradient-to-r from-purple-900 via-purple-600 to-pink-600 dark:from-purple-400 dark:via-purple-300 dark:to-pink-400 bg-clip-text text-transparent mb-6 leading-tight">
                  Style Me
                </h1>
                <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-6"></div>
              </div>
              
              <p className="text-xl sm:text-2xl md:text-3xl text-muted-foreground/80 max-w-4xl mx-auto leading-relaxed font-light mb-8">
                Your <span className="font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">AI-powered personal stylist</span> ready to create the perfect look for any occasion
              </p>

              {/* Enhanced feature badges */}
              <div className="flex flex-wrap items-center justify-center gap-6 mb-12">
                <div className="group flex items-center gap-3 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform">
                    <Star className="h-4 w-4 text-white fill-white" />
                  </div>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">Personalized</span>
                </div>
                <div className="group flex items-center gap-3 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform">
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">Instant Results</span>
                </div>
                <div className="group flex items-center gap-3 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform">
                    <Crown className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">Premium Quality</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content with enhanced styling */}
        <div className="container mx-auto px-4 pb-24">
          <div className="max-w-7xl mx-auto">
            <Tabs defaultValue="outfits" className="space-y-12">
              <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto sm:h-24 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-purple-200/50 dark:border-purple-700/50 rounded-3xl p-3 shadow-2xl shadow-purple-500/10 gap-3 sm:gap-1">
                <TabsTrigger
                  value="outfits"
                  className="group flex flex-col gap-2 h-16 sm:h-20 rounded-2xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 hover:scale-105 data-[state=active]:scale-105"
                >
                  <Sparkles className="h-6 w-6 group-data-[state=active]:animate-pulse" />
                  <span className="text-sm font-semibold">
                    AI Recommendations
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="planner"
                  className="group flex flex-col gap-2 h-16 sm:h-20 rounded-2xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 hover:scale-105 data-[state=active]:scale-105"
                >
                  <Calendar className="h-6 w-6 group-data-[state=active]:animate-pulse" />
                  <span className="text-sm font-semibold">Outfit Planner</span>
                </TabsTrigger>
                <TabsTrigger
                  value="shopping"
                  className="group flex flex-col gap-2 h-16 sm:h-20 rounded-2xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 hover:scale-105 data-[state=active]:scale-105"
                >
                  <ShoppingCart className="h-6 w-6 group-data-[state=active]:animate-pulse" />
                  <span className="text-sm font-semibold">Smart Shopping</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="outfits" className="space-y-8">
                <div className="relative overflow-hidden rounded-3xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border border-purple-100 dark:border-purple-800/50 shadow-2xl shadow-purple-500/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/8 via-transparent to-pink-500/8"></div>
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500"></div>
                  <div className="relative z-10 p-8 sm:p-12">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                          <Sparkles className="h-7 w-7 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl sm:text-3xl font-heading text-foreground">
                            AI Style Recommendations
                          </h3>
                          <p className="text-muted-foreground">
                            Personalized outfit suggestions powered by AI
                          </p>
                        </div>
                      </div>
                      <Badge className="ml-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 px-4 py-2 text-sm font-semibold shadow-lg">
                        <Crown className="h-4 w-4 mr-2" />
                        Premium Feature
                      </Badge>
                    </div>
                    <StyleRecommendationsErrorBoundary>
                      <StyleRecs />
                    </StyleRecommendationsErrorBoundary>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="planner" className="space-y-8">
                <div className="relative overflow-hidden rounded-3xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border border-blue-100 dark:border-blue-800/50 shadow-2xl shadow-blue-500/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 via-transparent to-purple-500/8"></div>
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"></div>
                  <div className="relative z-10 p-8 sm:p-12">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                          <Calendar className="h-7 w-7 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl sm:text-3xl font-heading text-foreground">
                            Smart Outfit Planner
                          </h3>
                          <p className="text-muted-foreground">
                            Plan your perfect outfits for the week ahead
                          </p>
                        </div>
                      </div>
                    </div>
                    <OutfitPlanner />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="shopping" className="space-y-8">
                <div className="relative overflow-hidden rounded-3xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border border-emerald-100 dark:border-emerald-800/50 shadow-2xl shadow-emerald-500/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/8 via-transparent to-teal-500/8"></div>
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500"></div>
                  <div className="relative z-10 p-8 sm:p-12">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                          <ShoppingCart className="h-7 w-7 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl sm:text-3xl font-heading text-foreground">
                            AI-Powered Shopping
                          </h3>
                          <p className="text-muted-foreground">
                            Discover curated items that perfectly complement your wardrobe
                          </p>
                        </div>
                      </div>
                    </div>
                    <SmartShoppingSuggestions />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StyleRecommendations;
