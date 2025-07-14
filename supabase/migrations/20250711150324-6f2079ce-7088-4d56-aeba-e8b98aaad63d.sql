
-- Restore the essential wardrobe_items table
CREATE TABLE public.wardrobe_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  category TEXT NOT NULL,
  color TEXT[] DEFAULT '{}',
  style TEXT NOT NULL,
  occasion TEXT[] DEFAULT '{}',
  season TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for wardrobe_items
ALTER TABLE public.wardrobe_items ENABLE ROW LEVEL SECURITY;

-- Create policies for wardrobe_items
CREATE POLICY "Users can view their own wardrobe items" 
  ON public.wardrobe_items 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own wardrobe items" 
  ON public.wardrobe_items 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wardrobe items" 
  ON public.wardrobe_items 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wardrobe items" 
  ON public.wardrobe_items 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Also restore saved_outfits table since it's referenced in your components
CREATE TABLE public.saved_outfits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  occasion TEXT,
  style TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for saved_outfits
ALTER TABLE public.saved_outfits ENABLE ROW LEVEL SECURITY;

-- Create policies for saved_outfits
CREATE POLICY "Users can manage their own saved outfits"
  ON public.saved_outfits
  FOR ALL
  USING (auth.uid() = user_id);

-- Restore outfit_feedback table for style recommendations
CREATE TABLE public.outfit_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  feedback text NOT NULL,
  outfit_item_ids text[] NOT NULL,
  feedback_score integer,
  occasion text,
  weather text,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for outfit_feedback
ALTER TABLE public.outfit_feedback ENABLE ROW LEVEL SECURITY;

-- Create policy for outfit_feedback
CREATE POLICY "Users can manage their own outfit feedback"
  ON public.outfit_feedback
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fix shopping_products table policies to allow INSERT for system operations
DROP POLICY IF EXISTS "Anyone can view shopping products" ON public.shopping_products;

CREATE POLICY "Anyone can view shopping products"
  ON public.shopping_products
  FOR SELECT
  USING (true);

CREATE POLICY "System can manage shopping products"
  ON public.shopping_products
  FOR ALL
  USING (true)
  WITH CHECK (true);
