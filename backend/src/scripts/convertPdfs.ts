/**
 * Converts all NCERT PDFs to markdown files.
 * Run once: npm run pdf:convert
 * Saves .md files alongside PDFs in a /markdowns subfolder.
 * Subsequent runs skip already-converted files.
 */
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import { env } from '../config/env';

const EXCLUDE_PATTERN = /^exclude$/i;

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (EXCLUDE_PATTERN.test(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.pdf')) {
      files.push(fullPath);
    }
  }
  return files;
}

function pdfToMarkdown(text: string, title: string): string {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const sections: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    // Heuristic: short lines in ALL CAPS or numbered are likely headings
    const isHeading = (line.length < 80 && line === line.toUpperCase() && line.length > 3)
      || /^(chapter|unit|section|\d+\.)\s+/i.test(line);
    if (isHeading && current.length > 0) {
      sections.push(current.join('\n'));
      current = [`## ${line}`];
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) sections.push(current.join('\n'));

  return `# ${title}\n\n${sections.join('\n\n')}`;
}

async function main() {
  const pdfs = walk(env.NCERT_BASE_PATH);
  console.log(`Found ${pdfs.length} PDFs to process`);

  let converted = 0;
  let skipped = 0;
  let failed = 0;

  for (const pdfPath of pdfs) {
    const dir = path.dirname(pdfPath);
    const base = path.basename(pdfPath, '.pdf');
    const mdDir = path.join(dir, 'markdowns');
    const mdPath = path.join(mdDir, `${base}.md`);

    if (fs.existsSync(mdPath)) {
      skipped++;
      continue;
    }

    try {
      const buffer = fs.readFileSync(pdfPath);
      const data = await pdfParse(buffer);
      const markdown = pdfToMarkdown(data.text, base);

      fs.mkdirSync(mdDir, { recursive: true });
      fs.writeFileSync(mdPath, markdown, 'utf8');

      console.log(`  ✓ ${path.relative(env.NCERT_BASE_PATH, pdfPath)}`);
      converted++;
    } catch (err) {
      console.warn(`  ✗ Failed: ${path.relative(env.NCERT_BASE_PATH, pdfPath)} — ${(err as Error).message}`);
      failed++;
    }
  }

  console.log(`\nDone: ${converted} converted, ${skipped} skipped, ${failed} failed`);
}

main().catch(err => { console.error(err); process.exit(1); });
