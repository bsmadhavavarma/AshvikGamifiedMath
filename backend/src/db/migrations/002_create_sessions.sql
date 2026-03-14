CREATE TABLE sessions (
  id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id           UUID            NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  math_module         math_module     NOT NULL,
  difficulty_level    difficulty_level NOT NULL,
  status              session_status  NOT NULL DEFAULT 'active',
  total_questions     INT             NOT NULL DEFAULT 10,
  questions_answered  INT             NOT NULL DEFAULT 0,
  correct_count       INT             NOT NULL DEFAULT 0,
  coins_earned        INT             NOT NULL DEFAULT 0,
  time_taken_secs     INT,
  started_at          TIMESTAMPTZ     NOT NULL DEFAULT now(),
  completed_at        TIMESTAMPTZ,
  CONSTRAINT sessions_questions_answered_valid CHECK (questions_answered >= 0 AND questions_answered <= total_questions),
  CONSTRAINT sessions_correct_count_valid CHECK (correct_count >= 0 AND correct_count <= questions_answered),
  CONSTRAINT sessions_coins_earned_non_negative CHECK (coins_earned >= 0)
);

CREATE INDEX idx_sessions_player_id ON sessions (player_id);
CREATE INDEX idx_sessions_status ON sessions (status);
CREATE INDEX idx_sessions_started_at ON sessions (started_at DESC);
