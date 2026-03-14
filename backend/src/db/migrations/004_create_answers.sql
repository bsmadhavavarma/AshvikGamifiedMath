CREATE TABLE answers (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     UUID          NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  question_id    UUID          NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  player_id      UUID          NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  chosen_option  VARCHAR(50),
  is_correct     BOOLEAN       NOT NULL,
  time_taken_ms  INT           NOT NULL,
  coins_awarded  INT           NOT NULL DEFAULT 0,
  answered_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT answers_time_taken_non_negative CHECK (time_taken_ms >= 0),
  CONSTRAINT answers_coins_non_negative CHECK (coins_awarded >= 0),
  UNIQUE (session_id, question_id)
);

CREATE INDEX idx_answers_session_id ON answers (session_id);
CREATE INDEX idx_answers_player_id ON answers (player_id);
CREATE INDEX idx_answers_question_id ON answers (question_id);
