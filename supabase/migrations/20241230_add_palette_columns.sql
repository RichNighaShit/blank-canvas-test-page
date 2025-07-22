-- Add missing columns for color palette functionality
-- selected_palette_id: stores the ID of the selected predefined palette
-- color_season_analysis: stores the professional color analysis results

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS selected_palette_id TEXT,
ADD COLUMN IF NOT EXISTS color_season_analysis JSONB;

-- Add comments for documentation
COMMENT ON COLUMN profiles.selected_palette_id IS 'ID of the selected predefined color palette';
COMMENT ON COLUMN profiles.color_season_analysis IS 'Professional color season analysis results (Spring/Summer/Autumn/Winter)';
