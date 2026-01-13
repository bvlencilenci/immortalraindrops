-- Add missing columns for Upload Flow
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS duration NUMERIC;
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'song';
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS release_date TEXT;
