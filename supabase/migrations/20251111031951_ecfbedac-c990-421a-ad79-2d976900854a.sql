-- Drop and recreate admin policies with proper WITH CHECK clauses

-- Fix admin policies for loads
DROP POLICY IF EXISTS "Admins can manage any load" ON public.loads;

CREATE POLICY "Admins can manage any load"
ON public.loads
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Fix admin policies for trucks
DROP POLICY IF EXISTS "Admins can manage any truck" ON public.trucks;

CREATE POLICY "Admins can manage any truck"
ON public.trucks
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));