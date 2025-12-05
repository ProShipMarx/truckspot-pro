-- Fix: Restrict trucks table to authenticated users only
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view non-deleted trucks" ON public.trucks;

-- Create new policy that requires authentication
CREATE POLICY "Authenticated users can view non-deleted trucks"
ON public.trucks
FOR SELECT
TO authenticated
USING (deleted_at IS NULL);

-- Apply the same fix to loads table (same vulnerability)
DROP POLICY IF EXISTS "Anyone can view non-deleted loads" ON public.loads;

CREATE POLICY "Authenticated users can view non-deleted loads"
ON public.loads
FOR SELECT
TO authenticated
USING (deleted_at IS NULL);