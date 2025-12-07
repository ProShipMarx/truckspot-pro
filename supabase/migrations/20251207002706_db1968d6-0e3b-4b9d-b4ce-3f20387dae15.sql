-- Create user_favorites table for favoriting other users
CREATE TABLE public.user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  favorited_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  CONSTRAINT user_favorites_user_id_favorited_user_id_key UNIQUE(user_id, favorited_user_id),
  CONSTRAINT cannot_favorite_self CHECK (user_id != favorited_user_id)
);

-- Enable RLS
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Users can view their own favorites
CREATE POLICY "Users can view their own favorites"
ON public.user_favorites
FOR SELECT
USING (auth.uid() = user_id);

-- Users can add favorites
CREATE POLICY "Users can add favorites"
ON public.user_favorites
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can remove their favorites
CREATE POLICY "Users can remove favorites"
ON public.user_favorites
FOR DELETE
USING (auth.uid() = user_id);

-- Users can update notes on their favorites
CREATE POLICY "Users can update their favorites"
ON public.user_favorites
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can view all favorites
CREATE POLICY "Admins can view all favorites"
ON public.user_favorites
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));