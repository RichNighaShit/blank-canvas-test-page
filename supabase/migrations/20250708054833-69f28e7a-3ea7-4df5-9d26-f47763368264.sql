-- Fix infinite recursion in profile validation
-- Drop the problematic trigger first
DROP TRIGGER IF EXISTS validate_profile_trigger ON public.profiles;

-- Update the validate_profile_data function to avoid recursion
CREATE OR REPLACE FUNCTION public.validate_profile_data()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Validate that face_photo_url follows correct path pattern
  IF NEW.face_photo_url IS NOT NULL THEN
    IF NOT (NEW.face_photo_url ~ ('^https://[^/]+/storage/v1/object/public/user-photos/' || NEW.user_id::text || '/')) THEN
      RAISE EXCEPTION 'Invalid face photo URL format. Must be in user''s folder.';
    END IF;
  END IF;
  
  -- Only log access on SELECT operations, not on UPDATE to avoid recursion
  -- We'll handle access logging separately
  
  RETURN NEW;
END;
$function$;

-- Create a separate trigger only for INSERT operations
CREATE TRIGGER validate_profile_trigger
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_profile_data();

-- Create a separate, simpler access logging function that doesn't cause recursion
CREATE OR REPLACE FUNCTION public.log_profile_access_safe(profile_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Update without triggering validation
  UPDATE public.profiles 
  SET 
    last_accessed = NOW(),
    access_count = COALESCE(access_count, 0) + 1
  WHERE user_id = profile_user_id;
END;
$function$;