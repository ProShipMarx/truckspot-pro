-- Fix the handle_new_user_role function to remove invalid default
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Insert role based on metadata passed during signup
  -- Role must be specified during signup (either 'carrier' or 'shipper')
  IF NEW.raw_user_meta_data->>'role' IS NULL THEN
    RAISE EXCEPTION 'Role must be specified during signup';
  END IF;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'role')::app_role
  );
  RETURN NEW;
END;
$$;