-- BACKFILL MISSING PROFILES
-- Run this if you have Users in Auth but no Profiles in the table.

INSERT INTO public.profiles (id, username, role, avatar_url)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'username', 'user_' || substr(id::text, 1, 8)),
  'user',
  raw_user_meta_data->>'avatar_url'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- Also, ensure the logged-in user (you) is an ADMIN for Godmode testing
-- Replace 'immortalraindropsceo' with your actual username if different
UPDATE public.profiles
SET role = 'admin'
WHERE username = 'immortalraindropsceo';
