import { callClaude, MODEL } from '../content/ai.client';
import { query, queryOne } from '../../db/client';
import { AppError } from '../../shared/types/errors';
import { logger } from '../../config/logger';

export interface AnswerSubmission {
  sessionId: string;
  userId: string;
  questionIndex: number;
  questionType: 'mcq' | 'short_answer' | 'long_answer' | 'diagram_description';
  questionText: string;
  userAnswer: string;
  sampleAnswer?: string;
  themeSlug: string;
}

export interface EvaluationResult {
  isCorrect: boolean;
  score: number; // 0-100
  feedback: string;
  themeFeedback: string; // themed version of feedback
}

export interface SessionDecision {
  action: 'continue' | 'complete' | 'repeat_chapter' | 'remediation';
  remediationLevel?: number;
  message: string;
}

interface SessionRow {
  id: string; theme_slug: string; class_level: number; subject: string; chapter_index: number; status: string;
}

interface AttemptStats {
  total: string; correct_count: string; avg_score: string;
}

export const evaluationService = {
  async createSession(userId: string, themeSlug: string, classLevel: number, subject: string, chapterIndex: number): Promise<string> {
    const rows = await query<{ id: string }>(
      `INSERT INTO learning_sessions (user_id, theme_slug, class_level, subject, chapter_index, status)
       VALUES ($1,$2,$3,$4,$5,'teaching') RETURNING id`,
      [userId, themeSlug, classLevel, subject, chapterIndex]
    );
    return rows[0]!.id;
  },

  async startEvaluation(sessionId: string, userId: string): Promise<void> {
    await query(
      `UPDATE learning_sessions SET status='evaluating' WHERE id=$1 AND user_id=$2`,
      [sessionId, userId]
    );
  },

  async submitAnswer(submission: AnswerSubmission): Promise<EvaluationResult> {
    const { questionType, questionText, userAnswer, sampleAnswer, themeSlug } = submission;

    let isCorrect = false;
    let score = 0;
    let rawFeedback = '';

    if (questionType === 'mcq') {
      // Fast path: no AI needed for MCQ
      isCorrect = userAnswer.trim().toLowerCase() === (sampleAnswer ?? '').trim().toLowerCase();
      score = isCorrect ? 100 : 0;
      rawFeedback = isCorrect ? 'Correct!' : `Incorrect. The correct answer is: ${sampleAnswer}`;
    } else {
      // Use AI for open-ended questions — haiku for short, sonnet for long
      const model = questionType === 'long_answer' ? MODEL.BALANCED : MODEL.FAST;
      const system = `You are an evaluator. Assess the student's answer strictly based on the NCERT content.
Return JSON: { "score": 0-100, "isCorrect": boolean, "feedback": "detailed feedback" }`;
      const prompt = `Question: ${questionText}
Expected answer: ${sampleAnswer ?? 'N/A'}
Student answer: ${userAnswer}
Evaluate accuracy and completeness. Return ONLY valid JSON.`;

      const { text, tokensIn, tokensOut } = await callClaude(model, system, prompt, 'answer_evaluation', submission.userId);
      try {
        const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
        score = parsed.score ?? 0;
        isCorrect = parsed.isCorrect ?? score >= 60;
        rawFeedback = parsed.feedback ?? text;
      } catch {
        score = 50; isCorrect = false; rawFeedback = text;
      }
      void tokensIn; void tokensOut;
    }

    // Wrap feedback in theme language
    const themeRow = await queryOne<{ style_guide: Record<string, string> }>(
      'SELECT style_guide FROM themes WHERE slug=$1', [themeSlug]
    );
    const style = themeRow?.style_guide ?? {};
    const themeFeedback = isCorrect
      ? `${style['correct_response'] ?? 'Correct!'} ${rawFeedback}`
      : `${style['wrong_response'] ?? 'Not quite!'} ${rawFeedback}`;

    // Persist attempt
    await query(
      `INSERT INTO evaluation_attempts (session_id, user_id, question_index, question_type, question_text, user_answer, is_correct, score, ai_feedback)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [submission.sessionId, submission.userId, submission.questionIndex, questionType, questionText, userAnswer, isCorrect, score, rawFeedback]
    );

    return { isCorrect, score, feedback: rawFeedback, themeFeedback };
  },

  async decideNextAction(sessionId: string, userId: string): Promise<SessionDecision> {
    const session = await queryOne<SessionRow>(
      'SELECT * FROM learning_sessions WHERE id=$1 AND user_id=$2', [sessionId, userId]
    );
    if (!session) throw AppError.notFound('Session not found');

    const stats = await queryOne<AttemptStats>(
      `SELECT COUNT(*) as total, SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_count, AVG(score) as avg_score
       FROM evaluation_attempts WHERE session_id=$1`, [sessionId]
    );

    const avgScore = parseFloat(stats?.avg_score ?? '0');
    const total = parseInt(stats?.total ?? '0');

    if (total < 8) {
      return { action: 'continue', message: 'Keep going!' };
    }

    let action: SessionDecision['action'];
    let message: string;
    let remediationLevel: number | undefined;

    if (avgScore >= 80) {
      action = 'complete';
      message = 'Excellent! Chapter mastered. Moving to the next chapter.';
      await query(`UPDATE learning_sessions SET status='completed', completed_at=NOW() WHERE id=$1`, [sessionId]);
      await this.updateProgress(userId, session.class_level, session.subject, session.chapter_index, avgScore, 'mastered');
    } else if (avgScore >= 50) {
      action = 'repeat_chapter';
      message = 'Good effort! Let us review this chapter once more before moving on.';
      await query(`UPDATE learning_sessions SET status='needs_repeat' WHERE id=$1`, [sessionId]);
      await this.updateProgress(userId, session.class_level, session.subject, session.chapter_index, avgScore, 'in_progress');
    } else {
      // Below 50 — go back a level for remediation
      remediationLevel = Math.max(1, session.class_level - 1);
      action = 'remediation';
      message = `Let us strengthen your foundation. We will revisit Class ${remediationLevel} concepts first.`;
      await query(`UPDATE learning_sessions SET status='remediation' WHERE id=$1`, [sessionId]);
    }

    logger.info({ sessionId, avgScore, action }, 'Session decision made');
    return { action, message, remediationLevel };
  },

  async updateProgress(userId: string, classLevel: number, subject: string, chapterIndex: number, score: number, status: string): Promise<void> {
    await query(
      `INSERT INTO user_progress (user_id, class_level, subject, chapter_index, best_score, attempts, status, completed_at)
       VALUES ($1,$2,$3,$4,$5,1,$6,CASE WHEN $6='mastered' THEN NOW() ELSE NULL END)
       ON CONFLICT (user_id, class_level, subject, chapter_index) DO UPDATE
       SET best_score=GREATEST(user_progress.best_score,$5), attempts=user_progress.attempts+1,
           status=EXCLUDED.status, completed_at=EXCLUDED.completed_at`,
      [userId, classLevel, subject, chapterIndex, score, status]
    );
  },

  async getProgress(userId: string): Promise<unknown[]> {
    return query(
      `SELECT class_level, subject, chapter_index, best_score, attempts, status, completed_at
       FROM user_progress WHERE user_id=$1 ORDER BY class_level, subject, chapter_index`,
      [userId]
    );
  },
};
