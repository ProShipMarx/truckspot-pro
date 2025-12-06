-- Update the handle_new_user_profile function to save company info from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, company_name, phone, mc_number)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'mc_number'
  );
  RETURN NEW;
END;
$$;