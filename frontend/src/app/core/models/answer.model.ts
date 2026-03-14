export interface SubmitAnswerDto {
  chosenOption: string | null;
  timeTakenMs: number;
}

export interface SessionProgress {
  questionsAnswered: number;
  totalQuestions: number;
  correctCount: number;
  coinsEarned: number;
  isComplete: boolean;
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
  sessionProgress: SessionProgress;
}
