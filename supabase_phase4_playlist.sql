-- ═══════════════════════════════════════════════════════════════════
-- PHASE 4: playlist_tracks — Admin-Only Radio Rotation Table
-- Isolated from public submissions/archive workflow.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.playlist_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist_name TEXT,
  audio_url TEXT NOT NULL,
  featured BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  uploaded_by UUID REFERENCES public.profiles(id)
);

-- Enable Row Level Security
ALTER TABLE public.playlist_tracks ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════
-- RLS Policies: Godmode-only access. No anon/public access.
-- ═══════════════════════════════════════════════════════════════════

-- SELECT: Only godmode admins can read
CREATE POLICY "playlist_tracks_select_godmode"
  ON public.playlist_tracks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_godmode = true
    )
  );

-- INSERT: Only godmode admins can insert
CREATE POLICY "playlist_tracks_insert_godmode"
  ON public.playlist_tracks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_godmode = true
    )
  );

-- UPDATE: Only godmode admins can update
CREATE POLICY "playlist_tracks_update_godmode"
  ON public.playlist_tracks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_godmode = true
    )
  );

-- DELETE: Only godmode admins can delete
CREATE POLICY "playlist_tracks_delete_godmode"
  ON public.playlist_tracks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_godmode = true
    )
  );

-- No GRANT to anon. Table is invisible to unauthenticated users.
-- Service role key used by sync-tracks.sh bypasses RLS automatically.
