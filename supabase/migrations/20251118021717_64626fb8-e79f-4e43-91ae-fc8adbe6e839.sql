-- Add read_at column to messages table to track when messages are read
ALTER TABLE public.messages 
ADD COLUMN read_at timestamp with time zone;

-- Create index for better query performance on unread messages
CREATE INDEX idx_messages_read_at ON public.messages(conversation_id, read_at);

-- Update existing messages to be marked as read (optional, for cleaner state)
UPDATE public.messages SET read_at = created_at;