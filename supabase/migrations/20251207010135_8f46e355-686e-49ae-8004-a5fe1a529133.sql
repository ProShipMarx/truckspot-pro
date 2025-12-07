-- Fix: Restrict user_roles visibility to prevent role enumeration
-- Remove the overly permissive policy that allows all authenticated users to view all roles

DROP POLICY IF EXISTS "Authenticated users can view all roles" ON public.user_roles;

-- Create a more restrictive policy: users can view roles of conversation partners
CREATE POLICY "Users can view roles of conversation partners"
ON public.user_roles
FOR SELECT
USING (
  auth.uid() = user_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM conversations
    WHERE (shipper_id = auth.uid() AND carrier_id = user_roles.user_id)
    OR (carrier_id = auth.uid() AND shipper_id = user_roles.user_id)
  )
);