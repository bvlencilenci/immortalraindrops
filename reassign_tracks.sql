-- Reassign all "unowned" tracks to immortalraindropsceo
UPDATE public.tracks
SET user_id = (SELECT id FROM profiles WHERE username = 'immortalraindropsceo')
WHERE user_id IS NULL;

-- Verify the migration
SELECT title, artist, user_id FROM tracks;
