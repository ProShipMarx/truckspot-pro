-- Create conversations table for shipper-carrier messaging
CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipper_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  carrier_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(shipper_id, carrier_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text,
  file_url text,
  file_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Conversations policies: users can only see/create conversations they're part of
CREATE POLICY "Users can view their own conversations"
ON public.conversations
FOR SELECT
USING (auth.uid() = shipper_id OR auth.uid() = carrier_id);

CREATE POLICY "Users can create conversations where they are a participant"
ON public.conversations
FOR INSERT
WITH CHECK (auth.uid() = shipper_id OR auth.uid() = carrier_id);

-- Messages policies: users can only see/send messages in their conversations
CREATE POLICY "Users can view messages in their conversations"
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = messages.conversation_id
    AND (conversations.shipper_id = auth.uid() OR conversations.carrier_id = auth.uid())
  )
);

CREATE POLICY "Users can send messages in their conversations"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = conversation_id
    AND (conversations.shipper_id = auth.uid() OR conversations.carrier_id = auth.uid())
  )
);

-- Create indexes for performance
CREATE INDEX idx_conversations_shipper ON public.conversations(shipper_id);
CREATE INDEX idx_conversations_carrier ON public.conversations(carrier_id);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_messages_created ON public.messages(created_at);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Create storage bucket for message attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-attachments', 'message-attachments', false);

-- Storage policies: users can upload files and view files in their conversations
CREATE POLICY "Users can upload message attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'message-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view attachments in their conversations"
ON storage.objects
FOR SELECT
USING (bucket_id = 'message-attachments');