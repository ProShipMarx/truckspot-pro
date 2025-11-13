-- Ensure UPDATE policies are PERMISSIVE so admin updates don't get blocked by restrictive policies

-- Loads: drop existing UPDATE policies and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Admins can manage any load" ON public.loads;
DROP POLICY IF EXISTS "Users can soft delete their own loads" ON public.loads;
DROP POLICY IF EXISTS "Users can update their own loads" ON public.loads;

CREATE POLICY "Admins can manage any load"
ON public.loads
AS PERMISSIVE
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can soft delete their own loads"
ON public.loads
AS PERMISSIVE
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own loads"
ON public.loads
AS PERMISSIVE
FOR UPDATE
USING ((auth.uid() = user_id) AND (deleted_at IS NULL))
WITH CHECK (auth.uid() = user_id);

-- Trucks: drop existing UPDATE policies and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Admins can manage any truck" ON public.trucks;
DROP POLICY IF EXISTS "Users can soft delete their own trucks" ON public.trucks;
DROP POLICY IF EXISTS "Users can update their own trucks" ON public.trucks;

CREATE POLICY "Admins can manage any truck"
ON public.trucks
AS PERMISSIVE
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can soft delete their own trucks"
ON public.trucks
AS PERMISSIVE
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own trucks"
ON public.trucks
AS PERMISSIVE
FOR UPDATE
USING ((auth.uid() = user_id) AND (deleted_at IS NULL))
WITH CHECK (auth.uid() = user_id);
