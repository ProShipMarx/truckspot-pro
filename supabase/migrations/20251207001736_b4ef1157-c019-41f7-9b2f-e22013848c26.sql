-- Fix function search path for generate_confirmation_code
CREATE OR REPLACE FUNCTION public.generate_confirmation_code()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT upper(substr(md5(random()::text), 1, 8))
$$;