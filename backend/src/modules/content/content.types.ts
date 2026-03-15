export interface TeachingContent {
  chapterTitle: string;
  themeSlug: string;
  classLevel: number;
  subject: string;
  chapterIndex: number;
  sections: TeachingSection[];
  summary: string;
  fromCache: boolean;
}

export interface TeachingSection {
  heading: string;
  body: string;
  keyPoints: string[];
}

export interface EvaluationQuestion {
  index: number;
  type: 'mcq' | 'short_answer' | 'long_answer' | 'diagram_description';
  question: string;
  options?: string[];       // MCQ only
  correctOption?: number;   // MCQ only
  sampleAnswer?: string;    // for AI evaluation guidance
  themeWrapper: string;     // e.g. "The wizard asks you:"
}

export interface EvaluationSet {
  themeSlug: string;
  classLevel: number;
  subject: string;
  chapterIndex: number;
  questions: EvaluationQuestion[];
  fromCache: boolean;
}
