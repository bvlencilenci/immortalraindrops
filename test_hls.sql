-- Insert a test HLS video track
-- Using a public Big Buck Bunny HLS stream
-- We'll use a fake tile_id and point the visual_url to the .m3u8 manifest
INSERT INTO public.tracks (
  tile_id, 
  tile_index, 
  title, 
  artist, 
  genre, 
  media_type, 
  audio_ext, 
  image_ext, 
  created_at, 
  release_date, 
  duration
) VALUES (
  'hls-test-bunny', 
  999, 
  'BIG BUCK BUNNY (HLS)', 
  'TEST STREAM', 
  'ADAPTIVE', 
  'video', 
  NULL, -- No separate audio file for videos
  'm3u8', -- Manifest extension
  NOW(), 
  NOW(), 
  0
) ON CONFLICT (tile_id) DO UPDATE SET image_ext = EXCLUDED.image_ext, audio_ext = NULL;
