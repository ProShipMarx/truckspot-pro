-- Update handle_new_user_profile to also save business_address
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, company_name, phone, mc_number, business_address)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'mc_number',
    NEW.raw_user_meta_data->>'business_address'
  );
  RETURN NEW;
END;
$$;