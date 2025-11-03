-- Add role column to profiles table
ALTER TABLE public.profiles ADD COLUMN role app_role;

-- Migrate existing role data from user_roles to profiles
UPDATE public.profiles p
SET role = ur.role
FROM public.user_roles ur
WHERE p.id = ur.user_id;

-- Make role NOT NULL after data migration
ALTER TABLE public.profiles ALTER COLUMN role SET NOT NULL;

-- Drop the view we created earlier since it's no longer needed
DROP VIEW IF EXISTS public.user_profiles_with_roles;

-- Drop the old user_roles table
DROP TABLE public.user_roles;

-- Update the trigger function to work with the merged table
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Update the profile with the role from signup metadata
  IF NEW.raw_user_meta_data->>'role' IS NULL THEN
    RAISE EXCEPTION 'Role must be specified during signup';
  END IF;
  
  UPDATE public.profiles
  SET role = (NEW.raw_user_meta_data->>'role')::app_role
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Update security definer functions to use profiles table
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role
  FROM public.profiles
  WHERE id = _user_id
  LIMIT 1
$$;