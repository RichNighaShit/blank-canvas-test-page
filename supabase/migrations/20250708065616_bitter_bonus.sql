/*
  # Add outfit feedback and analytics tables

  1. New Tables
    - `outfit_feedback`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `outfit_item_ids` (uuid array)
      - `feedback` (text: 'like', 'dislike', 'love', 'save')
      - `feedback_score` (integer, 1-5)
      - `occasion` (text)
      - `weather` (text)
      - `notes` (text, optional)
      - `created_at` (timestamp)
    
    - `user_analytics`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `event_type` (text: 'outfit_generated', 'item_added', 'dashboard_visit')
      - `event_data` (jsonb)
      - `created_at` (timestamp)
    
    - `planned_outfits`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `outfit_date` (date)
      - `item_ids` (uuid array)
      - `occasion` (text)
      - `weather` (text)
      - `notes` (text, optional)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all new tables
    - Add policies for users to manage their own data
*/

-- Outfit feedback table for AI learning
CREATE TABLE IF NOT EXISTS outfit_feedback (
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

ALTER TABLE outfit_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own outfit feedback"
  ON outfit_feedback
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User analytics for tracking usage patterns
CREATE TABLE IF NOT EXISTS user_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_data jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own analytics"
  ON user_analytics
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Planned outfits for outfit planning feature
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

ALTER TABLE planned_outfits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own planned outfits"
  ON planned_outfits
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add updated_at trigger for planned_outfits
CREATE TRIGGER update_planned_outfits_updated_at
  BEFORE UPDATE ON planned_outfits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_outfit_feedback_user_id ON outfit_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_outfit_feedback_created_at ON outfit_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON user_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_event_type ON user_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_planned_outfits_user_id ON planned_outfits(user_id);
CREATE INDEX IF NOT EXISTS idx_planned_outfits_date ON planned_outfits(outfit_date);