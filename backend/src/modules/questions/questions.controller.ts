import { Request, Response } from 'express';
import { QuestionsService } from './questions.service';
import { asyncHandler } from '../../shared/utils/async-handler';
import { createApiResponse } from '../../shared/types/api-response.types';
import { AppError } from '../../shared/types/errors.types';
import { Question } from './questions.types';

interface QuestionPublic extends Omit<Question, 'correctOption'> {
  correctOption?: never;
}

export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  getQuestion = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { sessionId, sequenceNumber: seqStr } = req.params as {
      sessionId: string;
      sequenceNumber: string;
    };

    const sequenceNumber = parseInt(seqStr, 10);
    if (isNaN(sequenceNumber) || sequenceNumber < 1) {
      throw AppError.badRequest('sequenceNumber must be a positive integer');
    }

    const question = await this.questionsService.getQuestion(sessionId, sequenceNumber);

    // Remove correct answer from public response
    const { correctOption: _correctOption, ...publicQuestion } = question;
    void _correctOption;

    res.json(createApiResponse(publicQuestion as QuestionPublic));
  });
}
