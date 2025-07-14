
-- Create table for shared outfits in the community
CREATE TABLE public.shared_outfits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  item_ids UUID[] NOT NULL DEFAULT '{}',
  photo_urls TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  style_score DECIMAL(3,2) DEFAULT 0,
  trending_score DECIMAL(3,2) DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for outfit likes
CREATE TABLE public.outfit_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  outfit_id UUID NOT NULL REFERENCES public.shared_outfits(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, outfit_id)
);

-- Create table for outfit comments
CREATE TABLE public.outfit_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  outfit_id UUID NOT NULL REFERENCES public.shared_outfits(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for user follows
CREATE TABLE public.user_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Create table for style challenges
CREATE TABLE public.style_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  theme TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  prize TEXT,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  participants_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for challenge participations
CREATE TABLE public.challenge_participations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.style_challenges(id) ON DELETE CASCADE,
  outfit_id UUID REFERENCES public.shared_outfits(id) ON DELETE SET NULL,
  submission_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

-- Create table for shopping products (cached from external APIs)
CREATE TABLE public.shopping_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  price DECIMAL(10,2),
  original_price DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  image_url TEXT,
  affiliate_url TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  colors TEXT[] DEFAULT '{}',
  sizes TEXT[] DEFAULT '{}',
  description TEXT,
  rating DECIMAL(2,1),
  reviews_count INTEGER DEFAULT 0,
  availability_countries TEXT[] DEFAULT '{}',
  is_in_stock BOOLEAN DEFAULT true,
  sustainability_score DECIMAL(2,1),
  source_platform TEXT NOT NULL, -- 'amazon', 'shopify', etc.
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for user shopping preferences
CREATE TABLE public.user_shopping_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  preferred_brands TEXT[] DEFAULT '{}',
  size_preferences JSONB DEFAULT '{}',
  sustainability_preference INTEGER DEFAULT 5, -- 1-10 scale
  country_code TEXT NOT NULL DEFAULT 'US',
  currency_preference TEXT DEFAULT 'USD',
  notification_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Create table for price alerts
CREATE TABLE public.price_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.shopping_products(id) ON DELETE CASCADE,
  target_price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Create table for contextual events (calendar integration)
CREATE TABLE public.user_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  event_type TEXT, -- 'work', 'casual', 'formal', 'party', etc.
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  dress_code TEXT,
  weather_considered BOOLEAN DEFAULT true,
  suggested_outfit_ids UUID[] DEFAULT '{}',
  selected_outfit_id UUID REFERENCES public.saved_outfits(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create RLS policies for shared_outfits
ALTER TABLE public.shared_outfits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shared outfits" ON public.shared_outfits
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own shared outfits" ON public.shared_outfits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shared outfits" ON public.shared_outfits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shared outfits" ON public.shared_outfits
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for outfit_likes
ALTER TABLE public.outfit_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view outfit likes" ON public.outfit_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own likes" ON public.outfit_likes
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for outfit_comments
ALTER TABLE public.outfit_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view outfit comments" ON public.outfit_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can create comments" ON public.outfit_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON public.outfit_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.outfit_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_follows
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all follows" ON public.user_follows
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own follows" ON public.user_follows
  FOR ALL USING (auth.uid() = follower_id);

-- Create RLS policies for style_challenges
ALTER TABLE public.style_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active challenges" ON public.style_challenges
  FOR SELECT USING (is_active = true);

-- Create RLS policies for challenge_participations
ALTER TABLE public.challenge_participations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view challenge participations" ON public.challenge_participations
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own participations" ON public.challenge_participations
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for shopping_products
ALTER TABLE public.shopping_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shopping products" ON public.shopping_products
  FOR SELECT USING (true);

-- Create RLS policies for user_shopping_preferences
ALTER TABLE public.user_shopping_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own shopping preferences" ON public.user_shopping_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for price_alerts
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own price alerts" ON public.price_alerts
  FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for user_events
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own events" ON public.user_events
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_shared_outfits_user_id ON public.shared_outfits(user_id);
CREATE INDEX idx_shared_outfits_trending ON public.shared_outfits(trending_score DESC);
CREATE INDEX idx_shared_outfits_likes ON public.shared_outfits(likes_count DESC);
CREATE INDEX idx_outfit_likes_outfit_id ON public.outfit_likes(outfit_id);
CREATE INDEX idx_outfit_comments_outfit_id ON public.outfit_comments(outfit_id);
CREATE INDEX idx_shopping_products_category ON public.shopping_products(category);
CREATE INDEX idx_shopping_products_country ON public.shopping_products USING gin(availability_countries);
CREATE INDEX idx_user_events_user_time ON public.user_events(user_id, start_time);

-- Create functions for updating counters
CREATE OR REPLACE FUNCTION update_outfit_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.shared_outfits 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.outfit_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.shared_outfits 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.outfit_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_outfit_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.shared_outfits 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.outfit_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.shared_outfits 
    SET comments_count = comments_count - 1 
    WHERE id = OLD.outfit_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER outfit_likes_count_trigger
  AFTER INSERT OR DELETE ON public.outfit_likes
  FOR EACH ROW EXECUTE FUNCTION update_outfit_likes_count();

CREATE TRIGGER outfit_comments_count_trigger
  AFTER INSERT OR DELETE ON public.outfit_comments
  FOR EACH ROW EXECUTE FUNCTION update_outfit_comments_count();

-- Create trigger for updating challenge participants count
CREATE OR REPLACE FUNCTION update_challenge_participants_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.style_challenges 
    SET participants_count = participants_count + 1 
    WHERE id = NEW.challenge_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.style_challenges 
    SET participants_count = participants_count - 1 
    WHERE id = OLD.challenge_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER challenge_participants_count_trigger
  AFTER INSERT OR DELETE ON public.challenge_participations
  FOR EACH ROW EXECUTE FUNCTION update_challenge_participants_count();
