-- Allow admins to update any load
CREATE POLICY "Admins can update any load"
ON public.loads
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to soft delete any load
CREATE POLICY "Admins can soft delete any load"
ON public.loads
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update any truck
CREATE POLICY "Admins can update any truck"
ON public.trucks
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to soft delete any truck
CREATE POLICY "Admins can soft delete any truck"
ON public.trucks
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));