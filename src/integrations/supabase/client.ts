import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://znrshlnbgqcajxklwwjo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpucnNobG5iZ3FjYWp4a2x3d2pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2NDc4ODUsImV4cCI6MjA1MTIyMzg4NX0.H8nqS7gVPmU7a-C-tGhZl5j3wpEyUGM6bCwGU6OjbOg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
