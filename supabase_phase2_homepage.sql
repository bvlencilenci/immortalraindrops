-- Extend system_settings with Homepage CMS controls
ALTER TABLE public.system_settings 
ADD COLUMN IF NOT EXISTS hero_mode TEXT DEFAULT 'custom' CHECK (hero_mode IN ('featured_release', 'featured_news', 'featured_artist', 'custom')),
ADD COLUMN IF NOT EXISTS featured_release_id UUID REFERENCES public.tracks(id),
ADD COLUMN IF NOT EXISTS featured_news_id UUID REFERENCES public.news_posts(id),
ADD COLUMN IF NOT EXISTS featured_artist TEXT,
ADD COLUMN IF NOT EXISTS custom_hero_title TEXT DEFAULT 'IMMORTAL RAINDROPS',
ADD COLUMN IF NOT EXISTS custom_hero_text TEXT DEFAULT 'ARCHIVE & TRANSMISSIONS COLLECTIVE',
ADD COLUMN IF NOT EXISTS show_news_on_homepage BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS announcement_banner TEXT,
ADD COLUMN IF NOT EXISTS announcement_enabled BOOLEAN DEFAULT false;
