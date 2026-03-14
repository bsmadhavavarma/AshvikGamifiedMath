export interface GeneratedQuestion {
  questionText: string;
  options: string[];
  correctOption: string;
  hintText?: string;
}

export interface IQuestionGenerator {
  readonly mathModule: string;
  readonly difficultyLevel: string;
  generate(): GeneratedQuestion;
}
