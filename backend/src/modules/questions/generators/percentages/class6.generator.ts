import {
  IQuestionGenerator,
  GeneratedQuestion,
} from '../question-generator.interface';
import { shuffleArray, generateWrongPercentageOptions, roundToDecimal } from '../../../../shared/utils/math.utils';

type QuestionType =
  | 'percentageIncrease'
  | 'percentageDecrease'
  | 'whatPercentOf'
  | 'profitLoss'
  | 'discount'
  | 'wordProblem';

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  const item = arr[Math.floor(Math.random() * arr.length)];
  if (item === undefined) throw new Error('Array is empty');
  return item;
}

export class Class6PercentageGenerator implements IQuestionGenerator {
  readonly mathModule = 'percentages';
  readonly difficultyLevel = 'class6';

  generate(): GeneratedQuestion {
    const types: QuestionType[] = [
      'percentageIncrease',
      'percentageDecrease',
      'whatPercentOf',
      'profitLoss',
      'discount',
      'wordProblem',
    ];
    const type = pickRandom(types);
    switch (type) {
      case 'percentageIncrease':
        return this.generatePercentageIncrease();
      case 'percentageDecrease':
        return this.generatePercentageDecrease();
      case 'whatPercentOf':
        return this.generateWhatPercentOf();
      case 'profitLoss':
        return this.generateProfitLoss();
      case 'discount':
        return this.generateDiscount();
      case 'wordProblem':
        return this.generateWordProblem();
    }
  }

  private generatePercentageIncrease(): GeneratedQuestion {
    const original = randomInt(50, 500);
    const pct = pickRandom([5, 10, 15, 20, 25, 30]);
    const increase = roundToDecimal((pct / 100) * original, 2);
    const newValue = roundToDecimal(original + increase, 2);

    const wrongOptions = generateWrongPercentageOptions(newValue, 3);
    const options = shuffleArray([String(newValue), ...wrongOptions]);

    return {
      questionText: `A price of ₹${original} is increased by ${pct}%. What is the new price?`,
      options,
      correctOption: String(newValue),
      hintText: `Increase = ${pct}% of ₹${original} = ₹${increase}. New price = ₹${original} + ₹${increase}.`,
    };
  }

  private generatePercentageDecrease(): GeneratedQuestion {
    const original = randomInt(100, 1000);
    const pct = pickRandom([5, 10, 15, 20, 25]);
    const decrease = roundToDecimal((pct / 100) * original, 2);
    const newValue = roundToDecimal(original - decrease, 2);

    const wrongOptions = generateWrongPercentageOptions(newValue, 3);
    const options = shuffleArray([String(newValue), ...wrongOptions]);

    return {
      questionText: `A salary of ₹${original} is reduced by ${pct}%. What is the new salary?`,
      options,
      correctOption: String(newValue),
      hintText: `Reduction = ${pct}% of ₹${original} = ₹${decrease}. New salary = ₹${original} − ₹${decrease}.`,
    };
  }

  private generateWhatPercentOf(): GeneratedQuestion {
    const whole = randomInt(20, 200);
    const pct = pickRandom([5, 10, 20, 25, 40, 50, 60, 75, 80]);
    const part = roundToDecimal((pct / 100) * whole, 2);

    const wrongOptions = generateWrongPercentageOptions(pct, 3).map((w) => `${w}%`);
    const options = shuffleArray([`${pct}%`, ...wrongOptions]);

    return {
      questionText: `${part} is what percent of ${whole}?`,
      options,
      correctOption: `${pct}%`,
      hintText: `Percentage = (Part ÷ Whole) × 100 = (${part} ÷ ${whole}) × 100.`,
    };
  }

  private generateProfitLoss(): GeneratedQuestion {
    const costPrice = randomInt(100, 900);
    const pct = pickRandom([5, 10, 12, 15, 20, 25]);
    const isProfitScenario = Math.random() > 0.5;

    if (isProfitScenario) {
      const profit = roundToDecimal((pct / 100) * costPrice, 2);
      const sellingPrice = roundToDecimal(costPrice + profit, 2);

      const wrongOptions = generateWrongPercentageOptions(pct, 3).map((w) => `${w}%`);
      const options = shuffleArray([`${pct}%`, ...wrongOptions]);

      return {
        questionText: `A shopkeeper buys a book for ₹${costPrice} and sells it for ₹${sellingPrice}. What is the profit percentage?`,
        options,
        correctOption: `${pct}%`,
        hintText: `Profit = SP − CP = ₹${sellingPrice} − ₹${costPrice} = ₹${profit}. Profit% = (${profit} ÷ ${costPrice}) × 100.`,
      };
    } else {
      const loss = roundToDecimal((pct / 100) * costPrice, 2);
      const sellingPrice = roundToDecimal(costPrice - loss, 2);

      const wrongOptions = generateWrongPercentageOptions(pct, 3).map((w) => `${w}%`);
      const options = shuffleArray([`${pct}%`, ...wrongOptions]);

      return {
        questionText: `A trader buys goods for ₹${costPrice} and sells them for ₹${sellingPrice}. What is the loss percentage?`,
        options,
        correctOption: `${pct}%`,
        hintText: `Loss = CP − SP = ₹${costPrice} − ₹${sellingPrice} = ₹${loss}. Loss% = (${loss} ÷ ${costPrice}) × 100.`,
      };
    }
  }

  private generateDiscount(): GeneratedQuestion {
    const markedPrice = randomInt(200, 2000);
    const discountPct = pickRandom([5, 10, 15, 20, 25, 30]);
    const discountAmt = roundToDecimal((discountPct / 100) * markedPrice, 2);
    const sellingPrice = roundToDecimal(markedPrice - discountAmt, 2);

    const scenarios = Math.random() > 0.5 ? 'discountAmt' : 'sellingPrice';

    if (scenarios === 'discountAmt') {
      const wrongOptions = generateWrongPercentageOptions(discountAmt, 3);
      const options = shuffleArray([String(discountAmt), ...wrongOptions]);

      return {
        questionText: `A jacket is marked at ₹${markedPrice} and sold at a ${discountPct}% discount. What is the discount amount?`,
        options,
        correctOption: String(discountAmt),
        hintText: `Discount = ${discountPct}% of ₹${markedPrice} = ₹${markedPrice} × ${discountPct} ÷ 100.`,
      };
    } else {
      const wrongOptions = generateWrongPercentageOptions(sellingPrice, 3);
      const options = shuffleArray([String(sellingPrice), ...wrongOptions]);

      return {
        questionText: `A mobile phone is marked at ₹${markedPrice}. A ${discountPct}% discount is offered. What is the selling price?`,
        options,
        correctOption: String(sellingPrice),
        hintText: `Selling Price = Marked Price − Discount = ₹${markedPrice} − ₹${discountAmt}.`,
      };
    }
  }

  private generateWordProblem(): GeneratedQuestion {
    const problems = [
      this.electionWordProblem.bind(this),
      this.populationWordProblem.bind(this),
      this.taxWordProblem.bind(this),
    ];
    return pickRandom(problems)();
  }

  private electionWordProblem(): GeneratedQuestion {
    const totalVotes = randomInt(500, 5000);
    const winnPct = pickRandom([55, 60, 62, 65, 70]);
    const winnerVotes = Math.round((winnPct / 100) * totalVotes);

    const wrongOptions = generateWrongPercentageOptions(winnerVotes, 3);
    const options = shuffleArray([String(winnerVotes), ...wrongOptions]);

    return {
      questionText: `In an election, ${totalVotes} votes were cast. The winner got ${winnPct}% of the votes. How many votes did the winner get?`,
      options,
      correctOption: String(winnerVotes),
      hintText: `Winner's votes = ${winnPct}% of ${totalVotes} = ${totalVotes} × ${winnPct} ÷ 100.`,
    };
  }

  private populationWordProblem(): GeneratedQuestion {
    const population = randomInt(1000, 20000);
    const growthPct = pickRandom([5, 8, 10, 12, 15]);
    const growth = Math.round((growthPct / 100) * population);
    const newPopulation = population + growth;

    const wrongOptions = generateWrongPercentageOptions(newPopulation, 3);
    const options = shuffleArray([String(newPopulation), ...wrongOptions]);

    return {
      questionText: `A town has a population of ${population}. If it grows by ${growthPct}%, what will the new population be?`,
      options,
      correctOption: String(newPopulation),
      hintText: `Growth = ${growthPct}% of ${population} = ${growth}. New population = ${population} + ${growth}.`,
    };
  }

  private taxWordProblem(): GeneratedQuestion {
    const price = randomInt(100, 2000);
    const taxPct = pickRandom([5, 10, 12, 18]);
    const tax = roundToDecimal((taxPct / 100) * price, 2);
    const total = roundToDecimal(price + tax, 2);

    const wrongOptions = generateWrongPercentageOptions(total, 3);
    const options = shuffleArray([String(total), ...wrongOptions]);

    return {
      questionText: `An item costs ₹${price}. A ${taxPct}% GST is applied. What is the total amount to be paid?`,
      options,
      correctOption: String(total),
      hintText: `GST = ${taxPct}% of ₹${price} = ₹${tax}. Total = ₹${price} + ₹${tax}.`,
    };
  }
}
