import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { StyleQuiz } from '@/components/StyleQuiz';
import { SmartWardrobeBootstrap } from '@/components/SmartWardrobeBootstrap';
import { OccasionQuickStart } from '@/components/OccasionQuickStart';
import { StyleRecommendations } from '@/components/StyleRecommendations';
import { Sparkles, User, ShoppingBag, Calendar, ArrowRight } from 'lucide-react';

export const StyleMeImproved = () => {
  const [hasQuizResults, setHasQuizResults] = useState<boolean | null>(null);
  const [quizResults, setQuizResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('quiz');
  const { user } = useAuth();
  const { profile } = useProfile();

  useEffect(() => {
    if (user) {
      checkQuizResults();
    }
  }, [user]);

  const checkQuizResults = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_style_quiz')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setHasQuizResults(true);
        setQuizResults(data);
        setActiveTab('bootstrap');
      } else {
        setHasQuizResults(false);
      }
    } catch (error) {
      console.error('Error checking quiz results:', error);
      setHasQuizResults(false);
    }
  };

  const handleQuizComplete = (results: any) => {
    setHasQuizResults(true);
    setQuizResults(results);
    setActiveTab('bootstrap');
  };

  if (hasQuizResults === null) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-8 w-8 text-purple-600" />
              <h1 className="text-3xl font-bold text-foreground">Style Me - AI Powered</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Get personalized style recommendations, build your wardrobe, and shop for any occasion
            </p>
          </div>

          {!hasQuizResults ? (
            <div className="space-y-6">
              <Card className="text-center">
                <CardHeader>
                  <CardTitle className="flex items-center justify-center gap-2 text-foreground">
                    <User className="h-5 w-5" />
                    Welcome to Your Personal Style Journey
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Take our 3-minute style quiz to get personalized recommendations and wardrobe suggestions.
                  </p>
                  <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-6">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      Quick Setup
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      Personalized Results
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-purple-500 rounded-full" />
                      Smart Suggestions
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <StyleQuiz onComplete={handleQuizComplete} />
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 bg-card border border-border rounded-xl p-1 shadow-sm">
                <TabsTrigger 
                  value="bootstrap" 
                  className="flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-muted-foreground hover:text-foreground transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                >
                  <Sparkles className="h-4 w-4" />
                  Smart Wardrobe
                </TabsTrigger>
                <TabsTrigger 
                  value="occasions" 
                  className="flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-muted-foreground hover:text-foreground transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                >
                  <Calendar className="h-4 w-4" />
                  Quick Start
                </TabsTrigger>
                <TabsTrigger 
                  value="recommendations" 
                  className="flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-muted-foreground hover:text-foreground transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Recommendations
                </TabsTrigger>
                <TabsTrigger 
                  value="quiz" 
                  className="flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-muted-foreground hover:text-foreground transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                >
                  <User className="h-4 w-4" />
                  Retake Quiz
                </TabsTrigger>
              </TabsList>

              <TabsContent value="bootstrap" className="space-y-6">
                <SmartWardrobeBootstrap />
              </TabsContent>

              <TabsContent value="occasions" className="space-y-6">
                <OccasionQuickStart />
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-6">
                <StyleRecommendations />
              </TabsContent>

              <TabsContent value="quiz" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-foreground">Update Your Style Profile</CardTitle>
                    <p className="text-muted-foreground">
                      Retake the quiz to update your style preferences and get fresh recommendations.
                    </p>
                  </CardHeader>
                </Card>
                <StyleQuiz onComplete={handleQuizComplete} />
              </TabsContent>
            </Tabs>
          )}

          {/* Quick Action Cards */}
          {hasQuizResults && (
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('bootstrap')}>
                <CardContent className="p-6 text-center">
                  <Sparkles className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                  <h3 className="font-semibold mb-2 text-foreground">Build Your Wardrobe</h3>
                  <p className="text-sm text-muted-foreground">Get smart suggestions to complete your style</p>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('occasions')}>
                <CardContent className="p-6 text-center">
                  <Calendar className="h-8 w-8 mx-auto mb-3 text-green-600" />
                  <h3 className="font-semibold mb-2 text-foreground">Plan for Events</h3>
                  <p className="text-sm text-muted-foreground">Get outfit ideas for any occasion</p>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('recommendations')}>
                <CardContent className="p-6 text-center">
                  <ShoppingBag className="h-8 w-8 mx-auto mb-3 text-purple-600" />
                  <h3 className="font-semibold mb-2 text-foreground">AI Recommendations</h3>
                  <p className="text-sm text-muted-foreground">Personalized outfit combinations</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StyleMeImproved;
