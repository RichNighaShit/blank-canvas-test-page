import React, { useState, useEffect, useCallback } from "react";

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
    let timeoutId: NodeJS.Timeout | null = null;
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
      let timeoutId: NodeJS.Timeout | null = null;

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
      setError(
        "Weather information not available. Generating recommendations without weather data.",
      );
      console.error(
        "Weather fetch error:",
        err instanceof Error ? err.message : String(err),
      );
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherAdvice = (weatherData: WeatherData): string[] => {
    const advice: string[] = [];

    if (weatherData.temperature < 10) {
      advice.push("Wear warm layers and a coat");
      advice.push("Consider gloves and a scarf");
    } else if (weatherData.temperature < 20) {
      advice.push("Layer with a light jacket or sweater");
      advice.push("Long sleeves recommended");
    } else if (weatherData.temperature > 25) {
      advice.push("Light, breathable fabrics recommended");
      advice.push("Short sleeves and light colors");
    }

    if (weatherData.condition === "rain") {
      advice.push("Waterproof jacket or umbrella needed");
      advice.push("Closed-toe shoes recommended");
    } else if (weatherData.condition === "snow") {
      advice.push("Warm, waterproof outerwear essential");
      advice.push("Insulated boots recommended");
    }

    if (weatherData.humidity > 70) {
      advice.push("Breathable fabrics to stay comfortable");
    }

    if (weatherData.windSpeed > 15) {
      advice.push("Consider wind-resistant outerwear");
    }

    return advice;
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
