import {
  IQuestionGenerator,
  GeneratedQuestion,
} from '../question-generator.interface';
import { shuffleArray, generateWrongPercentageOptions, roundToDecimal } from '../../../../shared/utils/math.utils';

type QuestionType =
  | 'percentOfNumber'
  | 'fractionToPercent'
  | 'percentToFraction'
  | 'wordProblem';

// Helpers
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  const item = arr[Math.floor(Math.random() * arr.length)];
  if (item === undefined) throw new Error('Array is empty');
  return item;
}

// Class 5 friendly percentages (multiples of 5, keeping results whole)
const CLASS5_PERCENTAGES = [10, 20, 25, 50, 75, 100];

// Fractions whose percentage conversion is whole
const SIMPLE_FRACTIONS: Array<{ num: number; den: number; pct: number }> = [
  { num: 1, den: 2, pct: 50 },
  { num: 1, den: 4, pct: 25 },
  { num: 3, den: 4, pct: 75 },
  { num: 1, den: 5, pct: 20 },
  { num: 2, den: 5, pct: 40 },
  { num: 3, den: 5, pct: 60 },
  { num: 4, den: 5, pct: 80 },
  { num: 1, den: 10, pct: 10 },
  { num: 3, den: 10, pct: 30 },
  { num: 7, den: 10, pct: 70 },
];

export class Class5PercentageGenerator implements IQuestionGenerator {
  readonly mathModule = 'percentages';
  readonly difficultyLevel = 'class5';

  generate(): GeneratedQuestion {
    const types: QuestionType[] = [
      'percentOfNumber',
      'fractionToPercent',
      'percentToFraction',
      'wordProblem',
    ];
    const type = pickRandom(types);
    switch (type) {
      case 'percentOfNumber':
        return this.generatePercentOfNumber();
      case 'fractionToPercent':
        return this.generateFractionToPercent();
      case 'percentToFraction':
        return this.generatePercentToFraction();
      case 'wordProblem':
        return this.generateWordProblem();
    }
  }

  private generatePercentOfNumber(): GeneratedQuestion {
    const pct = pickRandom(CLASS5_PERCENTAGES);
    // Ensure whole number result: pick a multiple of (100/pct)
    const multiplier = 100 / pct;
    const base = randomInt(1, 20) * multiplier;
    const correct = roundToDecimal((pct / 100) * base, 2);

    const wrongOptions = generateWrongPercentageOptions(correct, 3);
    const options = shuffleArray([String(correct), ...wrongOptions]);

    return {
      questionText: `What is ${pct}% of ${base}?`,
      options,
      correctOption: String(correct),
      hintText: `To find ${pct}% of ${base}, multiply ${base} × ${pct} ÷ 100.`,
    };
  }

  private generateFractionToPercent(): GeneratedQuestion {
    const fraction = pickRandom(SIMPLE_FRACTIONS);
    const correct = fraction.pct;
    const wrongOptions = generateWrongPercentageOptions(correct, 3).map(
      (w) => `${w}%`,
    );
    const options = shuffleArray([`${correct}%`, ...wrongOptions]);

    return {
      questionText: `Convert ${fraction.num}/${fraction.den} to a percentage.`,
      options,
      correctOption: `${correct}%`,
      hintText: `Divide ${fraction.num} by ${fraction.den} and multiply by 100.`,
    };
  }

  private generatePercentToFraction(): GeneratedQuestion {
    const fraction = pickRandom(SIMPLE_FRACTIONS);
    const pct = fraction.pct;
    const correctFrac = `${fraction.num}/${fraction.den}`;

    // Generate wrong fractions
    const wrongFracs = SIMPLE_FRACTIONS.filter((f) => f.pct !== pct)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((f) => `${f.num}/${f.den}`);

    const options = shuffleArray([correctFrac, ...wrongFracs]);

    return {
      questionText: `Convert ${pct}% to a fraction in its simplest form.`,
      options,
      correctOption: correctFrac,
      hintText: `Write ${pct}% as ${pct}/100, then simplify by dividing both by the HCF.`,
    };
  }

  private generateWordProblem(): GeneratedQuestion {
    const scenarios = [
      this.classroomAbsence.bind(this),
      this.fruitsInBasket.bind(this),
      this.savingsWordProblem.bind(this),
      this.marksWordProblem.bind(this),
    ];
    return pickRandom(scenarios)();
  }

  private classroomAbsence(): GeneratedQuestion {
    const pct = pickRandom([10, 20, 25, 50]);
    const multiplier = 100 / pct;
    const totalStudents = randomInt(2, 10) * multiplier;
    const absent = roundToDecimal((pct / 100) * totalStudents, 0);

    const wrongOptions = generateWrongPercentageOptions(absent, 3);
    const options = shuffleArray([String(absent), ...wrongOptions]);

    return {
      questionText: `In a class of ${totalStudents} students, ${pct}% are absent. How many students are absent?`,
      options,
      correctOption: String(absent),
      hintText: `Find ${pct}% of ${totalStudents}: multiply ${totalStudents} by ${pct} and divide by 100.`,
    };
  }

  private fruitsInBasket(): GeneratedQuestion {
    const pct = pickRandom([25, 50, 75]);
    const multiplier = 100 / pct;
    const total = randomInt(2, 8) * multiplier;
    const apples = roundToDecimal((pct / 100) * total, 0);

    const wrongOptions = generateWrongPercentageOptions(apples, 3);
    const options = shuffleArray([String(apples), ...wrongOptions]);

    return {
      questionText: `A basket has ${total} fruits. If ${pct}% are apples, how many apples are there?`,
      options,
      correctOption: String(apples),
      hintText: `${pct}% of ${total} = ${total} × ${pct} ÷ 100.`,
    };
  }

  private savingsWordProblem(): GeneratedQuestion {
    const pct = pickRandom([10, 20, 25]);
    const multiplier = 100 / pct;
    const pocket = randomInt(2, 10) * multiplier;
    const saved = roundToDecimal((pct / 100) * pocket, 0);

    const wrongOptions = generateWrongPercentageOptions(saved, 3);
    const options = shuffleArray([String(saved), ...wrongOptions]);

    return {
      questionText: `Ravi gets ₹${pocket} as pocket money. He saves ${pct}% of it. How much does he save?`,
      options,
      correctOption: String(saved),
      hintText: `Saved amount = ${pct}% of ₹${pocket} = ₹${pocket} × ${pct} ÷ 100.`,
    };
  }

  private marksWordProblem(): GeneratedQuestion {
    const pct = pickRandom([50, 75, 100]);
    const multiplier = 100 / pct;
    const total = randomInt(2, 6) * multiplier;
    const scored = roundToDecimal((pct / 100) * total, 0);

    const wrongOptions = generateWrongPercentageOptions(scored, 3);
    const options = shuffleArray([String(scored), ...wrongOptions]);

    return {
      questionText: `The total marks in a test are ${total}. Priya scored ${pct}%. How many marks did she get?`,
      options,
      correctOption: String(scored),
      hintText: `Marks scored = ${pct}% of ${total} = ${total} × ${pct} ÷ 100.`,
    };
  }
}
