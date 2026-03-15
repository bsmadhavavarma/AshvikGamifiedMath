import { query, queryOne } from '../../db/client';
import { TeachingContent, EvaluationSet } from './content.types';

export const contentCache = {
  async getTeaching(themeSlug: string, classLevel: number, subject: string, chapterIndex: number): Promise<TeachingContent | null> {
    const row = await queryOne<{ content: string; chapter_title: string }>(
      `SELECT content, chapter_title FROM content_cache
       WHERE theme_slug=$1 AND class_level=$2 AND subject=$3 AND chapter_index=$4 AND content_type='teaching'`,
      [themeSlug, classLevel, subject, chapterIndex]
    );
    if (!row) return null;
    const parsed = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
    return { ...parsed, chapterTitle: row.chapter_title, fromCache: true };
  },

  async saveTeaching(content: TeachingContent, tokensUsed: number, model: string): Promise<void> {
    const { themeSlug, classLevel, subject, chapterIndex, chapterTitle } = content;
    await query(
      `INSERT INTO content_cache (theme_slug, class_level, subject, chapter_index, chapter_title, content_type, content, tokens_used, model_used)
       VALUES ($1,$2,$3,$4,$5,'teaching',$6,$7,$8)
       ON CONFLICT (theme_slug, class_level, subject, chapter_index, content_type) DO UPDATE
       SET content=EXCLUDED.content, tokens_used=EXCLUDED.tokens_used, model_used=EXCLUDED.model_used`,
      [themeSlug, classLevel, subject, chapterIndex, chapterTitle, JSON.stringify(content), tokensUsed, model]
    );
  },

  async getEvaluation(themeSlug: string, classLevel: number, subject: string, chapterIndex: number): Promise<EvaluationSet | null> {
    const row = await queryOne<{ questions: string }>(
      `SELECT questions FROM evaluation_cache
       WHERE theme_slug=$1 AND class_level=$2 AND subject=$3 AND chapter_index=$4`,
      [themeSlug, classLevel, subject, chapterIndex]
    );
    if (!row) return null;
    const questions = typeof row.questions === 'string' ? JSON.parse(row.questions) : row.questions;
    return { themeSlug, classLevel, subject, chapterIndex, questions, fromCache: true };
  },

  async saveEvaluation(evalSet: EvaluationSet, tokensUsed: number, model: string): Promise<void> {
    const { themeSlug, classLevel, subject, chapterIndex, questions } = evalSet;
    await query(
      `INSERT INTO evaluation_cache (theme_slug, class_level, subject, chapter_index, questions, tokens_used, model_used)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (theme_slug, class_level, subject, chapter_index) DO UPDATE
       SET questions=EXCLUDED.questions, tokens_used=EXCLUDED.tokens_used, model_used=EXCLUDED.model_used`,
      [themeSlug, classLevel, subject, chapterIndex, JSON.stringify(questions), tokensUsed, model]
    );
  },
};
