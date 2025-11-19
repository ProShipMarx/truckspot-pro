-- Allow users to view profiles of people they have conversations with
CREATE POLICY "Users can view conversation participant profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.conversations
    WHERE (conversations.shipper_id = auth.uid() AND conversations.carrier_id = profiles.id)
       OR (conversations.carrier_id = auth.uid() AND conversations.shipper_id = profiles.id)
  )
);