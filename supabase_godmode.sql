-- Enable DELETE operation for the tracks table
-- This policy allows any authenticated or anonymous user to delete rows.
-- In a real production app, you might restrict this to headers or specific user IDs,
-- but for this "God Mode" implementation which is protected by application-level logic (admins.ts + manual route),
-- we will enable the capability at the database level.

CREATE POLICY "godmode_delete" 
ON public.tracks 
FOR DELETE 
USING (true);

-- Ensure RLS is enabled (it should be, but just in case)
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
