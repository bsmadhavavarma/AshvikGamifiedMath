/**
 * Pre-generate all teaching + evaluation content for Class 6 and Class 9.
 * Content is saved as static JSON files in backend/data/ and committed to the repo.
 * At runtime, the app loads from these files — ZERO Claude API calls for these classes.
 *
 * Run once during setup: npm run content:preload
 * Then commit the generated files: git add data/ && git commit -m "Add preloaded content"
 * After that, Class 6 and 9 content never calls the Claude API again on any machine.
 */
import fs from 'fs';
import path from 'path';
import { ncertService } from '../modules/ncert/ncert.service';
import { contentService, saveStaticTeaching, saveStaticEvaluation } from '../modules/content/content.service';

const DEFAULT_THEME = 'quest';
const TARGET_CLASSES = [6, 9];
const DATA_DIR = path.join(__dirname, '../../data');

function staticTeachingPath(classLevel: number, subject: string, chapterIndex: number): string {
  return path.join(DATA_DIR, `class${classLevel}`, subject, `ch${chapterIndex}.teaching.json`);
}
function staticEvalPath(classLevel: number, subject: string, chapterIndex: number): string {
  return path.join(DATA_DIR, `class${classLevel}`, subject, `ch${chapterIndex}.evaluation.json`);
}

async function preload(): Promise<void> {
  let generated = 0, skipped = 0, failed = 0;

  for (const classLevel of TARGET_CLASSES) {
    const subjects = ncertService.getSubjectsForLevel(classLevel);
    if (subjects.length === 0) {
      console.warn(`  ⚠  No subjects found for Class ${classLevel}. Check NCERT_BASE_PATH.`);
      continue;
    }

    console.log(`\n━━━━━━ Class ${classLevel} — ${subjects.length} subjects ━━━━━━`);

    for (const subject of subjects) {
      console.log(`\n  📚 ${subject.name} (${subject.chapters.length} chapters)`);

      for (const chapter of subject.chapters) {
        const label = `    Ch${chapter.index + 1} "${chapter.title}"`;

        // Teaching
        const teachingFile = staticTeachingPath(classLevel, subject.name, chapter.index);
        if (fs.existsSync(teachingFile)) {
          console.log(`${label} — teaching ⚡ already exists`);
          skipped++;
        } else {
          try {
            // Temporarily bypass static file check by calling internal API method
            const content = await contentService.getTeachingContent(
              DEFAULT_THEME, classLevel, subject.name, chapter.index
            );
            saveStaticTeaching({ ...content, fromCache: false });
            console.log(`${label} — teaching ✓ saved to ${path.relative(process.cwd(), teachingFile)}`);
            generated++;
          } catch (err) {
            console.error(`${label} — teaching FAILED: ${err}`);
            failed++;
          }
        }

        // Evaluation
        const evalFile = staticEvalPath(classLevel, subject.name, chapter.index);
        if (fs.existsSync(evalFile)) {
          console.log(`${label} — evaluation ⚡ already exists`);
          skipped++;
        } else {
          try {
            const evalSet = await contentService.getEvaluationSet(
              DEFAULT_THEME, classLevel, subject.name, chapter.index
            );
            saveStaticEvaluation({ ...evalSet, fromCache: false });
            console.log(`${label} — evaluation ✓ saved to ${path.relative(process.cwd(), evalFile)}`);
            generated++;
          } catch (err) {
            console.error(`${label} — evaluation FAILED: ${err}`);
            failed++;
          }
        }

        // Pace the API calls
        if (generated > 0 && generated % 2 === 0) {
          await new Promise(r => setTimeout(r, 500));
        }
      }
    }
  }

  console.log(`\n${'━'.repeat(55)}`);
  console.log(`Done: ${generated} generated, ${skipped} already existed, ${failed} failed`);
  if (generated > 0) {
    console.log(`\n📁 Files saved to: ${DATA_DIR}`);
    console.log(`\nNext step — commit these files to the repo:`);
    console.log(`  git add backend/data/`);
    console.log(`  git commit -m "Add preloaded Class 6 and 9 content"`);
    console.log(`\nAfter committing, Class 6 and 9 will NEVER call the Claude API again.`);
  }
  if (failed > 0) {
    console.log('\n⚠  Re-run to retry failed chapters (existing files are skipped).');
    process.exit(1);
  }
  process.exit(0);
}

preload().catch(err => { console.error('Fatal:', err); process.exit(1); });
