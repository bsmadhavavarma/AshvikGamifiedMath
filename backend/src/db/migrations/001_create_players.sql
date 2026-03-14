-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ENUM types
CREATE TYPE math_module AS ENUM ('percentages');
CREATE TYPE difficulty_level AS ENUM ('class5', 'class6');
CREATE TYPE session_status AS ENUM ('active', 'completed', 'abandoned');

-- Players table
CREATE TABLE players (
  id            UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name  VARCHAR(50)    NOT NULL,
  avatar_code   VARCHAR(20)    NOT NULL DEFAULT 'default',
  total_coins   INT            NOT NULL DEFAULT 0,
  current_streak INT           NOT NULL DEFAULT 0,
  longest_streak INT           NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ    NOT NULL DEFAULT now(),
  CONSTRAINT players_display_name_unique UNIQUE (display_name),
  CONSTRAINT players_total_coins_non_negative CHECK (total_coins >= 0),
  CONSTRAINT players_current_streak_non_negative CHECK (current_streak >= 0),
  CONSTRAINT players_longest_streak_non_negative CHECK (longest_streak >= 0)
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Index for leaderboard queries
CREATE INDEX idx_players_total_coins ON players (total_coins DESC);
CREATE INDEX idx_players_display_name ON players (display_name);
