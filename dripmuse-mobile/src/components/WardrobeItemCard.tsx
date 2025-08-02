import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { OptimizedImage } from "./OptimizedImage";

interface WardrobeItem {
  id: string;
  name: string;
  photo_url: string;
  category: string;
  color: string[];
  style: string;
  occasion: string[];
  season: string[];
  tags: string[];
  created_at?: string;
  updated_at?: string;
}

interface WardrobeItemCardProps {
  item: WardrobeItem;
  onUpdate: (id: string, updates: Partial<WardrobeItem>) => void;
  onDelete: (id: string) => void;
  viewMode: "grid" | "list";
}

export const WardrobeItemCard = ({
  item,
  onUpdate,
  onDelete,
  viewMode,
}: WardrobeItemCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedItem, setEditedItem] = useState<WardrobeItem>(item);
  const [isSaving, setIsSaving] = useState(false);
  const [isFindingSimilar, setIsFindingSimilar] = useState(false);

  // Reset edited item when dialog opens/closes or item changes
  useEffect(() => {
    setEditedItem(item);
  }, [item, isEditing]);
  const { toast } = useToast();

  const categories = [
    "tops",
    "bottoms",
    "dresses",
    "outerwear",
    "shoes",
    "accessories",
  ];
  const styles = [
    "casual",
    "formal",
    "sporty",
    "elegant",
    "bohemian",
    "minimalist",
    "streetwear",
    "vintage",
  ];
  const occasions = [
    "casual",
    "work",
    "formal",
    "party",
    "sport",
    "travel",
    "date",
  ];
  const seasons = ["spring", "summer", "fall", "winter"];
  const availableColors = [
    "black",
    "white",
    "red",
    "blue",
    "green",
    "yellow",
    "purple",
    "pink",
    "orange",
    "gray",
    "brown",
    "navy",
    "beige",
  ];

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("wardrobe_items")
        .update({
          name: editedItem.name,
          category: editedItem.category,
          color: editedItem.color,
          style: editedItem.style,
          occasion: editedItem.occasion,
          season: editedItem.season,
          tags: editedItem.tags,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      if (error) throw error;

      onUpdate(item.id, editedItem);
      setIsEditing(false);

      toast({
        title: "Item Updated",
        description: "Your wardrobe item has been successfully updated.",
      });
    } catch (error) {
      console.error("Error updating item:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update the item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("wardrobe_items")
        .delete()
        .eq("id", item.id);

      if (error) throw error;

      onDelete(item.id);
      setIsEditing(false); // Close the dialog after successful deletion

      toast({
        title: "Item Deleted",
        description: "The item has been removed from your wardrobe.",
      });
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete the item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleArrayValue = (array: string[], value: string) => {
    return array.includes(value)
      ? array.filter((item) => item !== value)
      : [...array, value];
  };

  const addedDate = item.created_at
    ? new Date(item.created_at).toLocaleDateString()
    : "Unknown";

  // Visual Similarity Search Handler
  const handleFindSimilar = async () => {
    setIsFindingSimilar(true);
    try {
      // Simple Google Images search for similar items
      window.open(
        `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(item.name + " " + item.style)}`,
        "_blank",
      );
    } catch (error) {
      toast({
        title: "Visual Search Failed",
        description: "Could not find similar items online. Try again later.",
        variant: "destructive",
      });
    } finally {
      setIsFindingSimilar(false);
    }
  };

  return (
    <Dialog open={isEditing} onOpenChange={setIsEditing}>
      <DialogTrigger asChild>
        <Card className="group cursor-pointer hover:shadow-elegant transition-all duration-300 hover:scale-105 shadow-card">
          <div className="aspect-square sm:aspect-square relative overflow-hidden rounded-t-lg">
            <OptimizedImage
              src={item.photo_url}
              alt={item.name}
              className="w-full h-full object-cover sm:object-cover object-contain group-hover:scale-110 transition-transform duration-300"
              lazy={true}
              width={300}
              height={300}
            />
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="text-xs">
                {item.category}
              </Badge>
            </div>
            <div className="absolute bottom-2 left-2 right-2">
              <div className="flex flex-wrap gap-1">
                {item.color.slice(0, 3).map((color) => (
                  <div
                    key={color}
                    className="w-3 h-3 rounded-full border border-white/50"
                    style={{ backgroundColor: getColorHex(color) }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>
          <CardContent className="p-3">
            <h3 className="font-medium truncate">{item.name}</h3>
            <p className="text-sm text-muted-foreground capitalize">
              {item.style}
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {item.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            {/* Visual Similarity Search Button */}
            <div className="mt-3 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                className="shadow-button flex items-center gap-2"
                onClick={handleFindSimilar}
                disabled={isFindingSimilar}
              >
                {isFindingSimilar ? (
                  <Loader2 className="animate-spin w-4 h-4" />
                ) : null}
                Find Similar Online
              </Button>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Wardrobe Item</DialogTitle>
          <DialogDescription>
            Update the details and tags for your clothing item
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Image Preview */}
          <div className="space-y-4">
            <div className="aspect-square relative overflow-hidden rounded-lg border">
              <img
                src={item.photo_url}
                alt={item.name}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                style={{ backgroundColor: "#f3f4f6" }}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Added: {addedDate}</p>
              {item.updated_at && (
                <p>
                  Last updated: {new Date(item.updated_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {/* Edit Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Item Name</Label>
              <Input
                id="name"
                value={editedItem.name}
                onChange={(e) =>
                  setEditedItem((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Blue Cotton T-Shirt"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={editedItem.category}
                onValueChange={(value) =>
                  setEditedItem((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="style">Style</Label>
              <Select
                value={editedItem.style}
                onValueChange={(value) =>
                  setEditedItem((prev) => ({ ...prev, style: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {styles.map((style) => (
                    <SelectItem key={style} value={style}>
                      {style.charAt(0).toUpperCase() + style.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Colors</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {availableColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      editedItem.color.includes(color)
                        ? "border-primary ring-2 ring-primary/20 scale-110"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    style={{ backgroundColor: getColorHex(color) }}
                    onClick={() =>
                      setEditedItem((prev) => ({
                        ...prev,
                        color: toggleArrayValue(prev.color, color),
                      }))
                    }
                    title={color}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {editedItem.color.map((color) => (
                  <Badge key={color} variant="outline" className="text-xs">
                    {color}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Occasions</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {occasions.map((occasion) => (
                  <Badge
                    key={occasion}
                    variant={
                      editedItem.occasion.includes(occasion)
                        ? "default"
                        : "outline"
                    }
                    className="cursor-pointer transition-all hover:scale-105"
                    onClick={() =>
                      setEditedItem((prev) => ({
                        ...prev,
                        occasion: toggleArrayValue(prev.occasion, occasion),
                      }))
                    }
                  >
                    {occasion}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Seasons</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {seasons.map((season) => (
                  <Badge
                    key={season}
                    variant={
                      editedItem.season.includes(season) ? "default" : "outline"
                    }
                    className="cursor-pointer transition-all hover:scale-105"
                    onClick={() =>
                      setEditedItem((prev) => ({
                        ...prev,
                        season: toggleArrayValue(prev.season, season),
                      }))
                    }
                  >
                    {season}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="tags">Custom Tags</Label>
              <Input
                id="tags"
                value={editedItem.tags.join(", ")}
                onChange={(e) =>
                  setEditedItem((prev) => ({
                    ...prev,
                    tags: e.target.value
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter(Boolean),
                  }))
                }
                placeholder="e.g., comfortable, favorite, new"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Separate tags with commas
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditedItem(item);
                  setIsEditing(false);
                }}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const getColorHex = (colorName: string): string => {
  const colorMap: Record<string, string> = {
    black: "#000000",
    white: "#ffffff",
    red: "#dc2626",
    blue: "#2563eb",
    green: "#16a34a",
    yellow: "#eab308",
    purple: "#7c3aed",
    pink: "#ec4899",
    orange: "#ea580c",
    gray: "#6b7280",
    brown: "#92400e",
    navy: "#1e3a8a",
    beige: "#f5f5dc",
  };

  return colorMap[colorName.toLowerCase()] || "#6b7280";
};
