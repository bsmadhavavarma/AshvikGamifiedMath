import {
  roundToDecimal,
  shuffleArray,
  generateWrongPercentageOptions,
} from '../../../src/shared/utils/math.utils';

describe('roundToDecimal', () => {
  it('rounds to the given number of decimal places', () => {
    expect(roundToDecimal(3.14159, 2)).toBe(3.14);
    expect(roundToDecimal(3.14159, 3)).toBe(3.142);
    expect(roundToDecimal(3.14159, 0)).toBe(3);
  });

  it('handles whole numbers correctly', () => {
    expect(roundToDecimal(5, 2)).toBe(5);
    expect(roundToDecimal(100, 0)).toBe(100);
  });

  it('rounds 0.5 up', () => {
    expect(roundToDecimal(2.5, 0)).toBe(3);
    expect(roundToDecimal(1.005, 2)).toBe(1.01);
  });

  it('handles negative numbers', () => {
    expect(roundToDecimal(-3.456, 2)).toBe(-3.46);
  });

  it('rounds to zero decimal places correctly', () => {
    expect(roundToDecimal(7.9, 0)).toBe(8);
    expect(roundToDecimal(7.1, 0)).toBe(7);
  });

  it('returns 0 rounded correctly', () => {
    expect(roundToDecimal(0, 2)).toBe(0);
  });
});

describe('shuffleArray', () => {
  it('returns an array of the same length', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(shuffleArray(arr)).toHaveLength(5);
  });

  it('contains all the same elements', () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffleArray(arr);
    expect(shuffled.sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('does not mutate the original array', () => {
    const arr = [1, 2, 3, 4, 5];
    const original = [...arr];
    shuffleArray(arr);
    expect(arr).toEqual(original);
  });

  it('works with an empty array', () => {
    expect(shuffleArray([])).toEqual([]);
  });

  it('works with a single element', () => {
    expect(shuffleArray([42])).toEqual([42]);
  });

  it('works with string arrays', () => {
    const arr = ['a', 'b', 'c'];
    const shuffled = shuffleArray(arr);
    expect(shuffled.sort()).toEqual(['a', 'b', 'c']);
  });

  it('returns a new array reference', () => {
    const arr = [1, 2, 3];
    const result = shuffleArray(arr);
    expect(result).not.toBe(arr);
  });

  it('handles arrays with duplicate values', () => {
    const arr = [1, 1, 2, 2];
    const shuffled = shuffleArray(arr);
    expect(shuffled).toHaveLength(4);
    expect(shuffled.filter((x) => x === 1)).toHaveLength(2);
    expect(shuffled.filter((x) => x === 2)).toHaveLength(2);
  });
});

describe('generateWrongPercentageOptions', () => {
  it('returns exactly count wrong options', () => {
    const wrongs = generateWrongPercentageOptions(50, 3);
    expect(wrongs).toHaveLength(3);
  });

  it('none of the wrong options equal the correct answer', () => {
    const correct = 25;
    const wrongs = generateWrongPercentageOptions(correct, 3);
    for (const w of wrongs) {
      expect(parseFloat(w)).not.toBe(correct);
    }
  });

  it('all wrong options are positive numbers', () => {
    const wrongs = generateWrongPercentageOptions(10, 3);
    for (const w of wrongs) {
      expect(parseFloat(w)).toBeGreaterThan(0);
    }
  });

  it('all options are unique', () => {
    const wrongs = generateWrongPercentageOptions(40, 3);
    const unique = new Set(wrongs);
    expect(unique.size).toBe(3);
  });

  it('generates options for small numbers', () => {
    const wrongs = generateWrongPercentageOptions(5, 3);
    expect(wrongs).toHaveLength(3);
    for (const w of wrongs) {
      expect(parseFloat(w)).toBeGreaterThan(0);
    }
  });

  it('generates options for large numbers', () => {
    const wrongs = generateWrongPercentageOptions(1000, 3);
    expect(wrongs).toHaveLength(3);
    for (const w of wrongs) {
      expect(parseFloat(w)).not.toBe(1000);
    }
  });

  it('returns string values', () => {
    const wrongs = generateWrongPercentageOptions(20, 3);
    for (const w of wrongs) {
      expect(typeof w).toBe('string');
    }
  });

  it('handles count = 1', () => {
    const wrongs = generateWrongPercentageOptions(50, 1);
    expect(wrongs).toHaveLength(1);
  });
});
