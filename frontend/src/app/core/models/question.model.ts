export interface Question {
  id: string;
  sessionId: string;
  questionText: string;
  options: string[];
  sequenceNumber: number;
  hintText?: string;
}
