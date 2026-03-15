import fs from 'fs';
import path from 'path';
import { ncertService } from '../ncert/ncert.service';
import { contentCache } from './content.cache';
import { callClaude, MODEL } from './ai.client';
import { TeachingContent, EvaluationSet, EvaluationQuestion } from './content.types';
import { AppError } from '../../shared/types/errors';
import { queryOne } from '../../db/client';

// Classes whose content is pre-generated as static JSON files in the repo.
// Runtime NEVER calls the Claude API for these classes.
const STATIC_CONTENT_CLASSES = [6, 9];
const STATIC_DATA_DIR = path.join(__dirname, '../../../data');

function safeReadJson<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  } catch { return null; }
}

function staticTeachingPath(classLevel: number, subject: string, chapterIndex: number): string {
  return path.join(STATIC_DATA_DIR, `class${classLevel}`, subject, `ch${chapterIndex}.teaching.json`);
}

function staticEvalPath(classLevel: number, subject: string, chapterIndex: number): string {
  return path.join(STATIC_DATA_DIR, `class${classLevel}`, subject, `ch${chapterIndex}.evaluation.json`);
}

function getStaticTeaching(classLevel: number, subject: string, chapterIndex: number): TeachingContent | null {
  if (!STATIC_CONTENT_CLASSES.includes(classLevel)) return null;
  const data = safeReadJson<TeachingContent>(staticTeachingPath(classLevel, subject, chapterIndex));
  return data ? { ...data, fromCache: true } : null;
}

function getStaticEvaluation(classLevel: number, subject: string, chapterIndex: number): EvaluationSet | null {
  if (!STATIC_CONTENT_CLASSES.includes(classLevel)) return null;
  const data = safeReadJson<EvaluationSet>(staticEvalPath(classLevel, subject, chapterIndex));
  return data ? { ...data, fromCache: true } : null;
}

export function saveStaticTeaching(content: TeachingContent): void {
  const filePath = staticTeachingPath(content.classLevel, content.subject, content.chapterIndex);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
}

export function saveStaticEvaluation(evalSet: EvaluationSet): void {
  const filePath = staticEvalPath(evalSet.classLevel, evalSet.subject, evalSet.chapterIndex);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(evalSet, null, 2));
}

interface ThemeRow { style_guide: Record<string, string>; name: string; }

async function getTheme(themeSlug: string): Promise<ThemeRow> {
  const row = await queryOne<ThemeRow>('SELECT name, style_guide FROM themes WHERE slug=$1', [themeSlug]);
  if (!row) throw AppError.notFound(`Theme "${themeSlug}" not found`);
  return row;
}

function cleanMarkdownForAI(raw: string): string {
  return raw
    .split('\n')
    .filter(line => {
      const t = line.trim();
      if (!t) return true; // keep blank lines for spacing
      // Remove PDF page footer timestamps: "## Chapter 4_Title.indd   74  13/08/2024"
      if (/\.indd\s+\d/.test(t)) return false;
      // Remove standalone page numbers
      if (/^\d{1,3}$/.test(t)) return false;
      // Remove reprint notices
      if (/^Reprint\s+\d{4}/.test(t)) return false;
      // Remove table-border artifacts: ## ||||, ## ___, etc.
      if (/^##\s*[|_\-]{2,}\s*$/.test(t)) return false;
      // Remove exercise/question-number-only headings: ## 1.  ## 2.
      if (/^##\s*\d+\.?\s*$/.test(t)) return false;
      return true;
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n') // collapse excess blank lines
    .trim();
}

function readChapterContent(classLevel: number, subject: string, chapterIndex: number): string {
  const subjectData = ncertService.getSubject(classLevel, subject);
  if (!subjectData) throw AppError.notFound(`Subject "${subject}" not found for Class ${classLevel}`);

  const chapter = subjectData.chapters[chapterIndex];
  if (!chapter) throw AppError.notFound(`Chapter ${chapterIndex} not found`);

  if (chapter.markdownPath && fs.existsSync(chapter.markdownPath)) {
    const raw = fs.readFileSync(chapter.markdownPath, 'utf8');
    const cleaned = cleanMarkdownForAI(raw);
    return cleaned.slice(0, 12000); // ~3k tokens of clean content
  }

  return `Chapter from NCERT Class ${classLevel} ${subject}. Title: ${chapter.title}.`;
}

export const contentService = {
  async getTeachingContent(
    themeSlug: string, classLevel: number, subject: string, chapterIndex: number, userId?: string
  ): Promise<TeachingContent> {
    // Class 6 and 9: always serve from pre-generated static files — never call the API
    const staticContent = getStaticTeaching(classLevel, subject, chapterIndex);
    if (staticContent) return staticContent;

    const cached = await contentCache.getTeaching(themeSlug, classLevel, subject, chapterIndex);
    if (cached) return cached;

    const [theme, chapterText] = await Promise.all([
      getTheme(themeSlug),
      Promise.resolve(readChapterContent(classLevel, subject, chapterIndex)),
    ]);

    const subjectData = ncertService.getSubject(classLevel, subject)!;
    const chapter = subjectData.chapters[chapterIndex]!;
    const style = theme.style_guide;

    const isJuniorClass = classLevel <= 6;
    const ageNote = isJuniorClass
      ? `The student is ${classLevel === 6 ? '10-11' : '8-10'} years old. Use very simple everyday language. Avoid jargon. Use real-life examples from daily life in India (food, games, cricket, festivals). Short sentences. Friendly and encouraging tone.`
      : `The student is in Class ${classLevel}. Use clear, precise language appropriate for their level.`;

    const systemPrompt = `You are an AI teacher using the "${theme.name}" theme to teach NCERT content.
${ageNote}
Theme vocabulary: ${JSON.stringify(style['vocabulary'] ?? [])}.
Tone: ${style['tone'] ?? 'engaging'}.
Base your teaching strictly on the provided NCERT content. Explain concepts in your own words clearly.
Do NOT reproduce raw text from the content — teach it, explain it, make it engaging.
${isJuniorClass ? 'For each concept, give a simple real-life example a child would relate to.' : ''}`;

    const userPrompt = `Teach Class ${classLevel} ${subject} — "${chapter.title}" using the ${theme.name} theme.

NCERT Content:
${chapterText}

Return ONLY a valid JSON object (no markdown fences, no extra text):
{
  "topics": ["topic 1", "topic 2", "topic 3"],
  "sections": [
    {
      "heading": "section title",
      "body": "2-4 sentences explaining this concept clearly in your own words${isJuniorClass ? ', using simple words and a relatable example' : ''}",
      "keyPoints": ["key point 1", "key point 2"]
    }
  ],
  "summary": "one paragraph recap of the whole chapter"
}
Rules:
- 3-5 sections only
- topics: what this chapter covers (extract from content)
- body: YOUR explanation, not a copy of the text${isJuniorClass ? '. Use simple words a child understands' : ''}.
- keyPoints: 2-3 bullet points per section`;

    const { text, tokensIn, tokensOut } = await callClaude(
      MODEL.BALANCED, systemPrompt, userPrompt, 'teaching_content', userId, 3000
    );

    let parsed: { topics?: string[]; sections: TeachingContent['sections']; summary: string };
    try {
      // Strip markdown fences and any text before the first { or after the last }
      const jsonText = text.replace(/```json\n?|\n?```/g, '').trim();
      const start = jsonText.indexOf('{');
      const end = jsonText.lastIndexOf('}');
      parsed = JSON.parse(start >= 0 && end > start ? jsonText.slice(start, end + 1) : jsonText);
    } catch {
      // If JSON parse fails entirely, build minimal sensible content
      parsed = {
        topics: [],
        sections: [{
          heading: chapter.title,
          body: `This chapter covers ${chapter.title} from Class ${classLevel} ${subject}. The content is being prepared — please try again or check another chapter.`,
          keyPoints: [],
        }],
        summary: '',
      };
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
    // Class 6 and 9: always serve from pre-generated static files — never call the API
    const staticEval = getStaticEvaluation(classLevel, subject, chapterIndex);
    if (staticEval) return staticEval;

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
