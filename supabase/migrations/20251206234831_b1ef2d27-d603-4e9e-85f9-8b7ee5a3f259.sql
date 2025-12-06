-- Add 'receiver' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'receiver';

-- Add business_address column to profiles table for receivers
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_address text;