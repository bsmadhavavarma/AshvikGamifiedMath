import { Class6PercentageGenerator } from '../../../../../src/modules/questions/generators/percentages/class6.generator';
import { GeneratedQuestion } from '../../../../../src/modules/questions/generators/question-generator.interface';

describe('Class6PercentageGenerator', () => {
  let generator: Class6PercentageGenerator;

  beforeEach(() => {
    generator = new Class6PercentageGenerator();
  });

  it('has correct mathModule', () => {
    expect(generator.mathModule).toBe('percentages');
  });

  it('has correct difficultyLevel', () => {
    expect(generator.difficultyLevel).toBe('class6');
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
    for (let i = 0; i < 30; i++) {
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

  it('generates diverse questions (randomised)', () => {
    const questions = new Set<string>();
    for (let i = 0; i < 60; i++) {
      questions.add(generator.generate().questionText);
    }
    expect(questions.size).toBeGreaterThan(5);
  });

  it('profit/loss questions produce % in correct option', () => {
    let found = false;
    for (let i = 0; i < 150; i++) {
      const q = generator.generate();
      if (
        (q.questionText.includes('profit') || q.questionText.includes('loss')) &&
        q.questionText.includes('percentage')
      ) {
        expect(q.correctOption).toMatch(/%$/);
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  it('"what percent" questions have % in correct option', () => {
    let found = false;
    for (let i = 0; i < 150; i++) {
      const q = generator.generate();
      if (q.questionText.includes('what percent') || q.questionText.includes('What percent')) {
        expect(q.correctOption).toMatch(/%$/);
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  it('discount questions appear and have numeric correct answers', () => {
    let found = false;
    for (let i = 0; i < 150; i++) {
      const q = generator.generate();
      if (q.questionText.toLowerCase().includes('discount')) {
        const val = parseFloat(q.correctOption);
        expect(isNaN(val)).toBe(false);
        expect(val).toBeGreaterThan(0);
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });
});
