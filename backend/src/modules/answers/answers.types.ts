export interface Answer {
  id: string;
  sessionId: string;
  questionId: string;
  playerId: string;
  chosenOption: string | null;
  isCorrect: boolean;
  timeTakenMs: number;
  coinsAwarded: number;
  answeredAt: Date;
}

export interface SubmitAnswerDto {
  chosenOption: string | null;
  timeTakenMs: number;
}

export interface AnswerFeedback {
  answerId: string;
  isCorrect: boolean;
  correctOption: string;
  chosenOption: string | null;
  coinsAwarded: number;
  currentStreak: number;
  totalCoins: number;
  explanation: string;
  sessionProgress: {
    questionsAnswered: number;
    totalQuestions: number;
    correctCount: number;
    coinsEarned: number;
    isComplete: boolean;
  };
}

export interface AnswerRow {
  id: string;
  session_id: string;
  question_id: string;
  player_id: string;
  chosen_option: string | null;
  is_correct: boolean;
  time_taken_ms: number;
  coins_awarded: number;
  answered_at: Date;
}

export function rowToAnswer(row: AnswerRow): Answer {
  return {
    id: row.id,
    sessionId: row.session_id,
    questionId: row.question_id,
    playerId: row.player_id,
    chosenOption: row.chosen_option,
    isCorrect: row.is_correct,
    timeTakenMs: row.time_taken_ms,
    coinsAwarded: row.coins_awarded,
    answeredAt: row.answered_at,
  };
}
