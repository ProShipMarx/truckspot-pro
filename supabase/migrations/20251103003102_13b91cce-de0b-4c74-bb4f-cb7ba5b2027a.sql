-- Drop the insecure INSERT policy that allows self-assignment
DROP POLICY IF EXISTS "Users can insert their own role on signup" ON public.user_roles;

-- Create a secure trigger function to assign roles based on signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert role based on metadata passed during signup
  -- Default to 'user' role if no role specified
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::app_role,
      'user'::app_role
    )
  );
  RETURN NEW;
END;
$$;

-- Create trigger to automatically assign roles on user creation
DROP TRIGGER IF EXISTS on_auth_user_created_assign_role ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();