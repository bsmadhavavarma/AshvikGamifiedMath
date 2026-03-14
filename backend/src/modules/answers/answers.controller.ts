import { Request, Response } from 'express';
import { z } from 'zod';
import { AnswersService } from './answers.service';
import { asyncHandler } from '../../shared/utils/async-handler';
import { createApiResponse } from '../../shared/types/api-response.types';

const submitAnswerSchema = z.object({
  chosenOption: z.string().max(50).nullable(),
  timeTakenMs: z
    .number()
    .int('timeTakenMs must be an integer')
    .nonnegative('timeTakenMs must be non-negative'),
});

export class AnswersController {
  constructor(private readonly answersService: AnswersService) {}

  submitAnswer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { sessionId, questionId } = req.params as {
      sessionId: string;
      questionId: string;
    };

    const dto = submitAnswerSchema.parse(req.body);
    const feedback = await this.answersService.submitAnswer(sessionId, questionId, dto);
    res.status(201).json(createApiResponse(feedback, 'Answer submitted'));
  });
}
