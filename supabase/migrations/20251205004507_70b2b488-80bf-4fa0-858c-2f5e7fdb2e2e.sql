-- Create table for email signups from launching soon form
CREATE TABLE public.email_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_signups ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public signup form)
CREATE POLICY "Anyone can signup for launch updates"
ON public.email_signups
FOR INSERT
WITH CHECK (true);

-- Only admins can view signups (for export)
CREATE POLICY "Admins can view all signups"
ON public.email_signups
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));