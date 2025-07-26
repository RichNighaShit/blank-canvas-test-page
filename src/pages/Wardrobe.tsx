import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { WardrobeItemCard } from "@/components/WardrobeItemCard";
import { WardrobeUploadFlow } from "@/components/WardrobeUploadFlow";
import { BatchDeleteWardrobe } from "@/components/BatchDeleteWardrobe";
import Header from "@/components/Header";
import { Search, Filter, Sparkles, Shirt, Grid3X3, List } from "lucide-react";
import { usePerformance } from "@/hooks/usePerformance";
import { PerformanceCache, CACHE_NAMESPACES } from "@/lib/performanceCache";
import { getErrorMessage, logError } from "@/lib/errorUtils";

interface ClothingItem {
  id: string;
  name: string;
  photo_url: string;
  category: string;
  tags: string[];
  color: string[];
  style: string;
  occasion: string[];
  season: string[];
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

const Wardrobe = () => {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ClothingItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();

  // Performance optimization
  const { executeWithCache } = usePerformance({
    cacheNamespace: CACHE_NAMESPACES.WARDROBE_ITEMS,
    enableCaching: true,
    enableMonitoring: true,
  });

  const categories = [
    "tops",
    "bottoms",
    "dresses",
    "outerwear",
    "shoes",
    "accessories",
  ];

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchWardrobeItems();
    }
  }, [user]);

  useEffect(() => {
    filterItems();
  }, [items, selectedCategory, searchQuery]);

  const fetchWardrobeItems = async () => {
    if (!user) return;

    try {
      // Check cache first
      const cacheKey = `wardrobe_items_${user.id}`;
      const cachedItems = PerformanceCache.get<ClothingItem[]>(
        cacheKey,
        CACHE_NAMESPACES.WARDROBE_ITEMS,
      );

      if (cachedItems) {
        setItems(cachedItems);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("wardrobe_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load wardrobe items",
          variant: "destructive",
        });
      } else {
        setItems(data || []);

        // Cache the items for 5 minutes
        PerformanceCache.set(cacheKey, data || [], {
          ttl: 5 * 60 * 1000,
          namespace: CACHE_NAMESPACES.WARDROBE_ITEMS,
        });
      }
    } catch (error) {
      console.error("Error fetching wardrobe items:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = items;

    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          item.style.toLowerCase().includes(query) ||
          item.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          item.color.some((color) => color.toLowerCase().includes(query)),
      );
    }

    setFilteredItems(filtered);
  };

  const handleItemAdded = (newItem: ClothingItem) => {
    setItems((prev) => [newItem, ...prev]);

    // Clear cache to refresh data
    PerformanceCache.clearNamespace(CACHE_NAMESPACES.WARDROBE_ITEMS);

    toast({
      title: "Success",
      description: "Item added to your wardrobe successfully!",
    });
  };

  const updateItem = (id: string, updates: Partial<ClothingItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));

    // Clear cache to ensure fresh data on next load
    PerformanceCache.clearNamespace(CACHE_NAMESPACES.WARDROBE_ITEMS);
  };

  const batchDeleteItems = (ids: string[]) => {
    setItems((prev) => prev.filter((item) => !ids.includes(item.id)));

    // Clear cache to ensure fresh data on next load
    PerformanceCache.clearNamespace(CACHE_NAMESPACES.WARDROBE_ITEMS);
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="flex flex-col items-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center animate-pulse">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <p className="text-muted-foreground text-lg animate-pulse">
            Loading your wardrobe...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-heading mb-2">
                My Wardrobe
              </h1>
              <p className="text-xl text-muted-foreground">
                {filteredItems.length} items • {items.length} total
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="card-premium">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Shirt className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {items.filter((i) => i.category === "tops").length}
                    </p>
                    <p className="text-sm text-muted-foreground">Tops</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-premium">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Shirt className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {items.filter((i) => i.category === "bottoms").length}
                    </p>
                    <p className="text-sm text-muted-foreground">Bottoms</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-premium">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Shirt className="h-5 w-5 text-pink-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {items.filter((i) => i.category === "dresses").length}
                    </p>
                    <p className="text-sm text-muted-foreground">Dresses</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-premium">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Shirt className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {items.filter((i) => i.category === "shoes").length}
                    </p>
                    <p className="text-sm text-muted-foreground">Shoes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Upload Section */}
        <div className="mb-8">
          <WardrobeUploadFlow onItemAdded={handleItemAdded} />
        </div>

        {/* Controls */}
        <div className="mb-8 space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search your wardrobe..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Batch Actions */}
          {filteredItems.length > 0 && (
            <BatchDeleteWardrobe
              items={filteredItems}
              onDelete={batchDeleteItems}
            />
          )}
        </div>

        {/* Items Grid */}
        {filteredItems.length === 0 && !loading ? (
          <Card className="text-center p-12">
            <CardContent>
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shirt className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Your Wardrobe is Empty
              </h3>
              <p className="text-muted-foreground mb-4">
                Start building your digital wardrobe by uploading photos of your
                clothes.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div
            className={`grid gap-6 ${
              viewMode === "grid"
                ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                : "grid-cols-1"
            }`}
          >
            {filteredItems.map((item) => (
              <WardrobeItemCard
                key={item.id}
                item={item}
                onUpdate={updateItem}
                onDelete={deleteItem}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wardrobe;
