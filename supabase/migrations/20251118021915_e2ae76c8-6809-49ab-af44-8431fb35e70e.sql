-- Allow users to mark messages as read in their conversations
CREATE POLICY "Users can mark messages as read in their conversations"
ON public.messages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (conversations.shipper_id = auth.uid() OR conversations.carrier_id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (conversations.shipper_id = auth.uid() OR conversations.carrier_id = auth.uid())
  )
);

-- Also allow admins to mark any message as read
CREATE POLICY "Admins can mark any message as read"
ON public.messages
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));