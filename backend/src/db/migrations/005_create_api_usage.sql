-- Track all Claude API calls for observability + cost monitoring
CREATE TABLE IF NOT EXISTS api_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model VARCHAR(100) NOT NULL,
  purpose VARCHAR(255) NOT NULL,
  tokens_in INTEGER NOT NULL DEFAULT 0,
  tokens_out INTEGER NOT NULL DEFAULT 0,
  cache_hit BOOLEAN NOT NULL DEFAULT false,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_usage_created ON api_usage_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_model ON api_usage_log(model);
