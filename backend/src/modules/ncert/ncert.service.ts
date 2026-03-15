import fs from 'fs';
import path from 'path';
import { env } from '../../config/env';

export interface NcertChapter {
  index: number;
  title: string;
  pdfPath: string;
  markdownPath: string | null;
}

export interface NcertSubject {
  name: string;
  path: string;
  chapters: NcertChapter[];
}

const EXCLUDE_PATTERN = /^exclude$/i;

function isExcluded(name: string): boolean {
  return EXCLUDE_PATTERN.test(name);
}

function getPdfsInFolder(folderPath: string): string[] {
  if (!fs.existsSync(folderPath)) return [];
  return fs.readdirSync(folderPath)
    .filter(f => f.toLowerCase().endsWith('.pdf'))
    .sort()
    .map(f => path.join(folderPath, f));
}

function getMarkdownPath(pdfPath: string): string | null {
  const dir = path.dirname(pdfPath);
  const base = path.basename(pdfPath, '.pdf');
  const mdPath = path.join(dir, 'markdowns', `${base}.md`);
  return fs.existsSync(mdPath) ? mdPath : null;
}

function extractChapterTitle(markdownPath: string, fallback: string): string {
  try {
    const content = fs.readFileSync(markdownPath, 'utf8');
    const lines = content.split('\n');
    const headingParts: string[] = [];

    // Skip line 0 (# filename). Scan lines 1-30 for title text.
    for (let i = 1; i < Math.min(lines.length, 30); i++) {
      const trimmed = lines[i]!.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('## ')) {
        // This is a section heading — grab its text
        headingParts.push(trimmed.replace(/^##\s+/, ''));
        break;
      }

      // ALL_CAPS short line = title fragment (like "PATTERNS IN")
      if (
        trimmed === trimmed.toUpperCase() &&
        trimmed.length > 2 &&
        trimmed.length < 70 &&
        /[A-Z]/.test(trimmed) &&
        !/^\d+$/.test(trimmed)
      ) {
        headingParts.push(trimmed);
      } else if (headingParts.length > 0) {
        // Non-caps line after we've started collecting — stop
        break;
      }
    }

    if (headingParts.length > 0) {
      // Title-case the combined parts
      return headingParts.join(' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    }
  } catch {
    // ignore
  }
  return fallback;
}

export const ncertService = {
  getSubjectsForLevel(classLevel: number): NcertSubject[] {
    const classDir = path.join(env.NCERT_BASE_PATH, `Class${classLevel}`);
    if (!fs.existsSync(classDir)) return [];

    const subjects: NcertSubject[] = [];
    const entries = fs.readdirSync(classDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (isExcluded(entry.name)) continue;

      const subjectPath = path.join(classDir, entry.name);
      const pdfs = getPdfsInFolder(subjectPath);

      const chapters: NcertChapter[] = pdfs.map((pdfPath, i) => {
        const mdPath = getMarkdownPath(pdfPath);
        const fallback = `Chapter ${i + 1}`;
        const title = mdPath ? extractChapterTitle(mdPath, fallback) : fallback;
        return { index: i, title, pdfPath, markdownPath: mdPath };
      });

      subjects.push({ name: entry.name, path: subjectPath, chapters });
    }

    return subjects.sort((a, b) => a.name.localeCompare(b.name));
  },

  getSubject(classLevel: number, subjectName: string): NcertSubject | null {
    const subjects = this.getSubjectsForLevel(classLevel);
    return subjects.find(s => s.name.toLowerCase() === subjectName.toLowerCase()) ?? null;
  },

  getSubjectsUpToLevel(classLevel: number): Map<string, NcertSubject[]> {
    const result = new Map<string, NcertSubject[]>();
    for (let lvl = 1; lvl <= classLevel; lvl++) {
      const subjects = this.getSubjectsForLevel(lvl);
      for (const subject of subjects) {
        const key = subject.name;
        if (!result.has(key)) result.set(key, []);
        result.get(key)!.push({ ...subject, name: `Class ${lvl} - ${subject.name}` });
      }
    }
    return result;
  },
};
