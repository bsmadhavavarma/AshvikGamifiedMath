import { Class5PercentageGenerator } from '../../../../../src/modules/questions/generators/percentages/class5.generator';
import { GeneratedQuestion } from '../../../../../src/modules/questions/generators/question-generator.interface';

describe('Class5PercentageGenerator', () => {
  let generator: Class5PercentageGenerator;

  beforeEach(() => {
    generator = new Class5PercentageGenerator();
  });

  it('has correct mathModule', () => {
    expect(generator.mathModule).toBe('percentages');
  });

  it('has correct difficultyLevel', () => {
    expect(generator.difficultyLevel).toBe('class5');
  });

  it('generate() returns a GeneratedQuestion shape', () => {
    const question = generator.generate();
    expect(question).toMatchObject<Partial<GeneratedQuestion>>({
      questionText: expect.any(String) as string,
      options: expect.any(Array) as string[],
      correctOption: expect.any(String) as string,
    });
  });

  it('always produces exactly 4 options', () => {
    for (let i = 0; i < 20; i++) {
      const q = generator.generate();
      expect(q.options).toHaveLength(4);
    }
  });

  it('correctOption is always one of the options', () => {
    for (let i = 0; i < 20; i++) {
      const q = generator.generate();
      expect(q.options).toContain(q.correctOption);
    }
  });

  it('questionText is a non-empty string', () => {
    const q = generator.generate();
    expect(q.questionText.length).toBeGreaterThan(10);
  });

  it('hintText is provided and non-empty', () => {
    for (let i = 0; i < 10; i++) {
      const q = generator.generate();
      expect(q.hintText).toBeDefined();
      expect((q.hintText ?? '').length).toBeGreaterThan(0);
    }
  });

  it('options are all unique', () => {
    for (let i = 0; i < 20; i++) {
      const q = generator.generate();
      const unique = new Set(q.options);
      expect(unique.size).toBe(4);
    }
  });

  it('generates questions across multiple calls (randomised)', () => {
    const questions = new Set<string>();
    for (let i = 0; i < 50; i++) {
      questions.add(generator.generate().questionText);
    }
    // With randomisation we expect more than 1 unique question in 50 calls
    expect(questions.size).toBeGreaterThan(1);
  });

  it('fractionToPercent questions contain % in the correct option', () => {
    // Run many times and check that fraction-related questions have % in correct answer
    let foundFractionQ = false;
    for (let i = 0; i < 100; i++) {
      const q = generator.generate();
      if (q.questionText.includes('Convert') && q.questionText.includes('/') && q.questionText.includes('percentage')) {
        expect(q.correctOption).toMatch(/%$/);
        foundFractionQ = true;
        break;
      }
    }
    // We should have seen at least one fraction-to-percent question in 100 calls
    expect(foundFractionQ).toBe(true);
  });

  it('percentOfNumber questions produce whole-number correct answers for class5 friendly percentages', () => {
    // Run multiple times and check "What is X% of Y?" style questions produce whole numbers
    for (let i = 0; i < 50; i++) {
      const q = generator.generate();
      if (q.questionText.startsWith('What is') && q.questionText.includes('%')) {
        const val = parseFloat(q.correctOption);
        expect(val).toBe(Math.round(val));
      }
    }
  });
});
