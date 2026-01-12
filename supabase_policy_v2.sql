-- Consolidate and Clean Policies for 'tracks' Table

-- 1. Drop existing policies to remove redundancy and potential conflicts
DROP POLICY IF EXISTS "public_upload" ON public.tracks;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.tracks; -- Example of default policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.tracks;

-- 2. Create Consolidated Public Upload Policy
-- Allows 'anon' role (public users) to insert rows if the tile_id follows the convention 'tile-%'.
CREATE POLICY "public_upload" 
ON public.tracks 
FOR INSERT 
TO anon 
WITH CHECK (tile_id LIKE 'tile-%');

-- 3. Create Public Read Policy (Essential for the Archive page to work)
-- Allows everyone to read all rows.
CREATE POLICY "public_read" 
ON public.tracks 
FOR SELECT 
USING (true);

-- 4. Ensure Permissions
GRANT INSERT, SELECT ON public.tracks TO anon;
GRANT INSERT, SELECT ON public.tracks TO authenticated;
GRANT INSERT, SELECT ON public.tracks TO service_role;
