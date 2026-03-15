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

    // NCERT PDFs embed the chapter title in every page footer as:
    // "## Chapter N_Title of Chapter.indd   74  13/08/2024   15:33:11"
    // This is the most reliable source of the actual chapter title.
    const inddMatch = content.match(/Chapter\s+\d+[_\s]+(.+?)\.indd/);
    if (inddMatch && inddMatch[1]) {
      return inddMatch[1].trim();
    }

    // Fallback: look for ALL_CAPS lines in first 20 lines (skip line 0 = filename)
    const lines = content.split('\n').slice(1, 20);
    const caps: string[] = [];
    for (const line of lines) {
      const t = line.trim();
      if (!t || /^\d+$/.test(t)) continue;
      if (t === t.toUpperCase() && t.length > 4 && /[A-Z]/.test(t)) {
        caps.push(t);
      } else if (caps.length > 0) break;
    }
    if (caps.length > 0) {
      return caps.join(' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
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
