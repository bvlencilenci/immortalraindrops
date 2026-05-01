CREATE TABLE news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  published_at timestamptz NOT NULL,
  category text CHECK (category IN ('GIG', 'RELEASE', 'DROP', 'NEWS', 'UPDATE')),
  headline text NOT NULL,
  body text,
  link text,
  link_label text,
  visible boolean DEFAULT true
);

ALTER TABLE news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public SELECT on news" 
  ON news FOR SELECT 
  USING (visible = true);

CREATE POLICY "Auth full access on news" 
  ON news FOR ALL 
  USING (auth.role() = 'authenticated');
