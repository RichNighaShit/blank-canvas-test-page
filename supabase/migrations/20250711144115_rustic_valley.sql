/*
  # Create user favorites table

  1. New Tables
    - `user_favorites`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `item_type` (text, type of favorited item)
      - `item_id` (uuid, id of favorited item)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `user_favorites` table
    - Add policy for users to manage their own favorites
*/

CREATE TABLE IF NOT EXISTS user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('shopping_suggestion', 'wardrobe_item', 'outfit')),
  item_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_item_type ON user_favorites(item_type);

-- Enable RLS
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own favorites
CREATE POLICY "Users can manage their own favorites"
  ON user_favorites
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);