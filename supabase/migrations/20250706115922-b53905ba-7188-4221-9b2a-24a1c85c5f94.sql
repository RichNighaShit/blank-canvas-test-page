-- 1. Fix UPDATE policies to include WITH CHECK clauses
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own wardrobe items" ON public.wardrobe_items;

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

-- 2. Create more restrictive storage policies that enforce folder naming
DROP POLICY IF EXISTS "Users can upload their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own photos" ON storage.objects;

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

-- 3. Create cleanup function for user deletion
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

-- Create audit log table for user deletions
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

-- 4. Add encryption flags and audit fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS data_encrypted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS access_count INTEGER DEFAULT 0;

-- 5. Create function to log profile access (for audit)
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

-- 6. Add data validation trigger for sensitive fields
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

CREATE TRIGGER validate_profile_before_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_profile_data();

-- 7. Add constraint to ensure face photos are properly secured
ALTER TABLE public.profiles 
ADD CONSTRAINT valid_face_photo_path 
CHECK (
  face_photo_url IS NULL OR 
  face_photo_url ~ ('^https://[^/]+/storage/v1/object/public/user-photos/' || user_id::text || '/')
);