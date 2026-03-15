-- Cached AI-generated teaching content per theme+class+subject+chapter
CREATE TABLE IF NOT EXISTS content_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_slug VARCHAR(100) NOT NULL,
  class_level INTEGER NOT NULL CHECK (class_level BETWEEN 1 AND 12),
  subject VARCHAR(255) NOT NULL,
  chapter_index INTEGER NOT NULL,
  chapter_title VARCHAR(500),
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('teaching', 'summary')),
  content TEXT NOT NULL,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  model_used VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (theme_slug, class_level, subject, chapter_index, content_type)
);

-- Cached evaluation questions per theme+class+subject+chapter
CREATE TABLE IF NOT EXISTS evaluation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_slug VARCHAR(100) NOT NULL,
  class_level INTEGER NOT NULL,
  subject VARCHAR(255) NOT NULL,
  chapter_index INTEGER NOT NULL,
  questions JSONB NOT NULL,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  model_used VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (theme_slug, class_level, subject, chapter_index)
);

CREATE INDEX IF NOT EXISTS idx_content_cache_lookup
  ON content_cache(theme_slug, class_level, subject, chapter_index, content_type);

CREATE INDEX IF NOT EXISTS idx_evaluation_cache_lookup
  ON evaluation_cache(theme_slug, class_level, subject, chapter_index);
