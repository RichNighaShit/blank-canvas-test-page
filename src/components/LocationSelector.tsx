import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    'Mexico City, Mexico',
    'Lahore, Pakistan',
    'Karachi, Pakistan',
    'Islamabad, Pakistan',
    'Rawalpindi, Pakistan'
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search locations using geocoding API
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
      if (searchQuery) {
        searchLocations(searchQuery);
      } else {
        setLocations([]);
      }
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
        setSearchQuery("");
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

  const toggleDropdown = () => {
    setOpen(!open);
    if (!open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-sm font-medium">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      
      <div className="relative" ref={dropdownRef}>
        {/* Main Input Button */}
        <Button
          type="button"
          variant="outline"
          onClick={toggleDropdown}
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
              <span
                className="h-4 w-4 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground rounded cursor-pointer transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  clearSelection();
                }}
              >
                <X className="h-3 w-3" />
              </span>
            )}
            <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
          </div>
        </Button>

        {/* Dropdown Content */}
        {open && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 max-h-80 overflow-hidden">
            {/* Search Input */}
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  placeholder="Search cities worldwide..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
                />
                {loading && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
                )}
              </div>
            </div>

            {/* Dropdown List */}
            <div className="max-h-60 overflow-y-auto">
              {/* GPS Location Option */}
              <div className="p-2 border-b">
                <div className="text-xs font-medium text-muted-foreground mb-2">Current Location</div>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={gpsLoading}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent rounded-sm text-left"
                >
                  {gpsLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Navigation className="h-4 w-4 text-blue-500" />
                  )}
                  <span className="text-sm">Use my current location</span>
                </button>
              </div>

              {/* Search Results */}
              {searchQuery && (
                <div className="p-2 border-b">
                  <div className="text-xs font-medium text-muted-foreground mb-2">Search Results</div>
                  {loading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm text-muted-foreground">Searching...</span>
                    </div>
                  ) : searchError ? (
                    <div className="flex items-center gap-2 py-4 px-2 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">{searchError}</span>
                    </div>
                  ) : locations.length > 0 ? (
                    locations.map((location) => (
                      <button
                        key={location.id}
                        type="button"
                        onClick={() => handleSelect(location)}
                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-accent rounded-sm text-left"
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
                      </button>
                    ))
                  ) : (
                    <div className="py-4 px-2 text-center text-sm text-muted-foreground">
                      No locations found for "{searchQuery}"
                    </div>
                  )}
                </div>
              )}

              {/* Popular Cities */}
              {!searchQuery && (
                <div className="p-2">
                  <div className="text-xs font-medium text-muted-foreground mb-2">Popular Cities</div>
                  {popularCities.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => handleSelect(city)}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-accent rounded-sm text-left"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{city}</span>
                      </div>
                      {value === city && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
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
