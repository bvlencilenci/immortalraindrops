-- Final Schema: Minimal Profiles with Godmode (No Role)
-- Run this in your Supabase SQL Editor

-- 1. Create/Update Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  email TEXT,
  is_godmode BOOLEAN DEFAULT FALSE,
  is_authorized BOOLEAN DEFAULT FALSE,
  access_requested BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Site Settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
  id BIGINT PRIMARY KEY DEFAULT 1,
  is_live BOOLEAN DEFAULT FALSE,
  stream_title TEXT DEFAULT 'IMMORTAL RAINDROPS',
  notification_webhook_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_godmode BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Cleanup dependencies FIRST
DROP POLICY IF EXISTS "Admins can delete anything" ON public.tracks;

-- Cleanup: Remove old columns
ALTER TABLE public.profiles DROP COLUMN IF EXISTS avatar_url;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Re-create Godmode Policy on Tracks (Optional but good for safety)
-- This replaces the old "Admins can delete anything" policy
DROP POLICY IF EXISTS "Godmode users can delete anything" ON public.tracks;
CREATE POLICY "Godmode users can delete anything"
ON public.tracks FOR DELETE
USING (
  (SELECT is_godmode FROM public.profiles WHERE id = auth.uid()) = true
);

-- Reset policies on profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create Policies
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 3. Auto-Create Profile Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, is_godmode)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'username', 
    new.email,
    FALSE -- Default godmode to FALSE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Permissions
GRANT ALL ON public.profiles TO postgres;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
