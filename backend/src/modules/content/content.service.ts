import fs from 'fs';
import { ncertService } from '../ncert/ncert.service';
import { contentCache } from './content.cache';
import { callClaude, MODEL } from './ai.client';
import { TeachingContent, EvaluationSet, EvaluationQuestion } from './content.types';
import { AppError } from '../../shared/types/errors';
import { queryOne } from '../../db/client';

interface ThemeRow { style_guide: Record<string, string>; name: string; }

async function getTheme(themeSlug: string): Promise<ThemeRow> {
  const row = await queryOne<ThemeRow>('SELECT name, style_guide FROM themes WHERE slug=$1', [themeSlug]);
  if (!row) throw AppError.notFound(`Theme "${themeSlug}" not found`);
  return row;
}

function readChapterContent(classLevel: number, subject: string, chapterIndex: number): string {
  const subjectData = ncertService.getSubject(classLevel, subject);
  if (!subjectData) throw AppError.notFound(`Subject "${subject}" not found for Class ${classLevel}`);

  const chapter = subjectData.chapters[chapterIndex];
  if (!chapter) throw AppError.notFound(`Chapter ${chapterIndex} not found`);

  // Prefer markdown (fewer tokens), fall back to note that PDF exists
  if (chapter.markdownPath && fs.existsSync(chapter.markdownPath)) {
    const md = fs.readFileSync(chapter.markdownPath, 'utf8');
    return md.slice(0, 12000); // cap to ~3k tokens
  }

  // No markdown yet — return chapter title as minimal context
  return `Chapter from NCERT Class ${classLevel} ${subject}. Title: ${chapter.title}. PDF available at: ${chapter.pdfPath}`;
}

export const contentService = {
  async getTeachingContent(
    themeSlug: string, classLevel: number, subject: string, chapterIndex: number, userId?: string
  ): Promise<TeachingContent> {
    // 1. Cache hit → return immediately, no API call
    const cached = await contentCache.getTeaching(themeSlug, classLevel, subject, chapterIndex);
    if (cached) return cached;

    // 2. Cache miss → generate with Claude
    const [theme, chapterText] = await Promise.all([
      getTheme(themeSlug),
      Promise.resolve(readChapterContent(classLevel, subject, chapterIndex)),
    ]);

    const subjectData = ncertService.getSubject(classLevel, subject)!;
    const chapter = subjectData.chapters[chapterIndex]!;
    const style = theme.style_guide;

    const systemPrompt = `You are an AI teacher using the "${theme.name}" theme to teach NCERT content.
Theme vocabulary: ${JSON.stringify(style['vocabulary'] ?? [])}.
Tone: ${style['tone'] ?? 'engaging'}.
Your teaching should feel like a ${theme.name} adventure — immersive, gamified, but educationally accurate.
Always base your teaching strictly on the provided NCERT content.`;

    const userPrompt = `Teach Class ${classLevel} ${subject} - ${chapter.title} using the ${theme.name} theme.

NCERT Content:
${chapterText}

Return a JSON object with this exact structure:
{
  "sections": [
    { "heading": "section title", "body": "detailed explanation", "keyPoints": ["point1","point2"] }
  ],
  "summary": "brief recap"
}
Include 3-5 sections. Make it engaging and themed. Return ONLY valid JSON.`;

    const { text, tokensIn, tokensOut } = await callClaude(
      MODEL.BALANCED, systemPrompt, userPrompt, 'teaching_content', userId, 4096
    );

    let parsed: { sections: TeachingContent['sections']; summary: string };
    try {
      parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
    } catch {
      parsed = { sections: [{ heading: 'Introduction', body: text, keyPoints: [] }], summary: '' };
    }

    const content: TeachingContent = {
      chapterTitle: chapter.title,
      themeSlug, classLevel, subject, chapterIndex,
      sections: parsed.sections,
      summary: parsed.summary,
      fromCache: false,
    };

    await contentCache.saveTeaching(content, tokensIn + tokensOut, MODEL.BALANCED);
    return content;
  },

  async getEvaluationSet(
    themeSlug: string, classLevel: number, subject: string, chapterIndex: number, userId?: string
  ): Promise<EvaluationSet> {
    const cached = await contentCache.getEvaluation(themeSlug, classLevel, subject, chapterIndex);
    if (cached) return cached;

    const [theme, chapterText] = await Promise.all([
      getTheme(themeSlug),
      Promise.resolve(readChapterContent(classLevel, subject, chapterIndex)),
    ]);

    const subjectData = ncertService.getSubject(classLevel, subject)!;
    const chapter = subjectData.chapters[chapterIndex]!;
    const style = theme.style_guide;

    const systemPrompt = `You are an AI evaluator using the "${theme.name}" theme.
Create varied questions that test genuine understanding of NCERT content.
Wrap questions in theme language. Tone: ${style['tone'] ?? 'engaging'}.`;

    const userPrompt = `Create evaluation questions for Class ${classLevel} ${subject} - ${chapter.title}.

NCERT Content:
${chapterText}

Return JSON array with exactly 8 questions (3 MCQ, 3 short_answer, 2 long_answer):
[
  {
    "index": 0,
    "type": "mcq",
    "question": "question text",
    "themeWrapper": "e.g. The wizard challenges you:",
    "options": ["A","B","C","D"],
    "correctOption": 0,
    "sampleAnswer": "A"
  },
  {
    "index": 1,
    "type": "short_answer",
    "question": "question text",
    "themeWrapper": "themed wrapper",
    "sampleAnswer": "expected answer"
  },
  {
    "index": 2,
    "type": "long_answer",
    "question": "question text",
    "themeWrapper": "themed wrapper",
    "sampleAnswer": "detailed expected answer"
  }
]
Return ONLY valid JSON array.`;

    const { text, tokensIn, tokensOut } = await callClaude(
      MODEL.BALANCED, systemPrompt, userPrompt, 'evaluation_generation', userId, 3000
    );

    let questions: EvaluationQuestion[];
    try {
      questions = JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
    } catch {
      questions = [];
    }

    const evalSet: EvaluationSet = { themeSlug, classLevel, subject, chapterIndex, questions, fromCache: false };
    await contentCache.saveEvaluation(evalSet, tokensIn + tokensOut, MODEL.BALANCED);
    return evalSet;
  },
};
