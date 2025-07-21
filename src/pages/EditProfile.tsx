import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { useToast } from "@/hooks/use-toast";
import { Shirt, Palette, Target, Shuffle, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, invalidateProfileCache } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { PhotoUpload } from "@/components/PhotoUpload";
import { SimplePhotoUploadTest } from "@/components/SimplePhotoUploadTest";

const styleOptions = [
  { id: "streetwear", label: "Streetwear", icon: Shirt },
  { id: "casual", label: "Casual", icon: Shirt },
  { id: "formal", label: "Formal", icon: Shirt },
  { id: "bohemian", label: "Bohemian", icon: Palette },
  { id: "minimalist", label: "Minimalist", icon: Shirt },
  { id: "vintage", label: "Vintage", icon: Shirt },
  { id: "sporty", label: "Sporty", icon: Shirt },
  { id: "elegant", label: "Elegant", icon: Palette },
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
  { id: "organize", label: "Organize my wardrobe", icon: Target },
  { id: "outfits", label: "Find better outfits", icon: Palette },
  { id: "upgrade", label: "Upgrade my look", icon: Target },
  { id: "surprise", label: "I don't know, surprise me", icon: Shuffle },
];

function toggleSelection(
  array: string[],
  item: string,
  max?: number,
): string[] {
  const newArray = array.includes(item)
    ? array.filter((i) => i !== item)
    : max && array.length >= max
      ? array
      : [...array, item];
  return newArray;
}

const EditProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, refetch } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    display_name: "",
    location: "",
    gender_identity: "",
    preferred_style: "",
    favorite_colors: [] as string[],
    color_palette_colors: [] as string[],
    goals: [] as string[],
    face_photo_url: "",
  });

  useEffect(() => {
    if (profile) {
      console.log("Profile data loaded:", profile);
      setForm({
        display_name: profile.display_name || "",
        location: profile.location || "",
        gender_identity: profile.gender_identity || "",
        preferred_style: profile.preferred_style || "",
        favorite_colors: Array.isArray(profile.favorite_colors)
          ? profile.favorite_colors
          : [],
        color_palette_colors: Array.isArray(profile.color_palette_colors)
          ? profile.color_palette_colors
          : [],
        goals: Array.isArray(profile.goals) ? profile.goals : [],
        face_photo_url: profile.face_photo_url || "",
      });
    }
  }, [profile]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  const handleChange = (field: keyof typeof form, value: any) => {
    console.log("Form field change:", field, value);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoAnalysis = (analysisResult: any) => {
    console.log("Photo analysis result:", analysisResult);
    if (analysisResult?.imageUrl) {
      setForm((prev) => ({
        ...prev,
        face_photo_url: analysisResult.imageUrl,
        // Store extracted colors in color_palette_colors, not favorite_colors
        color_palette_colors:
          analysisResult.colors && Array.isArray(analysisResult.colors)
            ? analysisResult.colors.slice(0, 6)
            : prev.color_palette_colors || [],
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    console.log("Submitting form:", form);
    setIsSaving(true);

    try {
      // Validate required fields
      if (!form.display_name.trim()) {
        toast({
          title: "Error",
          description: "Display name is required",
          variant: "destructive",
        });
        return;
      }

      if (!form.location.trim()) {
        toast({
          title: "Error",
          description: "Location is required",
          variant: "destructive",
        });
        return;
      }

      const updateData = {
        display_name: form.display_name.trim(),
        location: form.location.trim(),
        gender_identity: form.gender_identity || null,
        preferred_style: form.preferred_style || null,
        favorite_colors: form.favorite_colors,
        color_palette_colors: form.color_palette_colors,
        goals: form.goals,
        face_photo_url: form.face_photo_url || null,
      };

      console.log("Updating profile with data:", updateData);

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("user_id", user.id);

      if (error) {
        console.error("Update error:", error);
        toast({
          title: "Error",
          description: `Failed to update profile: ${error.message}`,
          variant: "destructive",
        });
      } else {
        console.log("Profile updated successfully");
        toast({
          title: "Success!",
          description: "Your profile has been updated successfully.",
        });
        // Force global cache invalidation and refetch
        invalidateProfileCache(user.id);
        await refetch();
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while updating your profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Edit Your Profile</h1>
          <p className="text-muted-foreground">
            Update your style preferences and personal info
          </p>
        </div>
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>
              Make changes to your style profile below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div>
                    <Label htmlFor="display_name">Name *</Label>
                    <Input
                      id="display_name"
                      value={form.display_name}
                      onChange={(e) =>
                        handleChange("display_name", e.target.value)
                      }
                      placeholder="What should we call you?"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      value={form.location}
                      onChange={(e) => handleChange("location", e.target.value)}
                      placeholder="City, Country"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender_identity">Gender Identity</Label>
                    <Select
                      value={form.gender_identity}
                      onValueChange={(value) =>
                        handleChange("gender_identity", value)
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
                </div>
                                                <div className="flex-1 space-y-4">
                  <Label>Profile Photo</Label>
                  <PhotoUpload onAnalysisComplete={handlePhotoAnalysis} />

                  {/* DEBUG: Simple upload test */}
                  <SimplePhotoUploadTest />
                </div>
              </div>
              <div>
                <Label className="text-base font-medium">Fashion Style</Label>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {styleOptions.map((style) => (
                    <Button
                      key={style.id}
                      type="button"
                      variant={
                        form.preferred_style === style.id
                          ? "default"
                          : "outline"
                      }
                      className="h-auto p-4 flex flex-col items-center gap-2"
                      onClick={() => handleChange("preferred_style", style.id)}
                    >
                      <style.icon className="h-6 w-6" />
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
                      className={`h-12 w-12 p-0 border-2 ${form.favorite_colors.includes(color.id) ? "border-primary ring-2 ring-primary/20" : "border-border"}`}
                      style={{ backgroundColor: color.color }}
                      onClick={() =>
                        handleChange(
                          "favorite_colors",
                          toggleSelection(form.favorite_colors, color.id, 6),
                        )
                      }
                    >
                      {form.favorite_colors.includes(color.id) && (
                        <Check className="h-4 w-4 text-white" />
                      )}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-base font-medium">Goals</Label>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {goalOptions.map((goal) => (
                    <Button
                      key={goal.id}
                      type="button"
                      variant={
                        form.goals.includes(goal.id) ? "default" : "outline"
                      }
                      className="h-auto p-4 flex items-center gap-3 text-left justify-start"
                      onClick={() =>
                        handleChange(
                          "goals",
                          toggleSelection(form.goals, goal.id, 2),
                        )
                      }
                    >
                      <goal.icon className="h-6 w-6" />
                      <span>{goal.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="shadow-button"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditProfile;
