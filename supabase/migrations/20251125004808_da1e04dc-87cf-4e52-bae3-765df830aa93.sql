-- Fix storage policy: Restrict message attachment access to conversation participants only
DROP POLICY IF EXISTS "Users can view attachments in their conversations" ON storage.objects;

CREATE POLICY "Users can view attachments in their conversations"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'message-attachments'
  AND (
    -- User can access files they uploaded
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- OR user is part of a conversation where this file was shared
    EXISTS (
      SELECT 1 FROM public.messages m
      INNER JOIN public.conversations c ON c.id = m.conversation_id
      WHERE m.file_url = name
        AND (c.shipper_id = auth.uid() OR c.carrier_id = auth.uid())
    )
  )
);