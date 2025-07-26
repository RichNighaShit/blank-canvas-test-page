import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { ColorPaletteSetup } from "@/components/ColorPaletteSetup";
import type { ColorPalette } from "@/data/predefinedColorPalettes";
import type { ColorSeasonAnalysis } from "@/lib/colorSeasonAnalysis";

interface ProfileData {
  display_name: string;
  location: string;
  gender_identity: string;
  preferred_style: string[];
  favorite_colors: string[];
  color_palette_colors: string[];
  goals: string[];
  face_photo_url?: string;
  selected_palette_id?: string;
  color_season_analysis?: any;
}

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [existingProfile, setExistingProfile] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    display_name: "",
    location: "",
    gender_identity: "",
    preferred_style: [],
    favorite_colors: [],
    color_palette_colors: [],
    goals: [],
  });
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const styleOptions = [
    { id: "streetwear", label: "Streetwear", emoji: "🏙️" },
    { id: "casual", label: "Casual", emoji: "👕" },
    { id: "formal", label: "Formal", emoji: "👔" },
    { id: "bohemian", label: "Bohemian", emoji: "🌸" },
    { id: "minimalist", label: "Minimalist", emoji: "⚪" },
    { id: "vintage", label: "Vintage", emoji: "📻" },
    { id: "sporty", label: "Sporty", emoji: "⚽" },
    { id: "elegant", label: "Elegant", emoji: "✨" },
  ];

  const colorOptions = [
    { id: "black", label: "Black", color: "#000000" },
    { id: "white", label: "White", color: "#FFFFFF" },
    { id: "navy", label: "Navy", color: "#1e3a8a" },
    { id: "gray", label: "Gray", color: "#6b7280" },
    { id: "beige", label: "Beige", color: "#f5f5dc" },
    { id: "red", label: "Red", color: "#dc2626" },
    { id: "pink", label: "Pink", color: "#ec4899" },
    { id: "purple", label: "Purple", color: "#7c3aed" },
    { id: "blue", label: "Blue", color: "#2563eb" },
    { id: "green", label: "Green", color: "#16a34a" },
    { id: "yellow", label: "Yellow", color: "#eab308" },
    { id: "orange", label: "Orange", color: "#ea580c" },
  ];

  const goalOptions = [
    { id: "organize", label: "Organize my wardrobe", icon: "📦" },
    { id: "outfits", label: "Find better outfits", icon: "👗" },
    { id: "upgrade", label: "Upgrade my look", icon: "⬆️" },
    { id: "surprise", label: "I don't know, surprise me", icon: "🎲" },
  ];

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Safety check - if user has completed onboarding, redirect them out
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) return;

      try {
        const { data } = await supabase
          .from('user_onboarding')
          .select('onboarding_completed, tutorial_skipped')
          .eq('user_id', user.id)
          .single();

        if (data && (data.onboarding_completed || data.tutorial_skipped)) {
          console.log('User has already completed onboarding, redirecting to dashboard');
          navigate('/dashboard');
        }
      } catch (error) {
        // If there's an error fetching onboarding status, continue with onboarding
        console.log('No onboarding record found, continuing with onboarding flow');
      }
    };

    checkOnboardingStatus();
  }, [user, navigate]);



  const handleBasicInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !profileData.display_name ||
      !profileData.location ||
      !profileData.gender_identity
    ) {
      toast({
        title: "Please fill all fields",
        description: "All basic information is required to continue.",
        variant: "destructive",
      });
      return;
    }
    setStep(3);
  };

  const handleStylePreferences = () => {
    if (profileData.preferred_style.length === 0) {
      toast({
        title: "Select at least one style",
        description: "Please choose your preferred fashion styles.",
        variant: "destructive",
      });
      return;
    }
    setStep(4);
  };

  const handleGoalSelection = async () => {
    if (profileData.goals.length === 0) {
      toast({
        title: "Select at least one goal",
        description: "Please choose what you want to achieve with DripMuse.",
        variant: "destructive",
      });
      return;
    }

    if (!user) return;
    setIsLoading(true);

    try {
      // First check if profile already exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (existingProfile) {
        // Profile exists, update it instead
        const updateData = {
          display_name: profileData.display_name,
          location: profileData.location,
          culture: profileData.gender_identity,
          preferred_style: profileData.preferred_style.length > 0 ? profileData.preferred_style[0] : '',
          favorite_colors: profileData.favorite_colors,
          color_palette_colors: profileData.color_palette_colors,
          goals: profileData.goals,
          face_photo_url: profileData.face_photo_url,
          selected_palette_id: profileData.selected_palette_id,
          color_season_analysis: profileData.color_season_analysis,
          updated_at: new Date().toISOString()
        };

        console.log('Updating profile with data:', updateData);

        const { error } = await supabase
          .from("profiles")
          .update(updateData)
          .eq("user_id", user.id);

        if (error) {
          throw error;
        }
      } else {
        // Profile doesn't exist, create new one
        const insertData = {
          user_id: user.id,
          display_name: profileData.display_name,
          location: profileData.location,
          culture: profileData.gender_identity,
          preferred_style: profileData.preferred_style.length > 0 ? profileData.preferred_style[0] : '',
          favorite_colors: profileData.favorite_colors,
          color_palette_colors: profileData.color_palette_colors,
          goals: profileData.goals,
          face_photo_url: profileData.face_photo_url,
          selected_palette_id: profileData.selected_palette_id,
          color_season_analysis: profileData.color_season_analysis,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        console.log('Creating profile with data:', insertData);

        const { error } = await supabase.from("profiles").insert(insertData);

        if (error) {
          throw error;
        }
      }

      // Mark onboarding as completed in user_onboarding table
      await supabase
        .from('user_onboarding')
        .upsert({
          user_id: user.id,
          onboarding_completed: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      // Invalidate profile cache to ensure fresh data
      if (window.profileCache) {
        delete window.profileCache[user.id];
      }

      toast({
        title: "Welcome to DripMuse!",
        description: "Your profile has been created successfully.",
      });

      // Navigate to dashboard instead of wardrobe-setup to trigger proper flow
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Profile creation/update error:", error);

      if (error.code === "23505") {
        // Duplicate key error - profile already exists
        toast({
          title: "Profile already exists",
          description: "Redirecting to your dashboard...",
        });
        navigate("/dashboard");
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to create profile",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelection = (array: string[], item: string, max?: number) => {
    const newArray = array.includes(item)
      ? array.filter((i) => i !== item)
      : max && array.length >= max
        ? array
        : [...array, item];
    return newArray;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (existingProfile) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Card className="w-full max-w-md shadow-elegant">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              Redirecting to your dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">
            Let's Set Up Your Style Profile
          </h1>
          <p className="text-muted-foreground">
            Help us understand your style to give you the best recommendations
          </p>
          <Progress value={(step / 4) * 100} className="mt-4" />
        </div>

        {step === 1 && (
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Choose Your Color Palette</CardTitle>
              <CardDescription>
                Select the palette that best matches your natural coloring for personalized style recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ColorPaletteSetup
                onComplete={(palette: ColorPalette, analysis: ColorSeasonAnalysis) => {
                  console.log('Color palette selected:', palette);
                  console.log('Color analysis:', analysis);
                  setProfileData(prev => ({
                    ...prev,
                    color_palette_colors: palette.complementaryColors,
                    selected_palette_id: palette.id,
                    color_season_analysis: analysis
                  }));
                  setStep(2);
                }}
                showTitle={false}
                embedded={true}
              />
              <div className="mt-4 text-center">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Skip for now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Tell us about yourself to get personalized recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBasicInfo} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="display_name">Name</Label>
                  <Input
                    id="display_name"
                    placeholder="What should we call you?"
                    value={profileData.display_name}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        display_name: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="City, Country"
                    value={profileData.location}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender_identity">Gender Identity</Label>
                  <Select
                    value={profileData.gender_identity}
                    onValueChange={(value) =>
                      setProfileData((prev) => ({
                        ...prev,
                        gender_identity: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your gender identity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="woman">Woman</SelectItem>
                      <SelectItem value="man">Man</SelectItem>
                      <SelectItem value="non-binary">Non-binary</SelectItem>
                      <SelectItem value="prefer-not-to-say">
                        Prefer not to say
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button type="submit" className="flex-1 shadow-button">
                    Continue
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Style Preferences</CardTitle>
              <CardDescription>
                Choose the fashion styles that resonate with you (select
                multiple)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">Fashion Styles</Label>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {styleOptions.map((style) => (
                    <Button
                      key={style.id}
                      type="button"
                      variant={
                        profileData.preferred_style.includes(style.id)
                          ? "default"
                          : "outline"
                      }
                      className="h-auto p-4 flex flex-col items-center gap-2"
                      onClick={() =>
                        setProfileData((prev) => ({
                          ...prev,
                          preferred_style: toggleSelection(
                            prev.preferred_style,
                            style.id,
                            4,
                          ),
                        }))
                      }
                    >
                      <span className="text-2xl">{style.emoji}</span>
                      <span className="text-sm">{style.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Favorite Colors</Label>
                <div className="grid grid-cols-6 gap-3 mt-3">
                  {colorOptions.map((color) => (
                    <Button
                      key={color.id}
                      type="button"
                      variant="outline"
                      className={`h-12 w-12 p-0 border-2 ${
                        profileData.favorite_colors.includes(color.id)
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border"
                      }`}
                      style={{ backgroundColor: color.color }}
                      onClick={() =>
                        setProfileData((prev) => ({
                          ...prev,
                          favorite_colors: toggleSelection(
                            prev.favorite_colors,
                            color.id,
                            6,
                          ),
                        }))
                      }
                    >
                      {profileData.favorite_colors.includes(color.id) && (
                        <span className="text-white text-lg">✓</span>
                      )}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  className="flex-1 shadow-button"
                  onClick={handleStylePreferences}
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>What's Your Goal?</CardTitle>
              <CardDescription>
                Why are you here? This helps us tailor your experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {goalOptions.map((goal) => (
                  <Button
                    key={goal.id}
                    type="button"
                    variant={
                      profileData.goals.includes(goal.id)
                        ? "default"
                        : "outline"
                    }
                    className="h-auto p-4 flex items-center gap-3 text-left justify-start"
                    onClick={() =>
                      setProfileData((prev) => ({
                        ...prev,
                        goals: toggleSelection(prev.goals, goal.id, 2),
                      }))
                    }
                  >
                    <span className="text-2xl">{goal.icon}</span>
                    <span>{goal.label}</span>
                  </Button>
                ))}
              </div>

              <div className="flex gap-4 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(3)}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  className="flex-1 shadow-button"
                  onClick={handleGoalSelection}
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Profile..." : "Complete Setup"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
