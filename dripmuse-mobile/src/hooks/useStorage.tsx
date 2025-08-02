import { useState, useEffect } from 'react';
import { StorageService, Profile, WardrobeItem } from '@/services/storageService';
import { useAuth } from './useAuth';

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userProfile = await StorageService.getProfile(user.id);
      setProfile(userProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async (profileData: Partial<Profile>) => {
    if (!user) return;

    try {
      const profileToSave: Profile = {
        id: profile?.id || '',
        user_id: user.id,
        ...profileData,
        created_at: profile?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await StorageService.saveProfile(profileToSave);
      await loadProfile(); // Reload to get updated data
    } catch (error) {
      console.error('Error saving profile:', error);
      throw error;
    }
  };

  return {
    profile,
    loading,
    saveProfile,
    reloadProfile: loadProfile,
  };
}

export function useWardrobe() {
  const { user } = useAuth();
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadWardrobeItems();
    } else {
      setWardrobeItems([]);
      setLoading(false);
    }
  }, [user]);

  const loadWardrobeItems = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const items = await StorageService.getWardrobeItems(user.id);
      setWardrobeItems(items);
    } catch (error) {
      console.error('Error loading wardrobe items:', error);
    } finally {
      setLoading(false);
    }
  };

  const addWardrobeItem = async (itemData: Omit<WardrobeItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const newItem = await StorageService.saveWardrobeItem({
        ...itemData,
        user_id: user.id,
      });
      
      setWardrobeItems(prev => [...prev, newItem]);
      return newItem;
    } catch (error) {
      console.error('Error adding wardrobe item:', error);
      throw error;
    }
  };

  const updateWardrobeItem = async (itemId: string, updates: Partial<WardrobeItem>) => {
    try {
      await StorageService.updateWardrobeItem(itemId, updates);
      await loadWardrobeItems(); // Reload to get updated data
    } catch (error) {
      console.error('Error updating wardrobe item:', error);
      throw error;
    }
  };

  const deleteWardrobeItem = async (itemId: string) => {
    try {
      await StorageService.deleteWardrobeItem(itemId);
      setWardrobeItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error deleting wardrobe item:', error);
      throw error;
    }
  };

  return {
    wardrobeItems,
    loading,
    addWardrobeItem,
    updateWardrobeItem,
    deleteWardrobeItem,
    reloadWardrobe: loadWardrobeItems,
  };
}
