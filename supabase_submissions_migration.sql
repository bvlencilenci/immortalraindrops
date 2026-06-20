-- Create Submissions Table
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  title TEXT,
  artist_name TEXT,
  audio_url TEXT,
  video_url TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  status_token UUID UNIQUE DEFAULT gen_random_uuid(),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id)
);

-- Backfill from tracks
INSERT INTO public.submissions (id, email, title, artist_name, audio_url, image_url, status, submitted_at, reviewed_at)
SELECT 
  gen_random_uuid() AS id,
  COALESCE(p.email, 'legacy@immortalraindrops.art') AS email,
  t.title,
  t.artist,
  t.tile_id || '/audio.' || t.audio_ext,
  t.tile_id || '/visual.' || t.image_ext,
  'approved',
  NOW(),
  NOW()
FROM public.tracks t
LEFT JOIN public.profiles p ON t.user_id = p.id;

-- Enable RLS
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Admins have full access
CREATE POLICY "Admins have full access to submissions"
ON public.submissions FOR ALL
USING (
  (SELECT is_godmode FROM public.profiles WHERE id = auth.uid()) = true
);

-- Anyone can insert (enforcing pending status)
CREATE POLICY "Anyone can insert submissions"
ON public.submissions FOR INSERT
WITH CHECK (
  status = 'pending'
);

-- Note: SELECT via status_token will be handled by the Server Component using the Service Role Key
-- to bypass RLS, keeping the table secure from public enumeration.

-- Create public view for approved submissions
CREATE OR REPLACE VIEW public.approved_submissions AS
SELECT 
  id, 
  title, 
  artist_name AS artist, 
  audio_url, 
  video_url, 
  image_url AS visual_url, 
  submitted_at AS release_date
FROM public.submissions
WHERE status = 'approved';

-- Grant access to the view
GRANT SELECT ON public.approved_submissions TO anon, authenticated, service_role;

-- Drop old voting related tables/views
DROP VIEW IF EXISTS public.tracks_with_votes;
DROP TABLE IF EXISTS public.votes;
