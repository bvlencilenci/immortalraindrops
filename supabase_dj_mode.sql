-- 1. Add DJ Broadcast Mode columns to system_settings
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS broadcast_mode TEXT DEFAULT 'automated';
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS dj_name TEXT;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS show_title TEXT;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS dj_location TEXT;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS dj_description TEXT;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS playback_history JSONB DEFAULT '[]'::jsonb;

-- 2. Make sure RLS is configured to allow anyone (anon, authenticated) to read these columns
-- (This is already covered by the existing "Allow public read access" policy on system_settings,
-- but we run this to ensure clean permissions)
GRANT SELECT ON public.system_settings TO anon, authenticated;
