/*
  # Create user shopping preferences table

  1. New Tables
    - `user_shopping_preferences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users, unique)
      - `budget_min` (numeric, minimum budget)
      - `budget_max` (numeric, maximum budget)
      - `preferred_brands` (text[], favorite brands)
      - `size_preferences` (jsonb, size preferences by category)
      - `sustainability_preference` (integer, sustainability importance 1-10)
      - `country_code` (text, user's country)
      - `currency_preference` (text, preferred currency)
      - `notification_preferences` (jsonb, notification settings)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_shopping_preferences` table
    - Add policy for users to manage their own preferences
*/

CREATE TABLE IF NOT EXISTS user_shopping_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  budget_min numeric(10,2),
  budget_max numeric(10,2),
  preferred_brands text[] DEFAULT '{}',
  size_preferences jsonb DEFAULT '{}',
  sustainability_preference integer DEFAULT 5,
  country_code text NOT NULL DEFAULT 'US',
  currency_preference text DEFAULT 'USD',
  notification_preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_shopping_preferences ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own preferences
CREATE POLICY "Users can manage their own shopping preferences"
  ON user_shopping_preferences
  FOR ALL
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);