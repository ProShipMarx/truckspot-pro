
-- Table for storing carrier's third-party load board credentials (encrypted)
CREATE TABLE public.carrier_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  platform text NOT NULL CHECK (platform IN ('dat_one', 'truckstop', '123loadboard', 'trucker_path')),
  encrypted_username text NOT NULL,
  encrypted_password text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  last_used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform)
);

ALTER TABLE public.carrier_credentials ENABLE ROW LEVEL SECURITY;

-- Carriers can only manage their own credentials
CREATE POLICY "Users can view their own credentials"
  ON public.carrier_credentials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credentials"
  ON public.carrier_credentials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credentials"
  ON public.carrier_credentials FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own credentials"
  ON public.carrier_credentials FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all credentials"
  ON public.carrier_credentials FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Table for broker search history and results
CREATE TABLE public.broker_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  origin text NOT NULL,
  destination text NOT NULL,
  equipment_type text NOT NULL,
  date_from date,
  date_to date,
  radius_miles integer DEFAULT 50,
  platforms_searched text[] NOT NULL DEFAULT '{}',
  results_count integer DEFAULT 0,
  results jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'searching', 'completed', 'failed')),
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone
);

ALTER TABLE public.broker_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own searches"
  ON public.broker_searches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own searches"
  ON public.broker_searches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own searches"
  ON public.broker_searches FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all searches"
  ON public.broker_searches FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Updated_at trigger for carrier_credentials
CREATE TRIGGER update_carrier_credentials_updated_at
  BEFORE UPDATE ON public.carrier_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profiles_updated_at();
