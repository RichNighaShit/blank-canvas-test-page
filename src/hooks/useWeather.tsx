import { useState, useEffect, useCallback } from "react";

export interface WeatherData {
  temperature: number; // Celsius
  condition: string; // clear, rain, snow, clouds, etc.
  humidity: number;
  windSpeed: number;
  description: string;
  location: string;
  source: "gps" | "profile" | "default";
}

export const useWeather = (location?: string) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationPermission, setLocationPermission] = useState<
    "granted" | "denied" | "prompt" | "unavailable"
  >("prompt");

  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setLocationPermission("denied");
              reject(new Error("Location permission denied"));
              break;
            case error.POSITION_UNAVAILABLE:
              reject(new Error("Location information unavailable"));
              break;
            case error.TIMEOUT:
              reject(new Error("Location request timed out"));
              break;
            default:
              reject(new Error("Unknown location error"));
          }
        },
        {
          enableHighAccuracy: true, // Get more accurate location
          timeout: 15000, // 15 seconds for permission prompt
          maximumAge: 60000, // 1 minute - fresher location data
        },
      );
    });
  };

    const fetchWeatherByCoordinates = async (
    latitude: number,
    longitude: number,
    locationName?: string,
  ) => {
    let timeoutId: number | null = null;
    const controller = new AbortController();

    try {
      // Add timeout for weather API as well
      timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relative_humidity_2m,precipitation,weathercode,windspeed_10m&timezone=auto`,
        { signal: controller.signal },
      );

      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      if (!weatherRes.ok) {
        throw new Error(
          `Weather API responded with status: ${weatherRes.status}`,
        );
      }

      const weatherData = await weatherRes.json();

      if (!weatherData.current_weather) {
        throw new Error("Weather data not available");
      }

      const current = weatherData.current_weather;

      // Find humidity and windspeed for the current hour
      let humidity = null,
        windSpeed = null;
      if (
        weatherData.hourly &&
        weatherData.hourly.time &&
        weatherData.hourly.relative_humidity_2m
      ) {
        const idx = weatherData.hourly.time.indexOf(current.time);
        if (idx !== -1) {
          humidity = weatherData.hourly.relative_humidity_2m[idx];
          windSpeed = weatherData.hourly.windspeed_10m[idx];
        }
      }

      // Map Open-Meteo weathercode to a simple condition string
      const code = current.weathercode;
      let condition = "clear";
      if ([0].includes(code)) condition = "clear";
      else if ([1, 2, 3].includes(code)) condition = "clouds";
      else if (
        [45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(
          code,
        )
      )
        condition = "rain";
      else if ([71, 73, 75, 77, 85, 86].includes(code)) condition = "snow";
      else if ([95, 96, 99].includes(code)) condition = "thunderstorm";

      // Get location name from reverse geocoding if not provided
      let locationNameToUse = locationName;
      if (!locationNameToUse) {
        // Open-Meteo doesn't support reverse geocoding, so just use a generic name
        locationNameToUse = "Your location";
      }

      const realWeather: WeatherData = {
        temperature: current.temperature,
        condition,
        humidity: humidity ?? 60,
        windSpeed: windSpeed ?? current.windspeed,
        description: `${condition.charAt(0).toUpperCase() + condition.slice(1)} in ${locationNameToUse}`,
        location: locationNameToUse,
        source: "gps",
      };

      setWeather(realWeather);
      setError(null);
    } catch (err: any) {
      // Clean up timeout if still active
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (err.name === "AbortError") {
        throw new Error("Weather request timed out");
      }
      throw new Error(`Failed to fetch weather data: ${err.message}`);
    }
  };

  const tryAlternativeLocations = async (originalLocation: string) => {
    const alternatives = [];

    // Handle Pakistan-specific location variants
    if (originalLocation.toLowerCase().includes("pakistan")) {
      const baseLocation = originalLocation.replace(/,\s*pakistan/i, "").trim();

      // Common Pakistan city alternatives
      if (baseLocation.toLowerCase().includes("wah")) {
        alternatives.push(
          "Wah",
          "Wah Cantt",
          "Rawalpindi, Pakistan",
          "Islamabad, Pakistan",
        );
      }

      // Add major Pakistan cities as fallbacks
      alternatives.push(
        "Lahore, Pakistan",
        "Karachi, Pakistan",
        "Islamabad, Pakistan",
        "Rawalpindi, Pakistan",
        "Faisalabad, Pakistan",
      );
    }

    // Generic alternatives - try without country, then major cities
    const locationParts = originalLocation.split(",");
    if (locationParts.length > 1) {
      alternatives.push(locationParts[0].trim()); // Just the city name
      alternatives.push(locationParts.slice(0, -1).join(",").trim()); // Without last part
    }

    // Try each alternative
    for (const altLocation of alternatives) {
      try {
        console.log(`Trying alternative location: ${altLocation}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(altLocation)}&count=1&language=en&format=json`,
          { signal: controller.signal },
        );

        clearTimeout(timeoutId);

        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData.results && geoData.results.length > 0) {
            console.log(`Found alternative location: ${altLocation}`);
            return geoData.results[0];
          }
        }
      } catch (error) {
        console.log(`Alternative ${altLocation} failed:`, error);
        continue;
      }
    }

    return null;
  };

  const fetchWeather = async (userLocation?: string) => {
    setLoading(true);
    setError(null);

    try {
      // ALWAYS try to get user's GPS location first (this will prompt for permission)
      try {
        console.log("Requesting GPS location permission...");
        const position = await getCurrentPosition();
        console.log(
          "GPS location granted, using coordinates:",
          position.coords.latitude,
          position.coords.longitude,
        );

        await fetchWeatherByCoordinates(
          position.coords.latitude,
          position.coords.longitude,
        );
        setLocationPermission("granted");
        return; // Success! Exit early with GPS coordinates
      } catch (gpsError) {
        console.log(
          "GPS location failed, falling back to profile/city location:",
          gpsError instanceof Error ? gpsError.message : String(gpsError),
        );
        setLocationPermission("denied");
        // Continue to fallback logic below
      }

      // Only use fallback if GPS fails or is denied
      const locationToUse = userLocation || location || "London";
      console.log("Using fallback location:", locationToUse);

            // Geocode city name to lat/lon using Open-Meteo's geocoding API
      const controller = new AbortController();
      let timeoutId: number | null = null;

      try {
        timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationToUse)}&count=1&language=en&format=json`,
          { signal: controller.signal },
        );

        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        if (!geoRes.ok) {
          throw new Error(
            `Geocoding API responded with status: ${geoRes.status}`,
          );
        }

        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
          console.warn(
            `Location "${locationToUse}" not found, trying alternatives...`,
          );

          // Try alternative location names for Pakistan locations
          const alternativeLocations =
            await tryAlternativeLocations(locationToUse);
          if (alternativeLocations) {
            const { latitude, longitude, name, country } = alternativeLocations;
            await fetchWeatherByCoordinates(
              latitude,
              longitude,
              `${name}, ${country}`,
            );
            setWeather((prev) =>
              prev
                ? { ...prev, source: userLocation ? "profile" : "default" }
                : null,
            );
            return;
          }

          throw new Error(`Location "${locationToUse}" not found`);
        }

        const { latitude, longitude, name, country } = geoData.results[0];
        await fetchWeatherByCoordinates(
          latitude,
          longitude,
          `${name}, ${country}`,
        );

        // Update the weather source
        setWeather((prev) =>
          prev
            ? { ...prev, source: userLocation ? "profile" : "default" }
            : null,
        );
      } catch (geocodingError: any) {
        // Clean up timeout if still active
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // Handle specific error types
        if (geocodingError.name === "AbortError") {
          throw new Error("Weather service request timed out");
        } else if (geocodingError.message?.includes("Failed to fetch")) {
          throw new Error("Network error - unable to reach weather service");
        } else {
          throw geocodingError;
        }
      }
    } catch (err: any) {
      console.error(
        "Weather fetch error:",
        err instanceof Error ? err.message : String(err),
      );

      // Provide default weather data as final fallback
      const defaultWeather: WeatherData = {
        temperature: 22, // Comfortable default temperature
        condition: "clear",
        humidity: 60,
        windSpeed: 5,
        description: "Weather data unavailable - using default conditions",
        location: userLocation || location || "Unknown location",
        source: "default",
      };

      setWeather(defaultWeather);
      setError(
        "Using default weather conditions. Location-specific weather not available.",
      );
    } finally {
      setLoading(false);
    }
  };

  const getWeatherAdvice = (weatherData: WeatherData): string => {
    // For default weather or when location is unavailable, provide general advice
    if (
      weatherData.source === "default" ||
      weatherData.description.includes("unavailable")
    ) {
      return "Comfortable conditions";
    }

    if (weatherData.temperature < 10) {
      return "Cold - wear warm layers";
    } else if (weatherData.temperature < 20) {
      return "Cool - light jacket recommended";
    } else if (weatherData.temperature > 25) {
      return "Warm - light fabrics recommended";
    } else {
      return "Comfortable temperature";
    }
  };

  const getWeatherStatus = () => {
    if (loading) return "Loading weather data...";
    if (error) return "Weather information not available";
    if (weather) {
      switch (weather.source) {
        case "gps":
          return `Weather data from your location`;
        case "profile":
          return `Weather data from your profile location`;
        case "default":
          return `Weather data from default location`;
        default:
          return "Weather data available";
      }
    }
    return "Weather information not available";
  };

  useEffect(() => {
    if (location) {
      fetchWeather(location);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  return {
    weather,
    loading,
    error,
    fetchWeather,
    getWeatherAdvice,
    getWeatherStatus,
    locationPermission,
  };
};
