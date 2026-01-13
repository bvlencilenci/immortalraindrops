-- FORCE FIX SCHEMA
-- Run this in Supabase SQL Editor

-- 1. Ensure Profiles Table & Columns
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  avatar_url TEXT,
  role TEXT DEFAULT 'user'
);

-- Ensure columns exist (in case table existed but was old)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Ensure Permissions
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.profiles TO postgres;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.profiles TO authenticated;

-- 3. Reset Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role, avatar_url)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'username', 
    'user',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Verify Views (Votes)
DROP VIEW IF EXISTS public.tracks_with_votes;
CREATE OR REPLACE VIEW public.tracks_with_votes AS
SELECT 
  t.*,
  COALESCE(SUM(v.vote_type), 0) as vote_count
FROM public.tracks t
LEFT JOIN public.votes v ON t.tile_id = v.track_id
GROUP BY t.id;

GRANT SELECT ON public.tracks_with_votes TO anon, authenticated;
