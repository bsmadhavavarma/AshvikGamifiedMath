export interface TeachingContent {
  chapterTitle: string;
  source: { classLevel: number; subject: string; chapterTitle: string; };
  topics: string[];
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
  diagram?: string | null; // reserved for future SVG — not currently generated in main JSON
}

export interface EvaluationQuestion {
  index: number;
  type: 'mcq' | 'short_answer' | 'long_answer' | 'diagram_description';
  question: string;
  options?: string[];
  correctOption?: number;
  sampleAnswer?: string;
  themeWrapper: string;
}

export interface EvaluationSet {
  themeSlug: string;
  classLevel: number;
  subject: string;
  chapterIndex: number;
  questions: EvaluationQuestion[];
  fromCache: boolean;
}
