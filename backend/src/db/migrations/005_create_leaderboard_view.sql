CREATE MATERIALIZED VIEW leaderboard AS
SELECT
  p.id                                                          AS player_id,
  p.display_name,
  p.avatar_code,
  p.total_coins,
  p.current_streak,
  p.longest_streak,
  COUNT(DISTINCT s.id)                                          AS total_sessions,
  COALESCE(SUM(s.correct_count), 0)                            AS total_correct,
  COALESCE(SUM(s.questions_answered), 0)                       AS total_answered,
  CASE
    WHEN COALESCE(SUM(s.questions_answered), 0) = 0 THEN 0
    ELSE ROUND(
      COALESCE(SUM(s.correct_count), 0)::NUMERIC /
      COALESCE(SUM(s.questions_answered), 1)::NUMERIC * 100,
      2
    )
  END                                                           AS accuracy_pct,
  RANK() OVER (ORDER BY p.total_coins DESC)                    AS rank
FROM players p
LEFT JOIN sessions s
  ON s.player_id = p.id
  AND s.status = 'completed'
GROUP BY
  p.id,
  p.display_name,
  p.avatar_code,
  p.total_coins,
  p.current_streak,
  p.longest_streak
WITH DATA;

-- Unique index required for REFRESH CONCURRENTLY
CREATE UNIQUE INDEX idx_leaderboard_player_id ON leaderboard (player_id);
CREATE INDEX idx_leaderboard_rank ON leaderboard (rank);
CREATE INDEX idx_leaderboard_total_coins ON leaderboard (total_coins DESC);
