-- Create delivery_confirmations table for 3-way confirmation
CREATE TABLE public.delivery_confirmations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  load_assignment_id UUID NOT NULL REFERENCES public.load_assignments(id) ON DELETE CASCADE,
  
  -- Carrier drop-off info
  carrier_confirmed_at TIMESTAMP WITH TIME ZONE,
  carrier_latitude NUMERIC,
  carrier_longitude NUMERIC,
  carrier_distance_from_destination NUMERIC, -- in miles
  delivery_photo_url TEXT,
  signature_url TEXT,
  carrier_notes TEXT,
  
  -- Receiver confirmation
  receiver_id UUID,
  receiver_confirmed_at TIMESTAMP WITH TIME ZONE,
  receiver_notes TEXT,
  
  -- Shipper confirmation
  shipper_confirmed_at TIMESTAMP WITH TIME ZONE,
  shipper_notes TEXT,
  
  -- Status and timeout tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'carrier_confirmed', 'partially_confirmed', 'fully_confirmed', 'disputed', 'admin_review')),
  confirmation_deadline TIMESTAMP WITH TIME ZONE,
  escalated_to_admin_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(load_assignment_id)
);

-- Create receiver_links table for confirmation code system
CREATE TABLE public.receiver_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  load_id UUID NOT NULL REFERENCES public.loads(id) ON DELETE CASCADE,
  confirmation_code TEXT NOT NULL UNIQUE,
  receiver_id UUID, -- NULL until receiver claims the code
  shipper_id UUID NOT NULL, -- Who generated the code
  claimed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(load_id) -- One receiver link per load
);

-- Enable RLS
ALTER TABLE public.delivery_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receiver_links ENABLE ROW LEVEL SECURITY;

-- Create storage bucket for delivery proofs
INSERT INTO storage.buckets (id, name, public) VALUES ('delivery-proofs', 'delivery-proofs', false);

-- RLS Policies for delivery_confirmations

-- Carriers can view/update confirmations for their assignments
CREATE POLICY "Carriers can view their delivery confirmations"
ON public.delivery_confirmations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.load_assignments
    WHERE load_assignments.id = delivery_confirmations.load_assignment_id
    AND load_assignments.carrier_id = auth.uid()
  )
);

CREATE POLICY "Carriers can insert delivery confirmations"
ON public.delivery_confirmations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.load_assignments
    WHERE load_assignments.id = load_assignment_id
    AND load_assignments.carrier_id = auth.uid()
    AND load_assignments.status = 'in_transit'
  )
);

CREATE POLICY "Carriers can update their delivery confirmations"
ON public.delivery_confirmations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.load_assignments
    WHERE load_assignments.id = delivery_confirmations.load_assignment_id
    AND load_assignments.carrier_id = auth.uid()
  )
);

-- Shippers can view/update confirmations for their loads
CREATE POLICY "Shippers can view their delivery confirmations"
ON public.delivery_confirmations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.load_assignments
    WHERE load_assignments.id = delivery_confirmations.load_assignment_id
    AND load_assignments.shipper_id = auth.uid()
  )
);

CREATE POLICY "Shippers can update their delivery confirmations"
ON public.delivery_confirmations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.load_assignments
    WHERE load_assignments.id = delivery_confirmations.load_assignment_id
    AND load_assignments.shipper_id = auth.uid()
  )
);

-- Receivers can view/update confirmations they are linked to
CREATE POLICY "Receivers can view their delivery confirmations"
ON public.delivery_confirmations FOR SELECT
USING (receiver_id = auth.uid());

CREATE POLICY "Receivers can update their delivery confirmations"
ON public.delivery_confirmations FOR UPDATE
USING (receiver_id = auth.uid());

-- Admins can do everything
CREATE POLICY "Admins can manage all delivery confirmations"
ON public.delivery_confirmations FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for receiver_links

-- Shippers can create/view links for their loads
CREATE POLICY "Shippers can create receiver links"
ON public.receiver_links FOR INSERT
WITH CHECK (
  shipper_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.loads
    WHERE loads.id = load_id
    AND loads.user_id = auth.uid()
  )
);

CREATE POLICY "Shippers can view their receiver links"
ON public.receiver_links FOR SELECT
USING (shipper_id = auth.uid());

-- Receivers can view and claim links
CREATE POLICY "Receivers can view links by code"
ON public.receiver_links FOR SELECT
USING (
  receiver_id = auth.uid() OR
  has_role(auth.uid(), 'receiver'::app_role)
);

CREATE POLICY "Receivers can claim links"
ON public.receiver_links FOR UPDATE
USING (
  (receiver_id IS NULL OR receiver_id = auth.uid()) AND
  has_role(auth.uid(), 'receiver'::app_role)
);

-- Admins can manage all links
CREATE POLICY "Admins can manage all receiver links"
ON public.receiver_links FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Storage policies for delivery-proofs bucket

-- Users can upload their own proofs
CREATE POLICY "Users can upload delivery proofs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'delivery-proofs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view proofs for their related deliveries
CREATE POLICY "Users can view related delivery proofs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'delivery-proofs' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Function to generate random confirmation code
CREATE OR REPLACE FUNCTION public.generate_confirmation_code()
RETURNS TEXT
LANGUAGE sql
AS $$
  SELECT upper(substr(md5(random()::text), 1, 8))
$$;

-- Trigger to update updated_at
CREATE TRIGGER update_delivery_confirmations_updated_at
BEFORE UPDATE ON public.delivery_confirmations
FOR EACH ROW
EXECUTE FUNCTION public.update_profiles_updated_at();