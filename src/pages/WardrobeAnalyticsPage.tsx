
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ModernHeader from "@/components/ModernHeader";
import { WardrobeAnalytics as Analytics } from "@/components/WardrobeAnalytics";
import OutfitPlanner from "@/components/OutfitPlanner";
import { WardrobeInsights } from "@/components/WardrobeInsights";

const WardrobeAnalyticsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <ModernHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Wardrobe Analytics</h1>
          <p className="text-xl text-muted-foreground">
            Deep insights into your fashion choices and style patterns
          </p>
        </div>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="planner">Outfit Planner</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
          </TabsList>
          
          <TabsContent value="analytics" className="space-y-6">
            <Analytics />
          </TabsContent>
          
          <TabsContent value="planner" className="space-y-6">
            <OutfitPlanner />
          </TabsContent>
          
          <TabsContent value="insights" className="space-y-6">
            <WardrobeInsights />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WardrobeAnalyticsPage;
