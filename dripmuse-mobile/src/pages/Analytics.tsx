
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import Header from '@/components/Header';
import { WardrobeAnalytics } from '@/components/WardrobeAnalytics';
import { WardrobeInsightsAnalytics } from '@/components/WardrobeInsightsAnalytics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Lightbulb, Upload, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Analytics: React.FC = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="p-8">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
              <p className="text-muted-foreground mb-4">
                Please sign in to view your style analytics
              </p>
              <Button onClick={() => navigate('/auth')}>Sign In</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
            <BarChart3 className="h-8 w-8" />
            Style Analytics
          </h1>
          <p className="text-xl text-muted-foreground">
            Deep insights into your style patterns, wardrobe usage, and personalized recommendations.
          </p>
        </div>

        <Tabs defaultValue="wardrobe" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="wardrobe" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Wardrobe Analytics
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Smart Insights
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="wardrobe" className="space-y-6">
            <WardrobeAnalytics />
          </TabsContent>
          
          <TabsContent value="insights" className="space-y-6">
            <WardrobeInsightsAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Analytics;
