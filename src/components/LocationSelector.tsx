import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Search, 
  Loader2, 
  Check, 
  ChevronDown, 
  X,
  Navigation,
  AlertCircle 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { withNetworkRetry, getNetworkErrorMessage } from '@/lib/networkUtils';

interface LocationResult {
  id: string;
  name: string;
  country: string;
  admin1?: string; // State/Province
  latitude: number;
  longitude: number;
  population?: number;
  timezone?: string;
  displayName: string;
}

interface LocationSelectorProps {
  value: string;
  onChange: (location: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  label?: string;
  error?: string;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  value,
  onChange,
  placeholder = "Search for a city...",
  required = false,
  className,
  label = "Location",
  error
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [locations, setLocations] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Popular cities for quick selection
  const popularCities = [
    'London, United Kingdom',
    'New York, United States',
    'Paris, France',
    'Tokyo, Japan',
    'Sydney, Australia',
    'Toronto, Canada',
    'Berlin, Germany',
    'Dubai, United Arab Emirates',
    'Singapore, Singapore',
    'Mumbai, India',
    'São Paulo, Brazil',
    'Mexico City, Mexico'
  ];

  // Debounced search function
  const searchLocations = useCallback(
    async (query: string) => {
      if (!query || query.length < 2) {
        setLocations([]);
        return;
      }

      setLoading(true);
      setSearchError(null);

      try {
        const response = await withNetworkRetry(
          () => fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`,
            {
              method: 'GET',
              headers: { 'Accept': 'application/json' },
              signal: AbortSignal.timeout(5000)
            }
          ),
          { retries: 1, timeout: 6000 }
        );

        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.results && Array.isArray(data.results)) {
          const formattedResults: LocationResult[] = data.results.map((result: any, index: number) => ({
            id: `${result.latitude}-${result.longitude}-${index}`,
            name: result.name,
            country: result.country,
            admin1: result.admin1,
            latitude: result.latitude,
            longitude: result.longitude,
            population: result.population,
            timezone: result.timezone,
            displayName: result.admin1 
              ? `${result.name}, ${result.admin1}, ${result.country}`
              : `${result.name}, ${result.country}`
          }));

          setLocations(formattedResults);
        } else {
          setLocations([]);
        }
      } catch (error) {
        const errorMessage = getNetworkErrorMessage(error);
        console.warn('Location search failed:', errorMessage);
        setSearchError(errorMessage);
        setLocations([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Debounce search queries
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchLocations(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchLocations]);

  // Get current GPS location
  const getCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setSearchError("Geolocation is not supported by this browser");
      return;
    }

    setGpsLoading(true);
    setSearchError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 5 * 60 * 1000
          }
        );
      });

      // Reverse geocode the coordinates
      const response = await withNetworkRetry(
        () => fetch(
          `https://geocoding-api.open-meteo.com/v1/search?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&count=1&language=en&format=json`,
          {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(5000)
          }
        ),
        { retries: 1, timeout: 6000 }
      );

      if (!response.ok) {
        throw new Error(`Reverse geocoding failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.results && data.results[0]) {
        const result = data.results[0];
        const locationName = result.admin1 
          ? `${result.name}, ${result.admin1}, ${result.country}`
          : `${result.name}, ${result.country}`;
        
        onChange(locationName);
        setOpen(false);
      } else {
        throw new Error("Could not determine your location");
      }
    } catch (error: any) {
      let errorMessage = "Could not get your location";
      
      if (error.code === 1) {
        errorMessage = "Location access denied";
      } else if (error.code === 2) {
        errorMessage = "Location unavailable";
      } else if (error.code === 3) {
        errorMessage = "Location request timed out";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setSearchError(errorMessage);
    } finally {
      setGpsLoading(false);
    }
  }, [onChange]);

  const handleSelect = (location: LocationResult | string) => {
    if (typeof location === 'string') {
      onChange(location);
    } else {
      onChange(location.displayName);
    }
    setOpen(false);
    setSearchQuery("");
  };

  const clearSelection = () => {
    onChange("");
    setSearchQuery("");
    setLocations([]);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-sm font-medium">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn(
                "w-full justify-between text-left font-normal",
                !value && "text-muted-foreground",
                error && "border-destructive"
              )}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate">
                  {value || placeholder}
                </span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {value && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearSelection();
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
                <ChevronDown className="h-4 w-4 opacity-50" />
              </div>
            </Button>
          </PopoverTrigger>
          
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <div className="flex items-center border-b px-3">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <CommandInput
                  placeholder="Search cities worldwide..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                />
                {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              </div>

              <CommandList>
                {/* GPS Location Option */}
                <CommandGroup heading="Current Location">
                  <CommandItem
                    onSelect={getCurrentLocation}
                    className="flex items-center gap-2 cursor-pointer"
                    disabled={gpsLoading}
                  >
                    {gpsLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Navigation className="h-4 w-4 text-blue-500" />
                    )}
                    <span>Use my current location</span>
                  </CommandItem>
                </CommandGroup>

                {/* Search Results */}
                {searchQuery && (
                  <CommandGroup heading="Search Results">
                    {loading ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-sm text-muted-foreground">Searching...</span>
                      </div>
                    ) : searchError ? (
                      <div className="flex items-center gap-2 py-6 px-4">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        <span className="text-sm text-destructive">{searchError}</span>
                      </div>
                    ) : locations.length > 0 ? (
                      locations.map((location) => (
                        <CommandItem
                          key={location.id}
                          onSelect={() => handleSelect(location)}
                          className="flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div className="flex flex-col">
                              <span className="text-sm">{location.displayName}</span>
                              {location.population && (
                                <span className="text-xs text-muted-foreground">
                                  Population: {location.population.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                          {value === location.displayName && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </CommandItem>
                      ))
                    ) : (
                      <CommandEmpty>No locations found.</CommandEmpty>
                    )}
                  </CommandGroup>
                )}

                {/* Popular Cities */}
                {!searchQuery && (
                  <CommandGroup heading="Popular Cities">
                    {popularCities.map((city) => (
                      <CommandItem
                        key={city}
                        onSelect={() => handleSelect(city)}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{city}</span>
                        </div>
                        {value === city && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Status badges */}
      {value && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            <MapPin className="h-3 w-3 mr-1" />
            Location set
          </Badge>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
};

export default LocationSelector;
