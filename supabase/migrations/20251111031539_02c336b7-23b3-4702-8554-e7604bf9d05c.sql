-- Drop existing admin policies if they exist
DROP POLICY IF EXISTS "Admins can update any load" ON public.loads;
DROP POLICY IF EXISTS "Admins can soft delete any load" ON public.loads;
DROP POLICY IF EXISTS "Admins can update any truck" ON public.trucks;
DROP POLICY IF EXISTS "Admins can soft delete any truck" ON public.trucks;

-- Allow admins to update and delete any load
CREATE POLICY "Admins can manage any load"
ON public.loads
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update and delete any truck
CREATE POLICY "Admins can manage any truck"
ON public.trucks
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));