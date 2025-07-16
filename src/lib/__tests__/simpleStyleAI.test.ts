
import { describe, it, expect, beforeEach } from 'vitest';
import { simpleStyleAI, WardrobeItem, StyleProfile, WeatherData } from '../simpleStyleAI';

/**
 * Unit tests for the SimpleStyleAI recommendation engine
 */
describe('SimpleStyleAI', () => {
  let mockWardrobeItems: WardrobeItem[];
  let mockProfile: StyleProfile;
  let mockWeather: WeatherData;

  beforeEach(() => {
    mockWardrobeItems = [
      {
        id: '1',
        name: 'White T-Shirt',
        photo_url: 'test.jpg',
        category: 'tops',
        color: ['white'],
        style: 'casual',
        occasion: ['casual', 'everyday'],
        season: ['spring', 'summer'],
        tags: ['comfortable', 'basic']
      },
      {
        id: '2',
        name: 'Blue Jeans',
        photo_url: 'test2.jpg',
        category: 'bottoms',
        color: ['blue'],
        style: 'casual',
        occasion: ['casual', 'everyday'],
        season: ['all'],
        tags: ['denim', 'versatile']
      },
      {
        id: '3',
        name: 'Winter Coat',
        photo_url: 'test3.jpg',
        category: 'outerwear',
        color: ['black'],
        style: 'casual',
        occasion: ['outdoor'],
        season: ['winter'],
        tags: ['warm', 'waterproof']
      }
    ];

    mockProfile = {
      id: 'user1',
      preferred_style: 'casual',
      favorite_colors: ['blue', 'white'],
      goals: ['comfort', 'versatility']
    };

    mockWeather = {
      temperature: 20,
      condition: 'clear',
      humidity: 60,
      description: 'Clear sky'
    };
  });

  describe('generateRecommendations', () => {
    it('should generate recommendations for casual occasion', () => {
      const recommendations = simpleStyleAI.generateRecommendations(
        mockWardrobeItems,
        mockProfile,
        { occasion: 'casual', weather: mockWeather }
      );

      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]).toHaveProperty('id');
      expect(recommendations[0]).toHaveProperty('items');
      expect(recommendations[0]).toHaveProperty('confidence');
    });

    it('should filter items based on weather conditions', () => {
      const coldWeather: WeatherData = {
        temperature: 5,
        condition: 'snow',
        humidity: 80,
        description: 'Heavy snow'
      };

      const recommendations = simpleStyleAI.generateRecommendations(
        mockWardrobeItems,
        mockProfile,
        { occasion: 'casual', weather: coldWeather }
      );

      // Should include winter coat in cold weather
      const hasWinterCoat = recommendations.some(rec => 
        rec.items.some(item => item.category === 'outerwear')
      );
      expect(hasWinterCoat).toBe(true);
    });

    it('should exclude outerwear in hot weather', () => {
      const hotWeather: WeatherData = {
        temperature: 30,
        condition: 'clear',
        humidity: 40,
        description: 'Hot and sunny'
      };

      const recommendations = simpleStyleAI.generateRecommendations(
        mockWardrobeItems,
        mockProfile,
        { occasion: 'casual', weather: hotWeather }
      );

      // Should not include outerwear in hot weather
      const hasOuterwear = recommendations.some(rec => 
        rec.items.some(item => item.category === 'outerwear')
      );
      expect(hasOuterwear).toBe(false);
    });

    it('should respect user style preferences', () => {
      const formalProfile: StyleProfile = {
        ...mockProfile,
        preferred_style: 'formal'
      };

      const recommendations = simpleStyleAI.generateRecommendations(
        mockWardrobeItems,
        formalProfile,
        { occasion: 'business' }
      );

      expect(recommendations).toBeDefined();
      // Should handle formal preferences even with casual items
    });
  });
});
