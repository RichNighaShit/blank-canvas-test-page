import React, { useState, useEffect } from "react";
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
    return (
      <div className="min-h-screen bg-gradient-hero">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <Card className="max-w-lg mx-auto text-center card-premium">
            <CardContent className="p-12">
              <div className="w-20 h-20 mx-auto mb-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Crown className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-3xl font-heading mb-4 text-foreground">
                Style Me Awaits
              </h3>
              <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
                Sign in to access your personal AI-powered style assistant and
                unlock premium fashion recommendations
              </p>
              <Button
                onClick={() => navigate("/auth")}
                size="lg"
                className="btn-premium w-full text-lg"
              >
                Sign In to Continue
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isPhotoMissing = !profile?.face_photo_url;

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />

      {/* Photo Upload Prompt */}
      {!profileLoading && user && isPhotoMissing && showPhotoPrompt && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-b border-purple-100 dark:border-purple-800 px-6 py-6">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                  Enhance Your Experience
                </h4>
                <p className="text-purple-700 dark:text-purple-200">
                  Upload a photo to unlock virtual try-on features and get more
                  personalized recommendations.
                  <a
                    href="/edit-profile"
                    className="underline ml-2 hover:text-purple-900 dark:hover:text-purple-100 transition-colors font-semibold"
                  >
                    Add Photo
                  </a>
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-purple-700 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-800 transition-colors"
              onClick={() => setShowPhotoPrompt(false)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-16">
        <div className="space-y-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-6 mb-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading bg-gradient-to-r from-purple-900 dark:from-purple-400 to-pink-700 dark:to-pink-400 bg-clip-text text-transparent">
                Style Me
              </h1>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-light">
              Your personal stylist ready to create the perfect look for any
              occasion, using advanced fashion insights
            </p>

            <div className="flex items-center justify-center gap-8 mt-8">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <Star className="h-5 w-5 fill-purple-600 dark:fill-purple-400" />
                <span className="font-semibold">Personalized</span>
              </div>
              <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400">
                <Zap className="h-5 w-5" />
                <span className="font-semibold">Instant Results</span>
              </div>
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <Crown className="h-5 w-5" />
                <span className="font-semibold">Quality Service</span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto">
            <Tabs defaultValue="outfits" className="space-y-12">
              <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto sm:h-20 bg-card border border-border rounded-2xl p-2 shadow-card gap-2 sm:gap-0">
                <TabsTrigger
                  value="outfits"
                  className="flex flex-col gap-1 h-12 sm:h-16 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
                >
                  <Sparkles className="h-5 w-5" />
                  <span className="text-xs font-medium">
                    AI Recommendations
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="planner"
                  className="flex flex-col gap-1 h-12 sm:h-16 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
                >
                  <Calendar className="h-5 w-5" />
                  <span className="text-xs font-medium">Outfit Planner</span>
                </TabsTrigger>
                <TabsTrigger
                  value="shopping"
                  className="flex flex-col gap-1 h-12 sm:h-16 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span className="text-xs font-medium">Smart Shopping</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="outfits" className="space-y-8">
                <div className="card-premium p-12 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <Sparkles className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-heading text-foreground">
                          Style Recommendations
                        </h3>
                        <p className="text-muted-foreground">
                          Personalized outfit suggestions just for you
                        </p>
                      </div>
                      <Badge className="ml-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                        <Crown className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    </div>
                    <StyleRecommendationsErrorBoundary>
                      <StyleRecs />
                    </StyleRecommendationsErrorBoundary>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="planner" className="space-y-8">
                <div className="card-premium p-12 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-heading text-foreground">
                          Outfit Planner
                        </h3>
                        <p className="text-muted-foreground">
                          Plan your outfits for the week ahead
                        </p>
                      </div>
                    </div>
                    <OutfitPlanner />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="shopping" className="space-y-8">
                <div className="card-premium p-12 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                        <ShoppingCart className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-heading text-foreground">
                          Smart Shopping
                        </h3>
                        <p className="text-muted-foreground">
                          Discover items that complement your wardrobe
                        </p>
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
