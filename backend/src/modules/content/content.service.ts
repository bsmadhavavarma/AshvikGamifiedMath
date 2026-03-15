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

  if (chapter.markdownPath && fs.existsSync(chapter.markdownPath)) {
    const md = fs.readFileSync(chapter.markdownPath, 'utf8');
    return md.slice(0, 10000); // ~2.5k tokens — reduced to speed up response
  }

  return `Chapter from NCERT Class ${classLevel} ${subject}. Title: ${chapter.title}. PDF available at: ${chapter.pdfPath}`;
}

export const contentService = {
  async getTeachingContent(
    themeSlug: string, classLevel: number, subject: string, chapterIndex: number, userId?: string
  ): Promise<TeachingContent> {
    const cached = await contentCache.getTeaching(themeSlug, classLevel, subject, chapterIndex);
    if (cached) return cached;

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
Always base your teaching strictly on the provided NCERT content.
For mathematical or spatial concepts, include a simple SVG diagram in the section's "diagram" field.
SVG diagrams must be self-contained (inline style only), max 500 chars, use basic shapes.
Add a CSS keyframe animation when it helps understanding (e.g. showing movement, growth, highlight).`;

    const userPrompt = `Teach Class ${classLevel} ${subject} — "${chapter.title}" using the ${theme.name} theme.

NCERT Content:
${chapterText}

Return ONLY a JSON object with this exact structure (no markdown fences):
{
  "topics": ["topic 1 name", "topic 2 name"],
  "sections": [
    {
      "heading": "section title",
      "body": "clear explanation in 3-5 sentences",
      "keyPoints": ["point1","point2"],
      "diagram": "<svg ...>...</svg> or null"
    }
  ],
  "summary": "one paragraph recap"
}
Rules:
- 3-5 sections maximum (keep concise for faster response)
- topics = a bullet-list of what this chapter covers (extracted from content)
- diagram: include SVG for geometry, measurements, fractions, shapes, graphs, sequences; null otherwise
- SVG must use width/height attributes, inline styles, no external references`;

    const { text, tokensIn, tokensOut } = await callClaude(
      MODEL.BALANCED, systemPrompt, userPrompt, 'teaching_content', userId, 3000
    );

    let parsed: { topics?: string[]; sections: TeachingContent['sections']; summary: string };
    try {
      parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
    } catch {
      parsed = { topics: [], sections: [{ heading: 'Introduction', body: text, keyPoints: [], diagram: null }], summary: '' };
    }

    const content: TeachingContent = {
      chapterTitle: chapter.title,
      source: { classLevel, subject, chapterTitle: chapter.title },
      topics: parsed.topics ?? [],
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

    const userPrompt = `Create evaluation questions for Class ${classLevel} ${subject} — "${chapter.title}".

NCERT Content:
${chapterText}

Return ONLY a JSON array with exactly 6 questions (3 MCQ, 2 short_answer, 1 long_answer):
[
  { "index":0, "type":"mcq", "question":"...", "themeWrapper":"...", "options":["A","B","C","D"], "correctOption":0, "sampleAnswer":"A" },
  { "index":1, "type":"short_answer", "question":"...", "themeWrapper":"...", "sampleAnswer":"..." },
  { "index":2, "type":"long_answer", "question":"...", "themeWrapper":"...", "sampleAnswer":"..." }
]
Return ONLY valid JSON array, no markdown fences.`;

    const { text, tokensIn, tokensOut } = await callClaude(
      MODEL.BALANCED, systemPrompt, userPrompt, 'evaluation_generation', userId, 2000
    );

    let questions: EvaluationQuestion[];
    try {
      questions = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
    } catch {
      questions = [];
    }

    const evalSet: EvaluationSet = { themeSlug, classLevel, subject, chapterIndex, questions, fromCache: false };
    await contentCache.saveEvaluation(evalSet, tokensIn + tokensOut, MODEL.BALANCED);
    return evalSet;
  },
};
