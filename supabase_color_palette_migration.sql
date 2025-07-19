-- Add color_palette_colors column to profiles table
-- This will store colors extracted from user's profile picture analysis
-- Separate from favorite_colors which are user's manual preferences

ALTER TABLE profiles 
ADD COLUMN color_palette_colors text[] DEFAULT NULL;

-- Add a comment to document the purpose
COMMENT ON COLUMN profiles.color_palette_colors IS 'Colors extracted from user profile picture analysis using computer vision';
COMMENT ON COLUMN profiles.favorite_colors IS 'User manually selected favorite colors for styling preferences';

-- Optional: Create an index for better query performance if needed
-- CREATE INDEX idx_profiles_color_palette ON profiles USING gin(color_palette_colors);
