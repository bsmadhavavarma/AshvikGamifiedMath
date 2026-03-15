/**
 * Content structure validation tests.
 * These tests verify that preloaded content for Class 6 and Class 9 meets
 * quality criteria — without making any Claude API calls.
 *
 * These are unit-style tests that run against the DB cache via contentCache.
 * They pass when content is preloaded; they skip gracefully if cache is empty.
 */
import { contentCache } from '../../src/modules/content/content.cache';

const DEFAULT_THEME = 'quest';

// Spot-check chapters: Class 6 Math Ch0 and Ch1, Class 9 Math Ch0
const SPOT_CHECKS = [
  { classLevel: 6, subject: 'Mathematics', chapterIndex: 0 },
  { classLevel: 6, subject: 'Science', chapterIndex: 0 },
  { classLevel: 9, subject: 'Mathematics', chapterIndex: 0 },
];

describe('Teaching content structure', () => {
  for (const { classLevel, subject, chapterIndex } of SPOT_CHECKS) {
    const label = `Class ${classLevel} ${subject} Ch${chapterIndex + 1}`;

    it(`${label} — teaching has 3-5 sections with heading, body, and keyPoints`, async () => {
      const content = await contentCache.getTeaching(DEFAULT_THEME, classLevel, subject, chapterIndex);
      if (!content) {
        console.warn(`    ⚠  ${label} not in cache — run "npm run content:preload" first`);
        return; // skip without failing when not preloaded yet
      }

      expect(Array.isArray(content.sections)).toBe(true);
      expect(content.sections.length).toBeGreaterThanOrEqual(3);
      expect(content.sections.length).toBeLessThanOrEqual(5);

      for (const section of content.sections) {
        expect(typeof section.heading).toBe('string');
        expect(section.heading.length).toBeGreaterThan(0);

        expect(typeof section.body).toBe('string');
        expect(section.body.length).toBeGreaterThan(30);

        expect(Array.isArray(section.keyPoints)).toBe(true);
        expect(section.keyPoints.length).toBeGreaterThanOrEqual(1);
      }
    });

    it(`${label} — teaching has non-empty summary and topics`, async () => {
      const content = await contentCache.getTeaching(DEFAULT_THEME, classLevel, subject, chapterIndex);
      if (!content) return;

      expect(typeof content.summary).toBe('string');
      expect(content.summary.length).toBeGreaterThan(20);

      expect(Array.isArray(content.topics)).toBe(true);
      expect(content.topics.length).toBeGreaterThan(0);
    });

    it(`${label} — section bodies do not look like raw markdown copy`, async () => {
      const content = await contentCache.getTeaching(DEFAULT_THEME, classLevel, subject, chapterIndex);
      if (!content) return;

      for (const section of content.sections) {
        // Body should not be raw markdown headers
        expect(section.body).not.toMatch(/^#{1,4}\s/);
        // Body should not be just a list of items (bullet points only)
        const lines = section.body.split('\n').filter(l => l.trim());
        const allBullets = lines.every(l => l.trim().startsWith('-') || l.trim().startsWith('*'));
        expect(allBullets).toBe(false);
      }
    });
  }
});

describe('Evaluation content structure', () => {
  for (const { classLevel, subject, chapterIndex } of SPOT_CHECKS) {
    const label = `Class ${classLevel} ${subject} Ch${chapterIndex + 1}`;

    it(`${label} — evaluation has exactly 6 questions (3 MCQ, 2 short_answer, 1 long_answer)`, async () => {
      const evalSet = await contentCache.getEvaluation(DEFAULT_THEME, classLevel, subject, chapterIndex);
      if (!evalSet) {
        console.warn(`    ⚠  ${label} evaluation not in cache — run "npm run content:preload" first`);
        return;
      }

      expect(Array.isArray(evalSet.questions)).toBe(true);
      expect(evalSet.questions.length).toBe(6);

      const mcq = evalSet.questions.filter(q => q.type === 'mcq');
      const short = evalSet.questions.filter(q => q.type === 'short_answer');
      const long = evalSet.questions.filter(q => q.type === 'long_answer');

      expect(mcq.length).toBe(3);
      expect(short.length).toBe(2);
      expect(long.length).toBe(1);
    });

    it(`${label} — MCQ questions have 4 options and a valid correctOption`, async () => {
      const evalSet = await contentCache.getEvaluation(DEFAULT_THEME, classLevel, subject, chapterIndex);
      if (!evalSet) return;

      const mcqs = evalSet.questions.filter(q => q.type === 'mcq');
      for (const q of mcqs) {
        expect(typeof q.question).toBe('string');
        expect(q.question.length).toBeGreaterThan(5);
        expect(Array.isArray(q.options)).toBe(true);
        expect(q.options!.length).toBe(4);
        expect(typeof q.correctOption).toBe('number');
        expect(q.correctOption).toBeGreaterThanOrEqual(0);
        expect(q.correctOption).toBeLessThanOrEqual(3);
      }
    });

    it(`${label} — short and long answer questions have a sampleAnswer`, async () => {
      const evalSet = await contentCache.getEvaluation(DEFAULT_THEME, classLevel, subject, chapterIndex);
      if (!evalSet) return;

      const openEnded = evalSet.questions.filter(q => q.type === 'short_answer' || q.type === 'long_answer');
      for (const q of openEnded) {
        expect(typeof q.sampleAnswer).toBe('string');
        expect(q.sampleAnswer!.length).toBeGreaterThan(5);
      }
    });
  }
});
