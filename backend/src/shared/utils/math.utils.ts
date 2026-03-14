/**
 * Rounds a number to a given number of decimal places.
 */
export function roundToDecimal(n: number, places: number): number {
  const factor = Math.pow(10, places);
  return Math.round(n * factor) / factor;
}

/**
 * Shuffles an array in-place using the Fisher-Yates algorithm and returns it.
 */
export function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i];
    const other = result[j];
    if (temp !== undefined && other !== undefined) {
      result[i] = other;
      result[j] = temp;
    }
  }
  return result;
}

/**
 * Generates plausible wrong answer options for percentage questions.
 * Uses common student mistake patterns to create realistic distractors.
 *
 * @param correct - The correct numeric answer
 * @param count   - How many wrong options to generate
 * @returns Array of `count` unique wrong answer strings (formatted with % if appropriate)
 */
export function generateWrongPercentageOptions(correct: number, count: number): string[] {
  const wrongs = new Set<number>();

  // Common mistake patterns
  const offsets = [
    correct * 0.5,
    correct * 2,
    correct + 10,
    correct - 10,
    correct + 5,
    correct - 5,
    correct * 1.25,
    correct * 0.75,
    roundToDecimal(correct + correct * 0.1, 2),
    roundToDecimal(correct - correct * 0.1, 2),
  ];

  for (const candidate of offsets) {
    const rounded = roundToDecimal(candidate, 2);
    if (rounded !== correct && rounded > 0 && !wrongs.has(rounded)) {
      wrongs.add(rounded);
    }
    if (wrongs.size >= count) break;
  }

  // Fill remaining with sequential neighbours if not enough generated
  let delta = 1;
  while (wrongs.size < count) {
    const candidate = roundToDecimal(correct + delta, 2);
    if (!wrongs.has(candidate) && candidate !== correct && candidate > 0) {
      wrongs.add(candidate);
    }
    const candidate2 = roundToDecimal(correct - delta, 2);
    if (wrongs.size < count && !wrongs.has(candidate2) && candidate2 !== correct && candidate2 > 0) {
      wrongs.add(candidate2);
    }
    delta++;
    if (delta > 1000) break; // safety guard
  }

  return Array.from(wrongs)
    .slice(0, count)
    .map((n) => String(n));
}
