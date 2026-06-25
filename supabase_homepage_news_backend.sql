-- Homepage central panel news backend
CREATE TABLE IF NOT EXISTS public.news_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT,
  status TEXT DEFAULT 'draft',
  pinned BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.news_posts
  ADD COLUMN IF NOT EXISTS content TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Compatibility with older dispatch tooling/data, safe to keep if already present.
ALTER TABLE public.news_posts
  ADD COLUMN IF NOT EXISTS body TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'news',
  ADD COLUMN IF NOT EXISTS cover_image TEXT,
  ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT FALSE;

UPDATE public.news_posts
SET
  content = COALESCE(content, body, ''),
  status = CASE
    WHEN status IS NOT NULL THEN status
    WHEN published IS TRUE THEN 'published'
    ELSE 'draft'
  END,
  pinned = COALESCE(pinned, featured, FALSE)
WHERE content IS NULL
   OR status IS NULL
   OR pinned IS NULL;

ALTER TABLE public.news_posts
  ALTER COLUMN content SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'draft',
  ALTER COLUMN pinned SET DEFAULT FALSE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'news_posts_status_check'
  ) THEN
    ALTER TABLE public.news_posts
      ADD CONSTRAINT news_posts_status_check CHECK (status IN ('draft', 'published'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS news_posts_single_pinned_idx
ON public.news_posts ((pinned))
WHERE pinned IS TRUE;

ALTER TABLE public.system_settings
  ADD COLUMN IF NOT EXISTS homepage_instagram_image_url TEXT,
  ADD COLUMN IF NOT EXISTS homepage_instagram_image_alt TEXT;

ALTER TABLE public.news_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public SELECT on published news posts" ON public.news_posts;
DROP POLICY IF EXISTS "Allow admin ALL on news posts" ON public.news_posts;

CREATE POLICY "Allow public SELECT on published news posts"
ON public.news_posts FOR SELECT
USING (status = 'published' AND (published_at IS NULL OR published_at <= NOW()));

CREATE POLICY "Allow admin ALL on news posts"
ON public.news_posts FOR ALL
USING (
  (SELECT is_godmode FROM public.profiles WHERE id = auth.uid()) = true
)
WITH CHECK (
  (SELECT is_godmode FROM public.profiles WHERE id = auth.uid()) = true
);
