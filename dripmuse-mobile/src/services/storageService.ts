import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Profile {
  id: string;
  user_id: string;
  full_name?: string;
  avatar_url?: string;
  color_palette?: string;
  style_preferences?: any;
  created_at: string;
  updated_at: string;
}

export interface WardrobeItem {
  id: string;
  user_id: string;
  name: string;
  category: string;
  color?: string;
  image_url?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

const PROFILES_KEY = 'dripmuse_profiles';
const WARDROBE_ITEMS_KEY = 'dripmuse_wardrobe_items';

export class StorageService {
  // Profile Management
  static async getProfile(userId: string): Promise<Profile | null> {
    try {
      const profilesJson = await AsyncStorage.getItem(PROFILES_KEY);
      const profiles: Profile[] = profilesJson ? JSON.parse(profilesJson) : [];
      return profiles.find(p => p.user_id === userId) || null;
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  }

  static async saveProfile(profile: Profile): Promise<void> {
    try {
      const profilesJson = await AsyncStorage.getItem(PROFILES_KEY);
      const profiles: Profile[] = profilesJson ? JSON.parse(profilesJson) : [];
      
      const existingProfileIndex = profiles.findIndex(p => p.user_id === profile.user_id);
      
      if (existingProfileIndex >= 0) {
        profiles[existingProfileIndex] = {
          ...profile,
          updated_at: new Date().toISOString(),
        };
      } else {
        profiles.push({
          ...profile,
          id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      
      await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    } catch (error) {
      console.error('Error saving profile:', error);
      throw new Error('Failed to save profile');
    }
  }

  // Wardrobe Item Management
  static async getWardrobeItems(userId: string): Promise<WardrobeItem[]> {
    try {
      const itemsJson = await AsyncStorage.getItem(WARDROBE_ITEMS_KEY);
      const items: WardrobeItem[] = itemsJson ? JSON.parse(itemsJson) : [];
      return items.filter(item => item.user_id === userId);
    } catch (error) {
      console.error('Error getting wardrobe items:', error);
      return [];
    }
  }

  static async saveWardrobeItem(item: Omit<WardrobeItem, 'id' | 'created_at' | 'updated_at'>): Promise<WardrobeItem> {
    try {
      const itemsJson = await AsyncStorage.getItem(WARDROBE_ITEMS_KEY);
      const items: WardrobeItem[] = itemsJson ? JSON.parse(itemsJson) : [];
      
      const newItem: WardrobeItem = {
        ...item,
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      items.push(newItem);
      await AsyncStorage.setItem(WARDROBE_ITEMS_KEY, JSON.stringify(items));
      
      return newItem;
    } catch (error) {
      console.error('Error saving wardrobe item:', error);
      throw new Error('Failed to save wardrobe item');
    }
  }

  static async updateWardrobeItem(itemId: string, updates: Partial<WardrobeItem>): Promise<void> {
    try {
      const itemsJson = await AsyncStorage.getItem(WARDROBE_ITEMS_KEY);
      const items: WardrobeItem[] = itemsJson ? JSON.parse(itemsJson) : [];
      
      const itemIndex = items.findIndex(item => item.id === itemId);
      if (itemIndex >= 0) {
        items[itemIndex] = {
          ...items[itemIndex],
          ...updates,
          updated_at: new Date().toISOString(),
        };
        await AsyncStorage.setItem(WARDROBE_ITEMS_KEY, JSON.stringify(items));
      }
    } catch (error) {
      console.error('Error updating wardrobe item:', error);
      throw new Error('Failed to update wardrobe item');
    }
  }

  static async deleteWardrobeItem(itemId: string): Promise<void> {
    try {
      const itemsJson = await AsyncStorage.getItem(WARDROBE_ITEMS_KEY);
      const items: WardrobeItem[] = itemsJson ? JSON.parse(itemsJson) : [];
      
      const filteredItems = items.filter(item => item.id !== itemId);
      await AsyncStorage.setItem(WARDROBE_ITEMS_KEY, JSON.stringify(filteredItems));
    } catch (error) {
      console.error('Error deleting wardrobe item:', error);
      throw new Error('Failed to delete wardrobe item');
    }
  }

  // Utility methods
  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([PROFILES_KEY, WARDROBE_ITEMS_KEY]);
    } catch (error) {
      console.error('Error clearing data:', error);
      throw new Error('Failed to clear data');
    }
  }

  static async exportData(userId: string): Promise<{ profile: Profile | null; wardrobeItems: WardrobeItem[] }> {
    try {
      const profile = await this.getProfile(userId);
      const wardrobeItems = await this.getWardrobeItems(userId);
      return { profile, wardrobeItems };
    } catch (error) {
      console.error('Error exporting data:', error);
      throw new Error('Failed to export data');
    }
  }
}
