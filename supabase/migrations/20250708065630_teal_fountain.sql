/*
  # Add wardrobe collections and outfit combinations

  1. New Tables
    - `wardrobe_collections`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `name` (text)
      - `description` (text, optional)
      - `item_ids` (uuid array)
      - `collection_type` (text: 'favorites', 'seasonal', 'occasion', 'custom')
      - `created_at` (timestamp)
    
    - `saved_outfits`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `name` (text)
      - `item_ids` (uuid array)
      - `occasion` (text)
      - `season` (text array)
      - `description` (text, optional)
      - `photo_url` (text, optional)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all new tables
    - Add policies for users to manage their own data
*/

-- Wardrobe collections for organizing items
CREATE TABLE IF NOT EXISTS wardrobe_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  item_ids uuid[] DEFAULT '{}',
  collection_type text DEFAULT 'custom' CHECK (collection_type IN ('favorites', 'seasonal', 'occasion', 'custom')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE wardrobe_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own collections"
  ON wardrobe_collections
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Saved outfit combinations
CREATE TABLE IF NOT EXISTS saved_outfits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  item_ids uuid[] NOT NULL,
  occasion text DEFAULT 'casual',
  season text[] DEFAULT '{}',
  description text,
  photo_url text,
  is_favorite boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE saved_outfits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own saved outfits"
  ON saved_outfits
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add updated_at triggers
CREATE TRIGGER update_wardrobe_collections_updated_at
  BEFORE UPDATE ON wardrobe_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_outfits_updated_at
  BEFORE UPDATE ON saved_outfits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wardrobe_collections_user_id ON wardrobe_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_wardrobe_collections_type ON wardrobe_collections(collection_type);
CREATE INDEX IF NOT EXISTS idx_saved_outfits_user_id ON saved_outfits(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_outfits_occasion ON saved_outfits(occasion);
CREATE INDEX IF NOT EXISTS idx_saved_outfits_favorite ON saved_outfits(is_favorite);