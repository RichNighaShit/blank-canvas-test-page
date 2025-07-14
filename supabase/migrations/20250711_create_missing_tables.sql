
-- Create shopping_suggestions table
CREATE TABLE IF NOT EXISTS shopping_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  brand text,
  price numeric,
  currency text DEFAULT 'USD',
  original_price numeric,
  image_url text,
  affiliate_url text,
  category text NOT NULL,
  subcategory text,
  colors text[],
  sizes text[],
  rating numeric CHECK (rating >= 0 AND rating <= 5),
  reviews_count integer DEFAULT 0,
  in_stock boolean DEFAULT true,
  source text DEFAULT 'ai_generated',
  style_match_score numeric CHECK (style_match_score >= 0 AND style_match_score <= 100),
  wardrobe_gap_fill text[],
  recommended_for text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on shopping_suggestions
ALTER TABLE shopping_suggestions ENABLE ROW LEVEL SECURITY;

-- Create policy for shopping_suggestions
CREATE POLICY "Users can manage their own shopping suggestions"
  ON shopping_suggestions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create user_favorites table for shopping suggestions
CREATE TABLE IF NOT EXISTS user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('shopping_suggestion', 'wardrobe_item', 'outfit')),
  item_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on user_favorites
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Create policy for user_favorites
CREATE POLICY "Users can manage their own favorites"
  ON user_favorites
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fix outfit_feedback table if it exists with wrong structure
DROP TABLE IF EXISTS outfit_feedback CASCADE;

CREATE TABLE outfit_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  outfit_item_ids uuid[] NOT NULL,
  feedback text NOT NULL CHECK (feedback IN ('like', 'dislike', 'love', 'save')),
  feedback_score integer CHECK (feedback_score >= 1 AND feedback_score <= 5),
  occasion text,
  weather text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on outfit_feedback
ALTER TABLE outfit_feedback ENABLE ROW LEVEL SECURITY;

-- Create policy for outfit_feedback
CREATE POLICY "Users can manage their own outfit feedback"
  ON outfit_feedback
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Ensure planned_outfits table exists with correct structure
CREATE TABLE IF NOT EXISTS planned_outfits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  outfit_date date NOT NULL,
  item_ids uuid[] NOT NULL,
  occasion text DEFAULT 'casual',
  weather text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on planned_outfits if not already enabled
ALTER TABLE planned_outfits ENABLE ROW LEVEL SECURITY;

-- Create policy for planned_outfits if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'planned_outfits' 
    AND policyname = 'Users can manage their own planned outfits'
  ) THEN
    CREATE POLICY "Users can manage their own planned outfits"
      ON planned_outfits
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shopping_suggestions_user_id ON shopping_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_suggestions_category ON shopping_suggestions(category);
CREATE INDEX IF NOT EXISTS idx_shopping_suggestions_created_at ON shopping_suggestions(created_at);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_item_type ON user_favorites(item_type);

CREATE INDEX IF NOT EXISTS idx_outfit_feedback_user_id ON outfit_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_outfit_feedback_created_at ON outfit_feedback(created_at);

CREATE INDEX IF NOT EXISTS idx_planned_outfits_user_id ON planned_outfits(user_id);
CREATE INDEX IF NOT EXISTS idx_planned_outfits_date ON planned_outfits(outfit_date);

-- Add updated_at trigger for shopping_suggestions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_shopping_suggestions_updated_at
  BEFORE UPDATE ON shopping_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add updated_at trigger for planned_outfits if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_planned_outfits_updated_at'
  ) THEN
    CREATE TRIGGER update_planned_outfits_updated_at
      BEFORE UPDATE ON planned_outfits
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
