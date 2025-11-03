-- Create a view that shows user profiles with their roles
CREATE OR REPLACE VIEW public.user_profiles_with_roles AS
SELECT 
  p.id,
  p.email,
  p.created_at,
  p.updated_at,
  ur.role as user_type
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id;

-- Grant access to authenticated users
GRANT SELECT ON public.user_profiles_with_roles TO authenticated;

-- Add RLS policy for the view
ALTER VIEW public.user_profiles_with_roles SET (security_invoker = true);