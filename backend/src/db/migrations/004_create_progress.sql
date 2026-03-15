-- User learning sessions
CREATE TABLE IF NOT EXISTS learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme_slug VARCHAR(100) NOT NULL,
  class_level INTEGER NOT NULL,
  subject VARCHAR(255) NOT NULL,
  chapter_index INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'teaching' CHECK (status IN ('teaching', 'evaluating', 'completed', 'needs_repeat', 'remediation')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Evaluation attempts by users
CREATE TABLE IF NOT EXISTS evaluation_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL,
  question_type VARCHAR(50) NOT NULL CHECK (question_type IN ('mcq', 'short_answer', 'long_answer', 'diagram_description')),
  question_text TEXT NOT NULL,
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN,
  score NUMERIC(4,2),
  ai_feedback TEXT,
  tokens_used INTEGER DEFAULT 0,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Overall user progress per subject+chapter
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_level INTEGER NOT NULL,
  subject VARCHAR(255) NOT NULL,
  chapter_index INTEGER NOT NULL,
  best_score NUMERIC(4,2) DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'mastered')),
  completed_at TIMESTAMPTZ,
  UNIQUE (user_id, class_level, subject, chapter_index)
);

CREATE INDEX IF NOT EXISTS idx_learning_sessions_user ON learning_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_eval_attempts_session ON evaluation_attempts(session_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_lookup ON user_progress(user_id, class_level, subject);
