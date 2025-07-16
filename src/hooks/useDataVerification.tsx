import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface DataVerificationResult {
  profileExists: boolean;
  wardrobeItemsCount: number;
  lastDataCheck: Date;
  errors: string[];
}

export const useDataVerification = () => {
  const [verificationResult, setVerificationResult] = useState<DataVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const { user } = useAuth();

  const verifyDataStorage = async (): Promise<DataVerificationResult> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const errors: string[] = [];
    let profileExists = false;
    let wardrobeItemsCount = 0;

    try {
      // Check profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        errors.push(`Profile check failed: ${profileError.message}`);
      } else if (profile) {
        profileExists = true;
        console.log('✅ Profile data verified:', {
          id: profile.id,
          display_name: profile.display_name,
          location: profile.location,
          preferred_style: profile.preferred_style,
          favorite_colors: profile.favorite_colors,
          goals: profile.goals,
          created_at: profile.created_at
        });
      }

      // Check wardrobe items
      const { data: wardrobeItems, error: wardrobeError } = await supabase
        .from('wardrobe_items')
        .select('*')
        .eq('user_id', user.id);

      if (wardrobeError) {
        errors.push(`Wardrobe items check failed: ${wardrobeError.message}`);
      } else {
        wardrobeItemsCount = wardrobeItems?.length || 0;
        console.log('✅ Wardrobe items verified:', {
          count: wardrobeItemsCount,
          sample: wardrobeItems?.slice(0, 2).map(item => ({
            id: item.id,
            name: item.name,
            category: item.category,
            created_at: item.created_at
          }))
        });
      }

    } catch (error) {
      errors.push(`General verification error: ${error}`);
    }

    const result: DataVerificationResult = {
      profileExists,
      wardrobeItemsCount,
      lastDataCheck: new Date(),
      errors
    };

    console.log('🔍 Data Verification Summary:', result);
    return result;
  };

  const runVerification = async () => {
    if (!user) return;
    
    setIsVerifying(true);
    try {
      const result = await verifyDataStorage();
      setVerificationResult(result);
    } catch (error) {
      console.error('Verification failed:', error);
      setVerificationResult({
        profileExists: false,
        wardrobeItemsCount: 0,
        lastDataCheck: new Date(),
        errors: [`Verification failed: ${error}`]
      });
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (user) {
      runVerification();
    }
  }, [user]);

  return {
    verificationResult,
    isVerifying,
    runVerification
  };
};