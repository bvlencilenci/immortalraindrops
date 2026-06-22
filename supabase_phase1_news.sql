-- Create news_posts table
CREATE TABLE IF NOT EXISTS public.news_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    excerpt TEXT,
    body TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('news', 'release', 'event', 'editorial')),
    cover_image TEXT,
    featured BOOLEAN DEFAULT false,
    published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.news_posts ENABLE ROW LEVEL SECURITY;

-- Drop policies if exist
DROP POLICY IF EXISTS "Allow public SELECT on published news posts" ON public.news_posts;
DROP POLICY IF EXISTS "Allow admin ALL on news posts" ON public.news_posts;

-- Create policies
CREATE POLICY "Allow public SELECT on published news posts"
ON public.news_posts FOR SELECT
USING (published = true AND (published_at IS NULL OR published_at <= NOW()));

CREATE POLICY "Allow admin ALL on news posts"
ON public.news_posts FOR ALL
USING (
  (SELECT is_godmode FROM public.profiles WHERE id = auth.uid()) = true
);
