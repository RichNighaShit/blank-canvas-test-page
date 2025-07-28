import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, MapPin, Thermometer, Droplets, Wind, RefreshCw, AlertCircle, Edit3, Check, X } from 'lucide-react';
import { WeatherData, ManualWeatherEntry } from '@/hooks/useWeather';

interface WeatherWidgetProps {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
  onRefresh?: () => void;
  compact?: boolean;
  showAdvice?: boolean;
  advice?: string;
  showManualEntry?: boolean;
  onManualEntry?: (entry: ManualWeatherEntry) => void;
  onRetryAutomatic?: () => void;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  weather,
  loading,
  error,
  onRefresh,
  compact = false,
  showAdvice = false,
  advice
}) => {
  const getSourceBadgeVariant = (source: WeatherData['source']) => {
    switch (source) {
      case 'gps':
        return 'default';
      case 'profile':
        return 'secondary';
      case 'default':
        return 'outline';
      case 'mock':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getSourceLabel = (source: WeatherData['source']) => {
    switch (source) {
      case 'gps':
        return 'Live GPS';
      case 'profile':
        return 'Profile Location';
      case 'default':
        return 'Default Location';
      case 'mock':
        return 'Simulated';
      default:
        return 'Unknown';
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : weather ? (
          <>
            <span className="text-lg">{weather.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{Math.round(weather.temperature)}°C</div>
              <div className="text-xs text-muted-foreground truncate">{weather.condition}</div>
            </div>
            {error && (
              <AlertCircle className="h-3 w-3 text-amber-500 flex-shrink-0" />
            )}
          </>
        ) : (
          <span className="text-xs text-muted-foreground">Weather unavailable</span>
        )}
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">Weather</span>
          </div>
          
          <div className="flex items-center gap-2">
            {weather && (
              <Badge variant={getSourceBadgeVariant(weather.source)} className="text-xs">
                {getSourceLabel(weather.source)}
              </Badge>
            )}
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={loading}
                className="h-7 w-7 p-0"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading weather...</span>
          </div>
        ) : weather ? (
          <div className="space-y-3">
            {/* Main weather display */}
            <div className="flex items-center gap-3">
              <div className="text-3xl">{weather.icon}</div>
              <div className="flex-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{Math.round(weather.temperature)}</span>
                  <span className="text-lg text-muted-foreground">°C</span>
                </div>
                <div className="text-sm font-medium capitalize">{weather.condition}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {weather.location}
                </div>
              </div>
            </div>

            {/* Weather details */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t">
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-blue-500" />
                <div>
                  <div className="text-xs text-muted-foreground">Humidity</div>
                  <div className="text-sm font-medium">{weather.humidity}%</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Wind className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-xs text-muted-foreground">Wind</div>
                  <div className="text-sm font-medium">{weather.windSpeed} km/h</div>
                </div>
              </div>
            </div>

            {/* Weather advice */}
            {showAdvice && advice && (
              <div className="pt-2 border-t">
                <div className="text-xs text-muted-foreground mb-1">Style Advice</div>
                <div className="text-sm font-medium text-blue-600">{advice}</div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded text-amber-800">
                <AlertCircle className="h-4 w-4 mt-0.5 text-amber-600 flex-shrink-0" />
                <div className="text-xs">{error}</div>
              </div>
            )}

            {/* Timestamp */}
            {weather.timestamp && (
              <div className="text-xs text-muted-foreground">
                Updated {new Date(weather.timestamp).toLocaleTimeString()}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <div className="text-sm text-muted-foreground">
                Weather information unavailable
              </div>
              {error && (
                <div className="text-xs text-muted-foreground mt-1">{error}</div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeatherWidget;
