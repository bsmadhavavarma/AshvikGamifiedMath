/**
 * Preload teaching + evaluation content for Class 6 and Class 9.
 * Caches all chapters in DB so no Claude API calls are needed at runtime.
 *
 * Usage: npm run content:preload
 */
import { contentService } from '../modules/content/content.service';
import { ncertService } from '../modules/ncert/ncert.service';

const DEFAULT_THEME = 'quest';
const TARGET_CLASSES = [6, 9];

interface PreloadResult {
  classLevel: number;
  subject: string;
  chapterIndex: number;
  chapterTitle: string;
  teaching: 'cached' | 'generated' | 'failed';
  evaluation: 'cached' | 'generated' | 'failed';
}

async function preload(): Promise<void> {
  const results: PreloadResult[] = [];
  let teachingFailed = 0;
  let evalFailed = 0;

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
        const result: PreloadResult = {
          classLevel, subject: subject.name, chapterIndex: chapter.index,
          chapterTitle: chapter.title, teaching: 'failed', evaluation: 'failed',
        };

        // Teaching content
        try {
          const content = await contentService.getTeachingContent(DEFAULT_THEME, classLevel, subject.name, chapter.index);
          result.teaching = content.fromCache ? 'cached' : 'generated';
          console.log(`${label} — teaching ${result.teaching === 'cached' ? '⚡ (from cache)' : '✓ generated'}`);
        } catch (err) {
          result.teaching = 'failed';
          teachingFailed++;
          console.error(`${label} — teaching FAILED: ${err}`);
        }

        // Evaluation content
        try {
          const evalSet = await contentService.getEvaluationSet(DEFAULT_THEME, classLevel, subject.name, chapter.index);
          result.evaluation = evalSet.fromCache ? 'cached' : 'generated';
          console.log(`${label} — evaluation ${result.evaluation === 'cached' ? '⚡ (from cache)' : '✓ generated'}`);
        } catch (err) {
          result.evaluation = 'failed';
          evalFailed++;
          console.error(`${label} — evaluation FAILED: ${err}`);
        }

        results.push(result);

        // Small delay to avoid rate limiting when generating new content
        if (result.teaching === 'generated' || result.evaluation === 'generated') {
          await new Promise(r => setTimeout(r, 500));
        }
      }
    }
  }

  // Summary
  const total = results.length;
  const teachingOk = results.filter(r => r.teaching !== 'failed').length;
  const evalOk = results.filter(r => r.evaluation !== 'failed').length;

  console.log(`\n${'━'.repeat(50)}`);
  console.log(`Preload complete: ${total} chapters processed`);
  console.log(`  Teaching:   ${teachingOk}/${total} ok${teachingFailed > 0 ? ` (${teachingFailed} failed)` : ''}`);
  console.log(`  Evaluation: ${evalOk}/${total} ok${evalFailed > 0 ? ` (${evalFailed} failed)` : ''}`);

  if (teachingFailed > 0 || evalFailed > 0) {
    console.log('\n⚠  Some chapters failed. Re-run to retry failed ones (successes are cached).');
    process.exit(1);
  } else {
    console.log('\n✅ All content preloaded successfully!');
    process.exit(0);
  }
}

preload().catch(err => { console.error('Fatal:', err); process.exit(1); });
