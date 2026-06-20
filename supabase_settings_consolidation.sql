-- Add missing columns to system_settings
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT FALSE;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS stream_title TEXT DEFAULT 'IMMORTAL RAINDROPS';
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS notification_webhook_url TEXT;

-- Migrate data from site_settings to system_settings
UPDATE system_settings 
SET 
  is_live = COALESCE((SELECT is_live FROM site_settings WHERE id = 1), FALSE),
  stream_title = COALESCE((SELECT stream_title FROM site_settings WHERE id = 1), 'IMMORTAL RAINDROPS'),
  notification_webhook_url = (SELECT notification_webhook_url FROM site_settings WHERE id = 1)
WHERE id = 1;

-- Drop site_settings table
DROP TABLE IF EXISTS site_settings;
