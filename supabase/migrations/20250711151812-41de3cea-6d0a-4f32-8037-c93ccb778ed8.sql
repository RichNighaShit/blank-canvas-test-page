
-- Create a table for curated wardrobe items that can be suggested to users
CREATE TABLE public.curated_wardrobe_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  color TEXT[] NOT NULL DEFAULT '{}',
  style TEXT NOT NULL,
  occasion TEXT[] NOT NULL DEFAULT '{}',
  season TEXT[] NOT NULL DEFAULT '{}',
  price_range TEXT, -- 'budget', 'mid-range', 'luxury'
  image_url TEXT,
  affiliate_url TEXT,
  brand TEXT,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  popularity_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for curated items (public read access)
ALTER TABLE public.curated_wardrobe_items ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read curated items
CREATE POLICY "Anyone can view curated wardrobe items" 
  ON public.curated_wardrobe_items 
  FOR SELECT 
  USING (true);

-- Create a table for user style quiz results
CREATE TABLE public.user_style_quiz (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quiz_version INTEGER DEFAULT 1,
  style_personality TEXT NOT NULL, -- 'classic', 'trendy', 'bohemian', 'minimalist', 'edgy', 'romantic'
  color_preferences TEXT[] NOT NULL DEFAULT '{}',
  preferred_fit TEXT, -- 'fitted', 'relaxed', 'oversized'
  lifestyle TEXT, -- 'professional', 'casual', 'active', 'social'
  budget_range TEXT, -- 'budget', 'mid-range', 'luxury'
  body_type TEXT,
  style_goals TEXT[], -- 'professional', 'confident', 'comfortable', 'trendy', 'unique'
  occasion_frequency JSONB, -- {'work': 5, 'casual': 7, 'formal': 2, 'date': 3, 'party': 1}
  quiz_answers JSONB, -- Store raw quiz answers for future analysis
  confidence_score DECIMAL(3,2) DEFAULT 0.8, -- How confident we are in the results
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for quiz results
ALTER TABLE public.user_style_quiz ENABLE ROW LEVEL SECURITY;

-- Users can manage their own quiz results
CREATE POLICY "Users can manage their own style quiz results" 
  ON public.user_style_quiz 
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create a table for occasion-based outfit suggestions
CREATE TABLE public.occasion_outfits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  occasion TEXT NOT NULL, -- 'job_interview', 'first_date', 'wedding_guest', 'business_meeting', etc.
  style_personality TEXT NOT NULL,
  season TEXT[] NOT NULL DEFAULT '{}',
  outfit_name TEXT NOT NULL,
  outfit_description TEXT,
  required_items JSONB NOT NULL, -- [{'category': 'tops', 'style': 'blouse', 'color': ['white', 'blue']}, ...]
  optional_items JSONB DEFAULT '[]',
  styling_tips TEXT[],
  total_price_range TEXT, -- 'under_50', '50_150', '150_300', 'over_300'
  popularity_score INTEGER DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for occasion outfits (public read access)
ALTER TABLE public.occasion_outfits ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read occasion outfits
CREATE POLICY "Anyone can view occasion outfits" 
  ON public.occasion_outfits 
  FOR SELECT 
  USING (true);

-- Insert some sample curated wardrobe items
INSERT INTO public.curated_wardrobe_items (name, category, color, style, occasion, season, price_range, description, tags, popularity_score) VALUES
('Classic White Button-Down Shirt', 'tops', '{"white"}', 'classic', '{"work", "casual", "formal"}', '{"spring", "summer", "fall", "winter"}', 'mid-range', 'Essential white shirt for any wardrobe', '{"versatile", "essential", "classic"}', 95),
('Black Straight-Leg Trousers', 'bottoms', '{"black"}', 'classic', '{"work", "formal"}', '{"spring", "summer", "fall", "winter"}', 'mid-range', 'Professional black trousers', '{"professional", "essential", "versatile"}', 90),
('Little Black Dress', 'dresses', '{"black"}', 'classic', '{"formal", "party", "date"}', '{"spring", "summer", "fall", "winter"}', 'mid-range', 'Timeless little black dress', '{"essential", "elegant", "versatile"}', 88),
('Denim Jacket', 'outerwear', '{"blue"}', 'casual', '{"casual", "date"}', '{"spring", "fall"}', 'budget', 'Classic denim jacket for layering', '{"casual", "layering", "versatile"}', 85),
('White Sneakers', 'shoes', '{"white"}', 'casual', '{"casual", "sport"}', '{"spring", "summer", "fall"}', 'budget', 'Clean white sneakers for everyday wear', '{"comfortable", "casual", "versatile"}', 92);

-- Insert some sample occasion outfits
INSERT INTO public.occasion_outfits (occasion, style_personality, season, outfit_name, outfit_description, required_items, styling_tips, total_price_range) VALUES
('job_interview', 'classic', '{"spring", "summer", "fall", "winter"}', 'Professional Power Look', 'Confident and polished interview outfit', 
'[{"category": "tops", "style": "blouse", "color": ["white", "light blue"]}, {"category": "bottoms", "style": "trousers", "color": ["black", "navy"]}, {"category": "shoes", "style": "pumps", "color": ["black", "nude"]}]',
'{"Keep jewelry minimal", "Ensure clothes are well-fitted", "Choose comfortable shoes you can walk in confidently"}', '150_300'),

('first_date', 'romantic', '{"spring", "summer"}', 'Effortlessly Chic Date Night', 'Romantic but not overdressed date outfit',
'[{"category": "dresses", "style": "midi", "color": ["blush", "navy", "burgundy"]}, {"category": "shoes", "style": "heels", "color": ["nude", "black"]}]',
'{"Add delicate jewelry", "Choose a comfortable heel height", "Bring a light cardigan or jacket"}', '50_150'),

('wedding_guest', 'elegant', '{"spring", "summer", "fall"}', 'Elegant Wedding Guest', 'Sophisticated outfit appropriate for wedding celebrations',
'[{"category": "dresses", "style": "midi", "color": ["dusty rose", "sage green", "navy"]}, {"category": "shoes", "style": "heels", "color": ["nude", "metallic"]}]',
'{"Avoid white, ivory, or black", "Choose breathable fabrics", "Consider the venue and time of day"}', '150_300');
