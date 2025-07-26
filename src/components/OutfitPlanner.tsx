import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useWeather } from "@/hooks/useWeather";
import { supabase } from "@/integrations/supabase/client";
import {
  simpleStyleAI,
  OutfitRecommendation,
  WardrobeItem,
  StyleProfile,
} from "@/lib/simpleStyleAI";
import { usePerformance } from "@/hooks/usePerformance";
import { PerformanceCache, CACHE_NAMESPACES } from "@/lib/performanceCache";
import { getErrorMessage, logError } from "@/lib/errorUtils";

interface PlannedOutfit {
  id: string;
  date: Date;
  occasion: string;
  items: WardrobeItem[];
  weather?: string;
  notes?: string;
  confidence?: number;
  reasoning?: string[];
}

const OutfitPlanner: React.FC = () => {
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [plannedOutfits, setPlannedOutfits] = useState<PlannedOutfit[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedOccasion, setSelectedOccasion] = useState<string>("casual");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentOutfit, setCurrentOutfit] = useState<WardrobeItem[]>([]);
  const [currentOutfitDetails, setCurrentOutfitDetails] =
    useState<OutfitRecommendation | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { weather } = useWeather();

  // Performance optimization
  const { executeWithCache } = usePerformance({
    cacheNamespace: CACHE_NAMESPACES.OUTFIT_PLANNER,
    enableCaching: true,
    enableMonitoring: true,
  });

  const occasions = [
    "casual",
    "work",
    "formal",
    "party",
    "sport",
    "travel",
    "date",
  ];
  const weatherOptions = ["sunny", "cloudy", "rainy", "cold", "hot"];

  useEffect(() => {
    if (user) {
      fetchWardrobeItems();
      loadPlannedOutfits();
    }
  }, [user]);

  const fetchWardrobeItems = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("wardrobe_items")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      setWardrobeItems(data || []);
    } catch (error) {
      logError(error, "Error fetching wardrobe items in OutfitPlanner");
    }
  };

  const loadPlannedOutfits = () => {
    const saved = localStorage.getItem("plannedOutfits");
    if (saved) {
      const outfits = JSON.parse(saved).map((outfit: any) => ({
        ...outfit,
        date: new Date(outfit.date),
      }));
      setPlannedOutfits(outfits);
    }
  };

  const savePlannedOutfits = (outfits: PlannedOutfit[]) => {
    localStorage.setItem("plannedOutfits", JSON.stringify(outfits));
    setPlannedOutfits(outfits);
  };

  const generateOutfitForDate = async () => {
    if (wardrobeItems.length < 2) {
      toast({
        title: "Not enough items",
        description: "Add more items to your wardrobe to generate outfits.",
        variant: "destructive",
      });
      return;
    }

    if (!profile) {
      toast({
        title: "Profile required",
        description:
          "Please complete your profile to get personalized recommendations.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Filter items suitable for the occasion
      const suitableItems = wardrobeItems.filter(
        (item) =>
          item.occasion.includes(selectedOccasion) ||
          item.occasion.includes("casual"),
      );

      if (suitableItems.length < 2) {
        toast({
          title: "No suitable items",
          description: `No items found for ${selectedOccasion} occasions. Try adding more items to your wardrobe.`,
          variant: "destructive",
        });
        return;
      }

      // Create style profile
      const styleProfile: StyleProfile = {
        id: profile.id,
        preferred_style: profile.preferred_style || "casual",
        favorite_colors: profile.favorite_colors || [],
        goals: profile.goals || [],
      };

      // Use cached execution for AI recommendations
      const recommendations = await executeWithCache(
        `outfit_planner_${selectedOccasion}_${selectedDate.getTime()}_${user.id}`,
        async () =>
          simpleStyleAI.generateRecommendations(
            suitableItems,
            styleProfile,
            {
              occasion: selectedOccasion,
              timeOfDay: "day",
              weather: weather || undefined,
            },
            true, // Include accessories for planning
          ),
        5 * 60 * 1000, // 5 minutes cache
      );

      if (recommendations.length === 0) {
        toast({
          title: "No recommendations",
          description:
            "Could not generate suitable outfits. Try adjusting your preferences or adding more items.",
          variant: "destructive",
        });
        return;
      }

      // Use the best recommendation
      const bestOutfit = recommendations[0];
      setCurrentOutfit(bestOutfit.items);
      setCurrentOutfitDetails(bestOutfit);

      toast({
        title: "Outfit Generated!",
        description: `${bestOutfit.description} (${Math.round(bestOutfit.confidence * 100)}% match)`,
      });
    } catch (error) {
      console.error("Error generating outfit:", error);
      toast({
        title: "Error",
        description: "Failed to generate outfit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveOutfitForDate = () => {
    if (currentOutfit.length === 0) {
      toast({
        title: "No outfit to save",
        description: "Generate an outfit first.",
        variant: "destructive",
      });
      return;
    }

    const newOutfit: PlannedOutfit = {
      id: Date.now().toString(),
      date: selectedDate,
      occasion: selectedOccasion,
      items: currentOutfit,
      weather: weather?.condition || "mild",
      confidence: currentOutfitDetails?.confidence,
      reasoning: currentOutfitDetails?.reasoning,
    };

    const updatedOutfits = [
      ...plannedOutfits.filter(
        (o) => o.date.toDateString() !== selectedDate.toDateString(),
      ),
      newOutfit,
    ];

    savePlannedOutfits(updatedOutfits);
    setCurrentOutfit([]);
    setCurrentOutfitDetails(null);

    toast({
      title: "Outfit Saved!",
      description: `Outfit planned for ${selectedDate.toLocaleDateString()}.`,
    });
  };

  const getOutfitForDate = (date: Date): PlannedOutfit | undefined => {
    return plannedOutfits.find(
      (outfit) => outfit.date.toDateString() === date.toDateString(),
    );
  };

  const getSeason = (month: number): string => {
    if (month >= 2 && month <= 4) return "spring";
    if (month >= 5 && month <= 7) return "summer";
    if (month >= 8 && month <= 10) return "fall";
    return "winter";
  };

  const generateWeeklyOutfits = async () => {
    if (!profile) {
      toast({
        title: "Profile required",
        description:
          "Please complete your profile to get personalized recommendations.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const startDate = new Date(selectedDate);
      const weeklyOutfits: PlannedOutfit[] = [];

      // Create style profile
      const styleProfile: StyleProfile = {
        id: profile.id,
        preferred_style: profile.preferred_style || "casual",
        favorite_colors: profile.favorite_colors || [],
        goals: profile.goals || [],
      };

      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        // Skip if outfit already exists for this date
        if (getOutfitForDate(currentDate)) continue;

        // Determine occasion based on day of week
        const dayOfWeek = currentDate.getDay();
        let occasion = "casual";
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          occasion = "work"; // Weekdays
        } else if (dayOfWeek === 6) {
          occasion = "casual"; // Saturday
        } else {
          occasion = "casual"; // Sunday
        }

        // Filter items for this occasion
        const suitableItems = wardrobeItems.filter(
          (item) =>
            item.occasion.includes(occasion) ||
            item.occasion.includes("casual"),
        );

        if (suitableItems.length >= 2) {
          try {
            // Use cached execution for each day's outfit
            const recommendations = await executeWithCache(
              `weekly_outfit_${occasion}_${currentDate.getTime()}_${user.id}`,
              async () =>
                simpleStyleAI.generateRecommendations(
                  suitableItems,
                  styleProfile,
                  {
                    occasion,
                    timeOfDay: "day",
                    weather: weather || undefined,
                  },
                  true, // Include accessories
                ),
              10 * 60 * 1000, // 10 minutes cache for weekly planning
            );

            if (recommendations.length > 0) {
              const bestOutfit = recommendations[0];
              weeklyOutfits.push({
                id: `${currentDate.getTime()}`,
                date: currentDate,
                occasion,
                items: bestOutfit.items,
                weather: weather?.condition || "mild",
                confidence: bestOutfit.confidence,
                reasoning: bestOutfit.reasoning,
              });
            }
          } catch (error) {
            console.error(
              `Error generating outfit for ${currentDate.toDateString()}:`,
              error,
            );
            // Continue with other days even if one fails
          }
        }
      }

      const updatedOutfits = [...plannedOutfits, ...weeklyOutfits];
      savePlannedOutfits(updatedOutfits);

      toast({
        title: "Weekly Outfits Generated!",
        description: `Created ${weeklyOutfits.length} AI-powered outfits for the week.`,
      });
    } catch (error) {
      console.error("Error generating weekly outfits:", error);
      toast({
        title: "Error",
        description: "Failed to generate weekly outfits.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const existingOutfit = getOutfitForDate(selectedDate);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar and Controls */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Plan Your Outfits</CardTitle>
            <CardDescription>
              Select a date and generate personalized outfit recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
              modifiers={{
                planned: plannedOutfits.map((o) => o.date),
              }}
              modifiersStyles={{
                planned: {
                  backgroundColor: "hsl(var(--primary))",
                  color: "white",
                },
              }}
            />

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Occasion</label>
                <Select
                  value={selectedOccasion}
                  onValueChange={setSelectedOccasion}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {occasions.map((occasion) => (
                      <SelectItem key={occasion} value={occasion}>
                        {occasion.charAt(0).toUpperCase() + occasion.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={generateOutfitForDate}
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? "Generating..." : "Generate AI Outfit"}
                </Button>

                <Button
                  onClick={generateWeeklyOutfits}
                  disabled={isGenerating}
                  variant="outline"
                  className="w-full"
                >
                  Plan Whole Week
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current/Generated Outfit */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>
              {existingOutfit ? "Planned Outfit" : "Generated Outfit"}
            </CardTitle>
            <CardDescription>
              {selectedDate.toLocaleDateString()} - {selectedOccasion}
              {currentOutfitDetails && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({Math.round(currentOutfitDetails.confidence * 100)}% match)
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {existingOutfit ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {existingOutfit.items.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      className="aspect-square relative overflow-hidden rounded-lg"
                    >
                      <img
                        src={item.photo_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-1 left-1">
                        <Badge
                          variant="outline"
                          className="text-xs bg-white/90"
                        >
                          {item.category}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  {existingOutfit.items.map((item) => (
                    <div
                      key={item.id}
                      className="text-sm text-muted-foreground"
                    >
                      • {item.name}
                    </div>
                  ))}
                </div>
                {existingOutfit.confidence && (
                  <div className="text-xs text-muted-foreground">
                    AI Confidence: {Math.round(existingOutfit.confidence * 100)}
                    %
                  </div>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    const updated = plannedOutfits.filter(
                      (o) => o.id !== existingOutfit.id,
                    );
                    savePlannedOutfits(updated);
                  }}
                >
                  Remove Planned Outfit
                </Button>
              </div>
            ) : currentOutfit.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {currentOutfit.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      className="aspect-square relative overflow-hidden rounded-lg"
                    >
                      <img
                        src={item.photo_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-1 left-1">
                        <Badge
                          variant="outline"
                          className="text-xs bg-white/90"
                        >
                          {item.category}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  {currentOutfit.map((item) => (
                    <div
                      key={item.id}
                      className="text-sm text-muted-foreground"
                    >
                      • {item.name}
                    </div>
                  ))}
                </div>
                {currentOutfitDetails?.reasoning &&
                  currentOutfitDetails.reasoning.length > 0 && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="font-medium">Why this outfit:</div>
                      {currentOutfitDetails.reasoning
                        .slice(0, 2)
                        .map((reason, index) => (
                          <div key={index}>• {reason}</div>
                        ))}
                    </div>
                  )}
                <div className="flex gap-2">
                  <Button onClick={saveOutfitForDate} className="flex-1">
                    Save for Date
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCurrentOutfit([]);
                      setCurrentOutfitDetails(null);
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <p className="text-muted-foreground">
                  Generate an AI-powered outfit for this date
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Outfits */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Upcoming Outfits</CardTitle>
            <CardDescription>
              Your AI-planned outfits for the next few days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {plannedOutfits
                .filter((outfit) => outfit.date >= new Date())
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .slice(0, 5)
                .map((outfit) => (
                  <div
                    key={outfit.id}
                    className="flex items-center gap-3 p-3 border rounded-lg"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center text-white text-xs font-medium">
                        {outfit.date.getDate()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {outfit.date.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {outfit.occasion} • {outfit.items.length} items
                        {outfit.confidence && (
                          <span className="ml-1">
                            • {Math.round(outfit.confidence * 100)}% match
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex -space-x-1">
                      {outfit.items.slice(0, 3).map((item, index) => (
                        <img
                          key={item.id}
                          src={item.photo_url}
                          alt={item.name}
                          className="w-8 h-8 rounded-full border-2 border-white object-cover"
                          style={{ zIndex: 3 - index }}
                        />
                      ))}
                    </div>
                  </div>
                ))}

              {plannedOutfits.filter((outfit) => outfit.date >= new Date())
                .length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No upcoming outfits planned
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Ensure proper default export for dynamic imports
export { OutfitPlanner };
export default OutfitPlanner;
