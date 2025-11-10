-- Create loads table
CREATE TABLE public.loads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  origin_lat NUMERIC,
  origin_lng NUMERIC,
  destination_lat NUMERIC,
  destination_lng NUMERIC,
  pickup_date DATE NOT NULL,
  weight NUMERIC,
  equipment_type TEXT NOT NULL,
  rate NUMERIC,
  distance NUMERIC,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.loads ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can insert their own loads
CREATE POLICY "Users can insert their own loads"
ON public.loads
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Everyone can view all loads (public load board)
CREATE POLICY "Anyone can view all loads"
ON public.loads
FOR SELECT
USING (true);

-- Policy: Users can update their own loads
CREATE POLICY "Users can update their own loads"
ON public.loads
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own loads
CREATE POLICY "Users can delete their own loads"
ON public.loads
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_loads_updated_at
BEFORE UPDATE ON public.loads
FOR EACH ROW
EXECUTE FUNCTION public.update_profiles_updated_at();