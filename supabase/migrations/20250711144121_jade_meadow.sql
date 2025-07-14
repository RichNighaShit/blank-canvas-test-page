/*
  # Create shopping products table

  1. New Tables
    - `shopping_products`
      - `id` (uuid, primary key)
      - `external_id` (text, unique identifier from source)
      - `name` (text, product name)
      - `brand` (text, brand name)
      - `price` (numeric, current price)
      - `original_price` (numeric, original price for discounts)
      - `currency` (text, currency code)
      - `image_url` (text, product image)
      - `affiliate_url` (text, purchase link)
      - `category` (text, product category)
      - `subcategory` (text, product subcategory)
      - `colors` (text[], available colors)
      - `sizes` (text[], available sizes)
      - `description` (text, product description)
      - `rating` (numeric, product rating)
      - `reviews_count` (integer, number of reviews)
      - `availability_countries` (text[], countries where available)
      - `is_in_stock` (boolean, stock status)
      - `sustainability_score` (numeric, sustainability rating)
      - `source_platform` (text, source platform)
      - `last_updated` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `shopping_products` table
    - Add policy for public read access
*/

CREATE TABLE IF NOT EXISTS shopping_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id text NOT NULL,
  name text NOT NULL,
  brand text,
  price numeric(10,2),
  original_price numeric(10,2),
  currency text DEFAULT 'USD',
  image_url text,
  affiliate_url text NOT NULL,
  category text NOT NULL,
  subcategory text,
  colors text[] DEFAULT '{}',
  sizes text[] DEFAULT '{}',
  description text,
  rating numeric(2,1),
  reviews_count integer DEFAULT 0,
  availability_countries text[] DEFAULT '{}',
  is_in_stock boolean DEFAULT true,
  sustainability_score numeric(2,1),
  source_platform text NOT NULL,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shopping_products_category ON shopping_products(category);
CREATE INDEX IF NOT EXISTS idx_shopping_products_country ON shopping_products USING gin(availability_countries);

-- Enable RLS
ALTER TABLE shopping_products ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Anyone can view shopping products"
  ON shopping_products
  FOR SELECT
  TO public
  USING (true);