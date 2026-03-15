CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL UNIQUE,
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 12),
  pin_hash VARCHAR(72) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_display_name ON users(display_name);
