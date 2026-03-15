import path from 'path';
import { ncertService } from '../../src/modules/ncert/ncert.service';

// Use actual NCERT folder for integration-like test (read-only, no API)
describe('ncertService', () => {
  it('returns subjects for Class 5', () => {
    const subjects = ncertService.getSubjectsForLevel(5);
    expect(Array.isArray(subjects)).toBe(true);
    // Should have at least Math, English, Hindi
    expect(subjects.length).toBeGreaterThanOrEqual(3);
  });

  it('excludes folders named "exclude" (case-insensitive)', () => {
    const subjects = ncertService.getSubjectsForLevel(6);
    const hasExclude = subjects.some(s => s.name.toLowerCase() === 'exclude');
    expect(hasExclude).toBe(false);
  });

  it('returns null for unknown subject', () => {
    const result = ncertService.getSubject(5, 'NonExistentSubject12345');
    expect(result).toBeNull();
  });

  it('returns chapters with pdfPath that ends in .pdf', () => {
    const subjects = ncertService.getSubjectsForLevel(6);
    if (subjects.length === 0) return; // skip if NCERT folder not present
    for (const s of subjects) {
      for (const ch of s.chapters) {
        expect(ch.pdfPath).toMatch(/\.pdf$/i);
      }
    }
  });

  it('getSubjectsUpToLevel includes lower classes', () => {
    const map = ncertService.getSubjectsUpToLevel(3);
    const allSubjects = Array.from(map.values()).flat();
    expect(allSubjects.some(s => s.name.includes('Class 1'))).toBe(true);
    expect(allSubjects.some(s => s.name.includes('Class 3'))).toBe(true);
  });
});
