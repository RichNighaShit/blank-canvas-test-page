import { useState, useEffect } from 'react';

export interface WeatherData {
  temperature: number; // Celsius
  condition: string; // clear, rain, snow, clouds, etc.
  humidity: number;
  windSpeed: number;
  description: string;
  location: string;
  source: 'gps' | 'profile' | 'default';
}

export const useWeather = (location?: string) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt' | 'unavailable'>('prompt');

  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setLocationPermission('denied');
              reject(new Error('Location permission denied'));
              break;
            case error.POSITION_UNAVAILABLE:
              reject(new Error('Location information unavailable'));
              break;
            case error.TIMEOUT:
              reject(new Error('Location request timed out'));
              break;
            default:
              reject(new Error('Unknown location error'));
          }
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  };

  const fetchWeatherByCoordinates = async (latitude: number, longitude: number, locationName?: string) => {
    try {
      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relative_humidity_2m,precipitation,weathercode,windspeed_10m&timezone=auto`);
      const weatherData = await weatherRes.json();
      
      if (!weatherData.current_weather) {
        throw new Error('Weather data not available');
      }

      const current = weatherData.current_weather;
      
      // Find humidity and windspeed for the current hour
      let humidity = null, windSpeed = null;
      if (weatherData.hourly && weatherData.hourly.time && weatherData.hourly.relative_humidity_2m) {
        const idx = weatherData.hourly.time.indexOf(current.time);
        if (idx !== -1) {
          humidity = weatherData.hourly.relative_humidity_2m[idx];
          windSpeed = weatherData.hourly.windspeed_10m[idx];
        }
      }

      // Map Open-Meteo weathercode to a simple condition string
      const code = current.weathercode;
      let condition = 'clear';
      if ([0].includes(code)) condition = 'clear';
      else if ([1,2,3].includes(code)) condition = 'clouds';
      else if ([45,48,51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code)) condition = 'rain';
      else if ([71,73,75,77,85,86].includes(code)) condition = 'snow';
      else if ([95,96,99].includes(code)) condition = 'thunderstorm';

      // Get location name from reverse geocoding if not provided
      let locationNameToUse = locationName;
      if (!locationNameToUse) {
        try {
          const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?latitude=${latitude}&longitude=${longitude}&count=1&language=en&format=json`);
          const geoData = await geoRes.json();
          if (geoData.results && geoData.results.length > 0) {
            locationNameToUse = `${geoData.results[0].name}, ${geoData.results[0].country}`;
          }
        } catch (geoError) {
          console.warn('Failed to get location name:', geoError);
          locationNameToUse = 'Your location';
        }
      }

      const realWeather: WeatherData = {
        temperature: current.temperature,
        condition,
        humidity: humidity ?? 60,
        windSpeed: windSpeed ?? current.windspeed,
        description: `${condition.charAt(0).toUpperCase() + condition.slice(1)} in ${locationNameToUse}`,
        location: locationNameToUse,
        source: 'gps'
      };

      setWeather(realWeather);
      setError(null);
    } catch (err: any) {
      throw new Error(`Failed to fetch weather data: ${err.message}`);
    }
  };

  const fetchWeather = async (userLocation?: string) => {
    setLoading(true);
    setError(null);

    try {
      // First, try to get user's GPS location if permission is not denied
      if (locationPermission !== 'denied') {
        try {
          const position = await getCurrentPosition();
          await fetchWeatherByCoordinates(position.coords.latitude, position.coords.longitude);
          setLocationPermission('granted');
          return;
        } catch (gpsError) {
          console.log('GPS location failed, falling back to profile location:', gpsError);
          setLocationPermission('denied');
        }
      }

      // Fallback to profile location or default
      const locationToUse = userLocation || location || 'London';
      
      // Geocode city name to lat/lon using Open-Meteo's geocoding API
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationToUse)}&count=1&language=en&format=json`);
      const geoData = await geoRes.json();
      
      if (!geoData.results || geoData.results.length === 0) {
        throw new Error('Location not found');
      }
      
      const { latitude, longitude, name, country } = geoData.results[0];
      await fetchWeatherByCoordinates(latitude, longitude, `${name}, ${country}`);
      
      // Update the weather source
      setWeather(prev => prev ? { ...prev, source: userLocation ? 'profile' : 'default' } : null);
      
    } catch (err: any) {
      setError('Weather information not available. Generating recommendations without weather data.');
      console.error('Weather fetch error:', err);
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherAdvice = (weatherData: WeatherData): string[] => {
    const advice: string[] = [];
    
    if (weatherData.temperature < 10) {
      advice.push('Wear warm layers and a coat');
      advice.push('Consider gloves and a scarf');
    } else if (weatherData.temperature < 20) {
      advice.push('Layer with a light jacket or sweater');
      advice.push('Long sleeves recommended');
    } else if (weatherData.temperature > 25) {
      advice.push('Light, breathable fabrics recommended');
      advice.push('Short sleeves and light colors');
    }

    if (weatherData.condition === 'rain') {
      advice.push('Waterproof jacket or umbrella needed');
      advice.push('Closed-toe shoes recommended');
    } else if (weatherData.condition === 'snow') {
      advice.push('Warm, waterproof outerwear essential');
      advice.push('Insulated boots recommended');
    }

    if (weatherData.humidity > 70) {
      advice.push('Breathable fabrics to stay comfortable');
    }

    if (weatherData.windSpeed > 15) {
      advice.push('Consider wind-resistant outerwear');
    }

    return advice;
  };

  const getWeatherStatus = () => {
    if (loading) return 'Loading weather data...';
    if (error) return 'Weather information not available';
    if (weather) {
      switch (weather.source) {
        case 'gps':
          return `Weather data from your location`;
        case 'profile':
          return `Weather data from your profile location`;
        case 'default':
          return `Weather data from default location`;
        default:
          return 'Weather data available';
      }
    }
    return 'Weather information not available';
  };

  useEffect(() => {
    if (location) {
      fetchWeather(location);
    }
  }, [location]);

  return {
    weather,
    loading,
    error,
    fetchWeather,
    getWeatherAdvice,
    getWeatherStatus,
    locationPermission
  };
};