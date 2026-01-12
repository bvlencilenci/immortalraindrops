-- Create a policy to allow public inserts for the 'tracks' table
-- This is necessary for the upload process to "register" tracks before finalization logic
-- The logic checks if tile_id starts with 'tile-' to prevent garbage data

CREATE POLICY "public_upload" 
ON public.tracks 
FOR INSERT 
TO anon 
WITH CHECK (tile_id LIKE 'tile-%');

-- Optionally ensure 'anon' has insert permissions on the table itself
GRANT INSERT ON public.tracks TO anon;
