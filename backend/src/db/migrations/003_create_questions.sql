CREATE TABLE questions (
  id               UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       UUID             NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  math_module      math_module      NOT NULL,
  difficulty_level difficulty_level NOT NULL,
  question_text    TEXT             NOT NULL,
  options          JSONB            NOT NULL,
  correct_option   VARCHAR(50)      NOT NULL,
  hint_text        TEXT,
  sequence_number  SMALLINT         NOT NULL,
  created_at       TIMESTAMPTZ      NOT NULL DEFAULT now(),
  CONSTRAINT questions_sequence_positive CHECK (sequence_number > 0),
  CONSTRAINT questions_options_is_array CHECK (jsonb_typeof(options) = 'array'),
  UNIQUE (session_id, sequence_number)
);

CREATE INDEX idx_questions_session_id ON questions (session_id);
CREATE INDEX idx_questions_sequence ON questions (session_id, sequence_number);
