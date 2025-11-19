-- Allow authenticated users to view all user roles
-- This is necessary for role validation in the messaging system
-- Roles are not sensitive information and need to be viewable for business logic
CREATE POLICY "Authenticated users can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);