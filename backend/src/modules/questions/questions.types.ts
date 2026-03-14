export interface Question {
  id: string;
  sessionId: string;
  mathModule: string;
  difficultyLevel: string;
  questionText: string;
  options: string[];
  correctOption: string;
  hintText: string | null;
  sequenceNumber: number;
  createdAt: Date;
}

export interface QuestionRow {
  id: string;
  session_id: string;
  math_module: string;
  difficulty_level: string;
  question_text: string;
  options: string[];
  correct_option: string;
  hint_text: string | null;
  sequence_number: number;
  created_at: Date;
}

export function rowToQuestion(row: QuestionRow): Question {
  return {
    id: row.id,
    sessionId: row.session_id,
    mathModule: row.math_module,
    difficultyLevel: row.difficulty_level,
    questionText: row.question_text,
    options: row.options,
    correctOption: row.correct_option,
    hintText: row.hint_text,
    sequenceNumber: row.sequence_number,
    createdAt: row.created_at,
  };
}
