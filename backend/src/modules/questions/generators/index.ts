import { IQuestionGenerator } from './question-generator.interface';
import { Class5PercentageGenerator } from './percentages/class5.generator';
import { Class6PercentageGenerator } from './percentages/class6.generator';

export type GeneratorKey = 'percentages-class5' | 'percentages-class6';

const generatorRegistry: Record<GeneratorKey, IQuestionGenerator> = {
  'percentages-class5': new Class5PercentageGenerator(),
  'percentages-class6': new Class6PercentageGenerator(),
};

export function getGenerator(key: GeneratorKey): IQuestionGenerator {
  return generatorRegistry[key];
}

export function buildGeneratorKey(
  mathModule: string,
  difficultyLevel: string,
): GeneratorKey | null {
  const key = `${mathModule}-${difficultyLevel}`;
  if (key in generatorRegistry) {
    return key as GeneratorKey;
  }
  return null;
}

export { generatorRegistry };
