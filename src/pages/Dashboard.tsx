import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useWeather } from "@/hooks/useWeather";
import { supabase } from "@/integrations/supabase/client";
import WeatherWidget from "@/components/WeatherWidget";
import Header from "@/components/Header";
import {
  Sparkles,
  Shirt,
  TrendingUp,
  Calendar,
  Target,
  Award,
  Zap,
  Crown,
  Star,
  Clock,
  Users,
  Activity,
  BarChart3,
  Palette,
  MapPin,
  Thermometer,
  Droplets,
  Wind,
  Sun,
  Cloud,
  CloudRain,
  Snowflake,
  Eye,
  Heart,
  ShoppingBag,
  Camera,
  Plus,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  CloudOff,
} from "lucide-react";
import { usePerformance } from "@/hooks/usePerformance";
import { PerformanceCache, CACHE_NAMESPACES } from "@/lib/performanceCache";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { getErrorMessage, logError } from "@/lib/errorUtils";

interface WardrobeStats {
  totalItems: number;
  categories: Record<string, number>;
  recentAdditions: number;
  styleDiversity: number;
  completionRate: number;
}

interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  location: string;
  description: string;
}

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const {
    weather,
    loading: weatherLoading,
    error: weatherError,
    fetchWeather,
    getWeatherAdvice,
    getWeatherStatus,
  } = useWeather(profile?.location);
  const navigate = useNavigate();
  const { handleError, handleApiError, logUserAction } = useErrorHandler();

  const [stats, setStats] = useState<WardrobeStats>({
    totalItems: 0,
    categories: {},
    recentAdditions: 0,
    styleDiversity: 0,
    completionRate: 0,
  });

  const [loading, setLoading] = useState(true);
  const quickActions = useMemo(
    () => [
      {
        id: 1,
        title: "Add New Item",
        icon: Plus,
        action: () => navigate("/wardrobe"),
        color: "purple",
      },
      {
        id: 2,
        title: "Get Recommendations",
        icon: Sparkles,
        action: () => navigate("/recommendations"),
        color: "pink",
      },
      {
        id: 3,
        title: "Advanced Try-On",
        icon: Camera,
        action: () => navigate("/virtual-try-on"),
        color: "blue",
      },
      {
        id: 4,
        title: "Style Analytics",
        icon: BarChart3,
        action: () => navigate("/analytics"),
        color: "green",
      },
    ],
    [navigate],
  );

  // Performance optimization
  const { executeWithCache } = usePerformance({
    cacheNamespace: CACHE_NAMESPACES.DASHBOARD,
    enableCaching: true,
    enableMonitoring: true,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Check cache first
      const cacheKey = `dashboard_stats_${user.id}`;
      const cachedStats = PerformanceCache.get<WardrobeStats>(
        cacheKey,
        CACHE_NAMESPACES.DASHBOARD,
      );

      if (cachedStats) {
        setStats(cachedStats);
        setLoading(false);
        return;
      }

      // Fetch wardrobe items
      const { data: items, error: itemsError } = await supabase
        .from("wardrobe_items")
        .select("*")
        .eq("user_id", user.id);

      if (itemsError) {
        logError(itemsError, "Error fetching wardrobe items in Dashboard");
        return;
      }

      // Calculate stats
      const categories = items.reduce(
        (acc, item) => {
          acc[item.category] = (acc[item.category] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      const recentAdditions = items.filter((item) => {
        const createdAt = new Date(item.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return createdAt > weekAgo;
      }).length;

      const uniqueStyles = new Set(items.map((item) => item.style)).size;
      const styleDiversity = Math.min((uniqueStyles / 8) * 100, 100); // 8 is max styles

      const completionRate = Math.min((items.length / 50) * 100, 100); // 50 items = 100%

      const newStats: WardrobeStats = {
        totalItems: items.length,
        categories,
        recentAdditions,
        styleDiversity,
        completionRate,
      };

      setStats(newStats);

      // Cache stats for 5 minutes
      PerformanceCache.set(cacheKey, newStats, {
        ttl: 5 * 60 * 1000,
        namespace: CACHE_NAMESPACES.DASHBOARD,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };



  const getCompletionMessage = () => {
    if (stats.completionRate < 20) return "Just getting started!";
    if (stats.completionRate < 50) return "Great progress!";
    if (stats.completionRate < 80) return "Almost there!";
    return "Wardrobe complete!";
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="flex flex-col items-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center animate-pulse">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <p className="text-muted-foreground text-lg animate-pulse">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }



  return (
    <div className="min-h-screen bg-gradient-hero">
      <Header />

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Welcome Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-heading mb-2">
                Welcome back, {profile?.display_name || "Fashionista"}!
              </h1>
              <p className="text-xl text-muted-foreground">
                Your personalized style assistant is ready to help
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-sm">
                <Crown className="h-3 w-3 mr-1" />
                Member
              </Badge>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <Card className="card-premium">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Shirt className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.totalItems}</p>
                    <p className="text-sm text-muted-foreground">Total Items</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-premium">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {stats.recentAdditions}
                    </p>
                    <p className="text-sm text-muted-foreground">This Week</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-premium">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Palette className="h-5 w-5 text-pink-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {Math.round(stats.styleDiversity)}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Style Diversity
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-premium">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {Math.round(stats.completionRate)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Complete</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <Card className="card-premium">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  <span>Quick Actions</span>
                </CardTitle>
                <CardDescription>
                  Jump into your favorite features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {quickActions.map((action) => (
                    <Button
                      key={action.id}
                      variant="outline"
                      className="h-20 flex flex-col items-center justify-center space-y-2 hover:scale-105 transition-transform"
                      onClick={action.action}
                    >
                      <action.icon
                        className={`h-6 w-6 text-${action.color}-600`}
                      />
                      <span className="text-sm font-medium">
                        {action.title}
                      </span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Wardrobe Progress */}
            <Card className="card-premium">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <span>Wardrobe Progress</span>
                </CardTitle>
                <CardDescription>{getCompletionMessage()}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Completion</span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(stats.completionRate)}%
                    </span>
                  </div>
                  <Progress value={stats.completionRate} className="h-2" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(stats.categories).map(([category, count]) => (
                    <div key={category} className="text-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Shirt className="h-6 w-6 text-white" />
                      </div>
                      <p className="text-lg font-bold">{count}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {category}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="card-premium">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  <span>Recent Activity</span>
                </CardTitle>
                <CardDescription>Your latest wardrobe updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Plus className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Added {stats.recentAdditions} new items
                      </p>
                      <p className="text-xs text-muted-foreground">This week</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        AI analyzed your style
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Style diversity: {Math.round(stats.styleDiversity)}%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Target className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Wardrobe completion</p>
                      <p className="text-xs text-muted-foreground">
                        {Math.round(stats.completionRate)}% complete
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Weather Widget */}
            <WeatherWidget
              weather={weather}
              loading={weatherLoading}
              error={weatherError}
              onRefresh={() => fetchWeather()}
              showAdvice={true}
              advice={weather ? getWeatherAdvice(weather) : undefined}
            />

            {/* Style Insights */}
            <Card className="card-premium">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-600" />
                  <span>Style Insights</span>
                </CardTitle>
                <CardDescription>
                  Curated recommendations just for you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Great style diversity</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Balanced color palette</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Consider adding accessories</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">More formal options needed</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/recommendations")}
                >
                  Get Recommendations
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Performance Stats */}
            <Card className="card-premium">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  <span>Performance</span>
                </CardTitle>
                <CardDescription>System optimization stats</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cache Hit Rate</span>
                    <span className="text-sm font-medium">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Image Optimization</span>
                    <span className="text-sm font-medium">85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Load Time</span>
                    <span className="text-sm font-medium">1.2s</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
