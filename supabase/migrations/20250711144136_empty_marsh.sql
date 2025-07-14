/*
  # Create price alerts table

  1. New Tables
    - `price_alerts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `product_id` (uuid, references shopping_products)
      - `target_price` (numeric, desired price)
      - `is_active` (boolean, alert status)
      - `triggered_at` (timestamp, when alert was triggered)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `price_alerts` table
    - Add policy for users to manage their own alerts
*/

CREATE TABLE IF NOT EXISTS price_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES shopping_products(id) ON DELETE CASCADE,
  target_price numeric(10,2) NOT NULL,
  is_active boolean DEFAULT true,
  triggered_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own price alerts
CREATE POLICY "Users can manage their own price alerts"
  ON price_alerts
  FOR ALL
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);