/*
  # Enhanced Security and Data Management

  1. Security Improvements
    - Fix UPDATE policies with proper WITH CHECK clauses
    - Enhanced storage policies with strict folder enforcement
    - User deletion cleanup system

  2. Data Management
    - Profile access logging and audit trails
    - Data validation triggers
    - Encryption flags and audit fields

  3. New Features
    - Outfit feedback system for AI learning
    - Real weather integration support
    - Enhanced analytics tracking
*/

-- 1. Fix UPDATE policies to include WITH CHECK clauses (avoid duplicate error)
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update their own profile only" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update their own wardrobe items" ON public.wardrobe_items;
  DROP POLICY IF EXISTS "Users can update their own wardrobe items only" ON public.wardrobe_items;
END $$;

CREATE POLICY "Users can update their own profile only" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wardrobe items only" 
ON public.wardrobe_items 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Create outfit feedback system for AI learning
CREATE TABLE IF NOT EXISTS public.outfit_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  outfit_items UUID[] NOT NULL,
  occasion TEXT,
  weather TEXT,
  feedback_type TEXT CHECK (feedback_type IN ('like', 'dislike', 'love', 'save')) NOT NULL,
  feedback_score INTEGER CHECK (feedback_score BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on outfit feedback
ALTER TABLE public.outfit_feedback ENABLE ROW LEVEL SECURITY;

-- Policies for outfit feedback
CREATE POLICY "Users can insert their own feedback" 
ON public.outfit_feedback 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback" 
ON public.outfit_feedback 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback" 
ON public.outfit_feedback 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Create user preferences learning table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  preference_type TEXT NOT NULL, -- 'color', 'style', 'occasion', 'brand', etc.
  preference_value TEXT NOT NULL,
  confidence_score DECIMAL(3,2) DEFAULT 0.5 CHECK (confidence_score BETWEEN 0 AND 1),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, preference_type, preference_value)
);

-- Enable RLS on user preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Policies for user preferences
CREATE POLICY "Users can manage their own preferences" 
ON public.user_preferences 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Create weather data cache table
CREATE TABLE IF NOT EXISTS public.weather_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location TEXT NOT NULL,
  weather_data JSONB NOT NULL,
  temperature INTEGER,
  condition TEXT,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour')
);

-- Index for efficient weather lookups
CREATE INDEX IF NOT EXISTS idx_weather_cache_location_expires 
ON public.weather_cache(location, expires_at);

-- 5. Create analytics events table
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'upload', 'edit', 'recommendation_request', 'feedback', etc.
  event_data JSONB,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on analytics events
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Policy for analytics events (users can only see their own)
CREATE POLICY "Users can view their own analytics" 
ON public.analytics_events 
FOR SELECT 
USING (auth.uid() = user_id);

-- System can insert analytics events
CREATE POLICY "System can insert analytics events" 
ON public.analytics_events 
FOR INSERT 
WITH CHECK (true);

-- 6. Enhanced storage policies with strict folder enforcement
DO $$
BEGIN
  -- Drop existing storage policies if they exist
  DROP POLICY IF EXISTS "Users can upload their own photos" ON storage.objects;
  DROP POLICY IF EXISTS "Users can view their own photos" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own photos" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own photos" ON storage.objects;
  DROP POLICY IF EXISTS "Users can upload to their own folder only" ON storage.objects;
  DROP POLICY IF EXISTS "Users can view their own folder only" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own folder only" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own folder only" ON storage.objects;
END $$;

-- Enforce that files MUST be in user's folder (auth.uid()::text)
CREATE POLICY "Users can upload to their own folder only" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'user-photos' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text AND
  array_length(storage.foldername(name), 1) >= 1
);

CREATE POLICY "Users can view their own folder only" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'user-photos' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own folder only" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'user-photos' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'user-photos' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own folder only" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'user-photos' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 7. Create cleanup function for user deletion
CREATE OR REPLACE FUNCTION public.cleanup_user_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the deletion for audit purposes
  INSERT INTO public.user_deletion_log (deleted_user_id, deleted_at)
  VALUES (OLD.id, NOW());
  
  -- Note: Storage objects should be cleaned via edge function
  -- as we cannot directly access storage from SQL triggers
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit log table for user deletions (if not exists)
CREATE TABLE IF NOT EXISTS public.user_deletion_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deleted_user_id UUID NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  cleanup_completed BOOLEAN DEFAULT FALSE
);

-- Enable RLS on audit log
ALTER TABLE public.user_deletion_log ENABLE ROW LEVEL SECURITY;

-- Only allow system/admin access to deletion log
CREATE POLICY "Admin only access to deletion log" 
ON public.user_deletion_log 
FOR ALL 
USING (FALSE); -- No user access, only system functions

-- Create trigger for user deletion cleanup
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_user_data();

-- 8. Add encryption flags and audit fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS data_encrypted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS access_count INTEGER DEFAULT 0;

-- 9. Create function to log profile access (for audit)
CREATE OR REPLACE FUNCTION public.log_profile_access(profile_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    last_accessed = NOW(),
    access_count = access_count + 1
  WHERE user_id = profile_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Add data validation trigger for sensitive fields
CREATE OR REPLACE FUNCTION public.validate_profile_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate that face_photo_url follows correct path pattern
  IF NEW.face_photo_url IS NOT NULL THEN
    IF NOT (NEW.face_photo_url ~ ('^https://[^/]+/storage/v1/object/public/user-photos/' || NEW.user_id::text || '/')) THEN
      RAISE EXCEPTION 'Invalid face photo URL format. Must be in user''s folder.';
    END IF;
  END IF;
  
  -- Log access for audit
  PERFORM public.log_profile_access(NEW.user_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_profile_before_update ON public.profiles;
CREATE TRIGGER validate_profile_before_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_profile_data();

-- 11. Add constraint to ensure face photos are properly secured
DO $$
BEGIN
  ALTER TABLE public.profiles 
  ADD CONSTRAINT valid_face_photo_path 
  CHECK (
    face_photo_url IS NULL OR 
    face_photo_url ~ ('^https://[^/]+/storage/v1/object/public/user-photos/' || user_id::text || '/')
  );
EXCEPTION
  WHEN duplicate_object THEN
    -- Constraint already exists, ignore
    NULL;
END $$;

-- 12. Create function to update user preferences based on feedback
CREATE OR REPLACE FUNCTION public.update_user_preferences_from_feedback()
RETURNS TRIGGER AS $$
DECLARE
  item_record RECORD;
BEGIN
  -- Update preferences based on feedback
  FOR item_record IN 
    SELECT wi.* FROM public.wardrobe_items wi 
    WHERE wi.id = ANY(NEW.outfit_items)
  LOOP
    -- Update style preference
    INSERT INTO public.user_preferences (user_id, preference_type, preference_value, confidence_score)
    VALUES (NEW.user_id, 'style', item_record.style, 
            CASE NEW.feedback_type 
              WHEN 'love' THEN 0.9
              WHEN 'like' THEN 0.7
              WHEN 'save' THEN 0.6
              WHEN 'dislike' THEN 0.2
              ELSE 0.5
            END)
    ON CONFLICT (user_id, preference_type, preference_value)
    DO UPDATE SET 
      confidence_score = (user_preferences.confidence_score + EXCLUDED.confidence_score) / 2,
      last_updated = NOW();
    
    -- Update color preferences
    IF item_record.color IS NOT NULL THEN
      INSERT INTO public.user_preferences (user_id, preference_type, preference_value, confidence_score)
      SELECT NEW.user_id, 'color', unnest(item_record.color), 
             CASE NEW.feedback_type 
               WHEN 'love' THEN 0.8
               WHEN 'like' THEN 0.6
               WHEN 'save' THEN 0.5
               WHEN 'dislike' THEN 0.3
               ELSE 0.4
             END
      ON CONFLICT (user_id, preference_type, preference_value)
      DO UPDATE SET 
        confidence_score = (user_preferences.confidence_score + EXCLUDED.confidence_score) / 2,
        last_updated = NOW();
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for preference learning
DROP TRIGGER IF EXISTS learn_from_feedback ON public.outfit_feedback;
CREATE TRIGGER learn_from_feedback
  AFTER INSERT ON public.outfit_feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_user_preferences_from_feedback();

-- 13. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_user_category 
ON public.wardrobe_items(user_id, category);

CREATE INDEX IF NOT EXISTS idx_wardrobe_items_user_style 
ON public.wardrobe_items(user_id, style);

CREATE INDEX IF NOT EXISTS idx_outfit_feedback_user_created 
ON public.outfit_feedback(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_type 
ON public.user_preferences(user_id, preference_type);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_type 
ON public.analytics_events(user_id, event_type, created_at DESC);