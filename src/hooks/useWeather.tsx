import { useState, useEffect, useCallback } from "react";
import { getNetworkConfig, shouldUseMockData, withNetworkRetry, isOnline } from "@/lib/networkUtils";
import { getErrorMessage, logError } from "@/lib/errorUtils";

export interface WeatherData {
  temperature: number; // Celsius
  condition: string; // clear, rain, snow, clouds, thunderstorm
  humidity: number;
  windSpeed: number;
  description: string;
  location: string;
  source: "profile" | "gps" | "manual" | "mock";
  timestamp: number;
  icon: string;
  isManualEntry?: boolean;
}

export interface ManualWeatherEntry {
  temperature: number;
  condition: string;
  location: string;
}

interface CachedWeatherData extends WeatherData {
  cacheTimestamp: number;
}

// Weather cache with 10 minute expiry
const WEATHER_CACHE_KEY = 'dripmuse_weather_cache';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Weather condition mapping
const WEATHER_CONDITIONS = {
  clear: { icon: '☀️', description: 'Clear skies' },
  clouds: { icon: '☁️', description: 'Cloudy' },
  rain: { icon: '🌧️', description: 'Rainy' },
  snow: { icon: '❄️', description: 'Snowy' },
  thunderstorm: { icon: '⛈️', description: 'Thunderstorm' },
  mist: { icon: '🌫️', description: 'Misty' },
  fog: { icon: '🌫️', description: 'Foggy' }
};

export const useWeather = (profileLocation?: string) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationPermission, setLocationPermission] = useState<
    "granted" | "denied" | "prompt" | "unavailable"
  >("prompt");
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualWeather, setManualWeather] = useState<ManualWeatherEntry | null>(null);

  // Load cached weather data
  const loadCachedWeather = useCallback((): WeatherData | null => {
    try {
      const cached = localStorage.getItem(WEATHER_CACHE_KEY);
      if (cached) {
        const data: CachedWeatherData = JSON.parse(cached);
        const now = Date.now();
        if (now - data.cacheTimestamp < CACHE_DURATION) {
          console.log('Using cached weather data');
          return data;
        } else {
          localStorage.removeItem(WEATHER_CACHE_KEY);
        }
      }
    } catch (error) {
      console.warn('Failed to load cached weather:', error);
      localStorage.removeItem(WEATHER_CACHE_KEY);
    }
    return null;
  }, []);

  // Cache weather data
  const cacheWeatherData = useCallback((weatherData: WeatherData) => {
    try {
      const cacheData: CachedWeatherData = {
        ...weatherData,
        cacheTimestamp: Date.now()
      };
      localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache weather data:', error);
    }
  }, []);

  // Generate realistic mock weather based on location and season
  const generateMockWeather = useCallback((locationName?: string): WeatherData => {
    const hour = new Date().getHours();
    const month = new Date().getMonth();
    const isDay = hour >= 6 && hour <= 18;
    const season = Math.floor(month / 3); // 0=winter, 1=spring, 2=summer, 3=fall

    // Seasonal temperature ranges
    const tempRanges = {
      0: { min: -5, max: 10 },  // Winter
      1: { min: 10, max: 22 },  // Spring
      2: { min: 20, max: 35 },  // Summer
      3: { min: 5, max: 20 }    // Fall
    };

    const range = tempRanges[season as keyof typeof tempRanges];
    const baseTemp = range.min + Math.random() * (range.max - range.min);
    const timeVariation = isDay ? 2 : -3;
    const temperature = Math.round(baseTemp + timeVariation);

    // Weather conditions with seasonal probabilities
    const conditions = ['clear', 'clouds', 'rain', 'mist'];
    const seasonalWeights = {
      0: [0.3, 0.4, 0.2, 0.1], // Winter - more clouds/rain
      1: [0.5, 0.3, 0.15, 0.05], // Spring - more clear
      2: [0.7, 0.2, 0.05, 0.05], // Summer - mostly clear
      3: [0.4, 0.3, 0.25, 0.05]  // Fall - mixed
    };

    const weights = seasonalWeights[season as keyof typeof seasonalWeights];
    const random = Math.random();
    let condition = 'clear';
    let cumulative = 0;
    
    for (let i = 0; i < conditions.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        condition = conditions[i];
        break;
      }
    }

    const weatherInfo = WEATHER_CONDITIONS[condition as keyof typeof WEATHER_CONDITIONS];
    const location = locationName || defaultLocation || "Your area";

    return {
      temperature,
      condition,
      humidity: Math.round(40 + Math.random() * 40),
      windSpeed: Math.round(2 + Math.random() * 15),
      description: `${weatherInfo.description} in ${location}`,
      location,
      source: "mock",
      timestamp: Date.now(),
      icon: weatherInfo.icon
    };
  }, [defaultLocation]);

  // Get user's GPS location
  const getCurrentPosition = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      const options = {
        enableHighAccuracy: false, // Faster, less battery
        timeout: 10000, // 10 seconds
        maximumAge: 5 * 60 * 1000, // 5 minutes cache
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationPermission("granted");
          resolve(position);
        },
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setLocationPermission("denied");
              reject(new Error("Location access denied"));
              break;
            case error.POSITION_UNAVAILABLE:
              reject(new Error("Location unavailable"));
              break;
            case error.TIMEOUT:
              reject(new Error("Location request timed out"));
              break;
            default:
              reject(new Error("Location error"));
          }
        },
        options
      );
    });
  }, []);

  // Fetch weather by coordinates using Open-Meteo API
  const fetchWeatherByCoordinates = useCallback(async (
    latitude: number,
    longitude: number,
    locationName?: string
  ): Promise<WeatherData> => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relative_humidity_2m,windspeed_10m&timezone=auto&forecast_days=1`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000) // 8 second timeout
    });

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.current_weather) {
      throw new Error("Invalid weather data received");
    }

    const current = data.current_weather;
    
    // Get additional data from hourly if available
    let humidity = 60;
    let windSpeed = current.windspeed || 5;
    
    if (data.hourly?.relative_humidity_2m?.[0]) {
      humidity = data.hourly.relative_humidity_2m[0];
    }
    if (data.hourly?.windspeed_10m?.[0]) {
      windSpeed = data.hourly.windspeed_10m[0];
    }

    // Map weather codes to conditions
    const code = current.weathercode;
    let condition = "clear";
    if (code === 0) condition = "clear";
    else if ([1, 2, 3].includes(code)) condition = "clouds";
    else if ([45, 48].includes(code)) condition = "fog";
    else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) condition = "rain";
    else if ([71, 73, 75, 77, 85, 86].includes(code)) condition = "snow";
    else if ([95, 96, 99].includes(code)) condition = "thunderstorm";

    const weatherInfo = WEATHER_CONDITIONS[condition as keyof typeof WEATHER_CONDITIONS];
    const location = locationName || "Your location";

    return {
      temperature: Math.round(current.temperature),
      condition,
      humidity: Math.round(humidity),
      windSpeed: Math.round(windSpeed),
      description: `${weatherInfo.description} in ${location}`,
      location,
      source: "gps",
      timestamp: Date.now(),
      icon: weatherInfo.icon
    };
  }, []);

  // Geocode location name to coordinates
  const geocodeLocation = useCallback(async (locationName: string): Promise<{
    latitude: number;
    longitude: number;
    name: string;
    country: string;
  }> => {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationName)}&count=1&language=en&format=json`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    if (!response.ok) {
      throw new Error(`Geocoding error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.results?.length) {
      throw new Error(`Location "${locationName}" not found`);
    }

    return data.results[0];
  }, []);

  // Main weather fetching function
  const fetchWeather = useCallback(async (userLocation?: string) => {
    if (loading) return; // Prevent concurrent requests

    setLoading(true);
    setError(null);

    try {
      // Check cache first
      const cached = loadCachedWeather();
      if (cached) {
        setWeather(cached);
        setLoading(false);
        return;
      }

      // Use mock data if offline or in restrictive environment
      if (!isOnline() || shouldUseMockData()) {
        console.log("Using mock weather - network unavailable");
        const mockWeather = generateMockWeather(userLocation);
        setWeather(mockWeather);
        setError("Using simulated weather (network unavailable)");
        setLoading(false);
        return;
      }

      let weatherData: WeatherData;

      try {
        // Try profile location first if available
        if (userLocation) {
          console.log("Attempting profile location weather for:", userLocation);
          const geoData = await withNetworkRetry(
            () => geocodeLocation(userLocation),
            { retries: 1, timeout: 8000 }
          );

          weatherData = await withNetworkRetry(
            () => fetchWeatherByCoordinates(
              geoData.latitude,
              geoData.longitude,
              `${geoData.name}, ${geoData.country}`
            ),
            { retries: 1, timeout: 10000 }
          );
          weatherData.source = "profile";
          console.log("Profile location weather successful");
        } else if (locationPermission !== "denied") {
          // Fallback to GPS if no profile location
          console.log("No profile location, attempting GPS...");
          const position = await getCurrentPosition();
          weatherData = await withNetworkRetry(
            () => fetchWeatherByCoordinates(
              position.coords.latitude,
              position.coords.longitude
            ),
            { retries: 1, timeout: 10000 }
          );
          weatherData.source = "gps";
          console.log("GPS weather successful");
        } else {
          throw new Error("No location available - GPS denied and no profile location");
        }
      } catch (locationError) {
        console.log("Primary location methods failed:", getErrorMessage(locationError));

        // Last resort: offer manual entry or use mock data
        if (!userLocation && locationPermission === "denied") {
          setShowManualEntry(true);
          throw new Error("All automatic weather methods failed. Manual entry required.");
        }

        // Use a default location as final fallback
        const defaultLoc = "London";
        console.log("Using default location:", defaultLoc);

        const geoData = await withNetworkRetry(
          () => geocodeLocation(defaultLoc),
          { retries: 1, timeout: 8000 }
        );

        weatherData = await withNetworkRetry(
          () => fetchWeatherByCoordinates(
            geoData.latitude,
            geoData.longitude,
            `${geoData.name}, ${geoData.country}`
          ),
          { retries: 1, timeout: 10000 }
        );
        weatherData.source = "mock";
        console.log("Default location weather successful");
      }

      // Cache and set the weather data
      cacheWeatherData(weatherData);
      setWeather(weatherData);
      setError(null);

    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.warn("Weather fetch failed:", errorMessage);

      // Always provide mock weather as fallback
      const mockWeather = generateMockWeather(userLocation);
      setWeather(mockWeather);
      
      // Set appropriate error message
      if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
        setError("Weather service unavailable - using simulated data");
      } else if (errorMessage.includes("timeout")) {
        setError("Weather request timed out - using simulated data");
      } else {
        setError("Using simulated weather conditions");
      }

      logError(error, "Weather service error");
    } finally {
      setLoading(false);
    }
  }, [
    loading,
    loadCachedWeather,
    generateMockWeather,
    locationPermission,
    getCurrentPosition,
    fetchWeatherByCoordinates,
    geocodeLocation,
    cacheWeatherData,
    defaultLocation
  ]);

  // Get weather-based styling advice
  const getWeatherAdvice = useCallback((weatherData: WeatherData): string => {
    if (weatherData.source === "mock") {
      return "Comfortable conditions";
    }

    const temp = weatherData.temperature;
    const condition = weatherData.condition;

    if (condition === "rain") {
      return "Rain expected - bring waterproof layers";
    } else if (condition === "snow") {
      return "Snow conditions - warm, waterproof clothing";
    } else if (temp < 5) {
      return "Very cold - heavy winter clothing";
    } else if (temp < 15) {
      return "Cool weather - light jacket recommended";
    } else if (temp > 28) {
      return "Hot weather - light, breathable fabrics";
    } else if (temp > 22) {
      return "Warm weather - comfortable light clothing";
    } else {
      return "Pleasant conditions - dress comfortably";
    }
  }, []);

  // Get current weather status
  const getWeatherStatus = useCallback(() => {
    if (loading) return "Loading weather...";
    
    if (!weather) return "Weather unavailable";

    if (error) {
      return weather.source === "mock" 
        ? "Simulated weather" 
        : "Limited weather data";
    }

    switch (weather.source) {
      case "gps":
        return "Live weather from your location";
      case "profile":
        return "Live weather from your profile location";
      case "default":
        return "Live weather from default location";
      case "mock":
        return "Simulated weather conditions";
      default:
        return "Weather data available";
    }
  }, [loading, weather, error]);

  // Set manual weather entry
  const setManualWeatherEntry = useCallback((entry: ManualWeatherEntry) => {
    const weatherInfo = WEATHER_CONDITIONS[entry.condition as keyof typeof WEATHER_CONDITIONS];
    const manualWeatherData: WeatherData = {
      temperature: entry.temperature,
      condition: entry.condition,
      humidity: 60, // Default value for manual entry
      windSpeed: 5, // Default value for manual entry
      description: `${weatherInfo.description} in ${entry.location}`,
      location: entry.location,
      source: "manual",
      timestamp: Date.now(),
      icon: weatherInfo.icon,
      isManualEntry: true
    };

    setWeather(manualWeatherData);
    setManualWeather(entry);
    setShowManualEntry(false);
    setError(null);

    // Cache manual entry
    cacheWeatherData(manualWeatherData);
  }, [cacheWeatherData]);

  // Clear manual weather and retry automatic
  const retryAutomaticWeather = useCallback(() => {
    setManualWeather(null);
    setShowManualEntry(false);
    fetchWeather(profileLocation);
  }, [profileLocation, fetchWeather]);

  // Auto-fetch weather on mount and location changes
  useEffect(() => {
    fetchWeather(profileLocation);
  }, [profileLocation]); // Only depend on profileLocation, not fetchWeather

  return {
    weather,
    loading,
    error,
    fetchWeather,
    getWeatherAdvice,
    getWeatherStatus,
    locationPermission,
    showManualEntry,
    setShowManualEntry,
    setManualWeatherEntry,
    retryAutomaticWeather,
    manualWeather
  };
};
