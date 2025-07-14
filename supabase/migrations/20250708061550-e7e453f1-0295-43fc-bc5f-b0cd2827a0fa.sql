-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS favorite_colors TEXT[],
ADD COLUMN IF NOT EXISTS goals TEXT[],
ADD COLUMN IF NOT EXISTS gender_identity TEXT;