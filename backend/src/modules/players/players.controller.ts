import { Request, Response } from 'express';
import { z } from 'zod';
import { PlayersService } from './players.service';
import { asyncHandler } from '../../shared/utils/async-handler';
import {
  createApiResponse,
  createPaginatedResponse,
} from '../../shared/types/api-response.types';

const createPlayerSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be at most 50 characters')
    .regex(/^[a-zA-Z0-9_\- ]+$/, 'Display name can only contain letters, numbers, spaces, hyphens, and underscores'),
  avatarCode: z.string().max(20).optional(),
});

export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  createPlayer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const dto = createPlayerSchema.parse(req.body);
    const { player, created } = await this.playersService.createOrGetPlayer(dto);
    const statusCode = created ? 201 : 200;
    res.status(statusCode).json(
      createApiResponse(
        player,
        created ? 'Player created successfully' : 'Player already exists',
      ),
    );
  });

  getPlayer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const player = await this.playersService.getPlayer(id);
    res.json(createApiResponse(player));
  });

  getPlayerStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const stats = await this.playersService.getPlayerStats(id);
    res.json(createApiResponse(stats));
  });

  getPlayerHistory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const page = Math.max(1, parseInt(String(req.query['page'] ?? '1'), 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(String(req.query['pageSize'] ?? '20'), 10)));

    const { entries, total } = await this.playersService.getPlayerHistory(id, page, pageSize);
    res.json(createPaginatedResponse(entries, page, pageSize, total));
  });
}
