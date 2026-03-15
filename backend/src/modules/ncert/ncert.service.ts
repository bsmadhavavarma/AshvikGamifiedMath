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

      const chapters: NcertChapter[] = pdfs.map((pdfPath, i) => ({
        index: i,
        title: path.basename(pdfPath, '.pdf').replace(/^[a-z]+\d+/i, `Chapter ${i + 1}`),
        pdfPath,
        markdownPath: getMarkdownPath(pdfPath),
      }));

      subjects.push({ name: entry.name, path: subjectPath, chapters });
    }

    return subjects.sort((a, b) => a.name.localeCompare(b.name));
  },

  getSubject(classLevel: number, subjectName: string): NcertSubject | null {
    const subjects = this.getSubjectsForLevel(classLevel);
    return subjects.find(s => s.name.toLowerCase() === subjectName.toLowerCase()) ?? null;
  },

  // For a given user level, aggregate subjects from class 1 up to that level
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
