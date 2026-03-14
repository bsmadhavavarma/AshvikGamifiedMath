import { Request, Response } from 'express';
import { z } from 'zod';
import { SessionsService } from './sessions.service';
import { asyncHandler } from '../../shared/utils/async-handler';
import { createApiResponse } from '../../shared/types/api-response.types';

const createSessionSchema = z.object({
  playerId: z.string().uuid('playerId must be a valid UUID'),
  mathModule: z.enum(['percentages']),
  difficultyLevel: z.enum(['class5', 'class6']),
});

export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  createSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const dto = createSessionSchema.parse(req.body);
    const session = await this.sessionsService.createSession(dto);
    res.status(201).json(createApiResponse(session, 'Session created successfully'));
  });

  getSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const session = await this.sessionsService.getSession(id);
    res.json(createApiResponse(session));
  });

  abandonSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const session = await this.sessionsService.abandonSession(id);
    res.json(createApiResponse(session, 'Session abandoned'));
  });
}
