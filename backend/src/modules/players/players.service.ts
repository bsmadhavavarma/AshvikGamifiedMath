import { PlayersRepository } from './players.repository';
import { Player, PlayerStats, PlayerHistoryEntry, CreatePlayerDto } from './players.types';
import { AppError } from '../../shared/types/errors.types';

export class PlayersService {
  constructor(private readonly playersRepo: PlayersRepository) {}

  /**
   * Creates a new player or returns an existing one by display_name (upsert semantics).
   */
  async createOrGetPlayer(dto: CreatePlayerDto): Promise<{ player: Player; created: boolean }> {
    const existing = await this.playersRepo.findByName(dto.displayName);
    if (existing != null) {
      return { player: existing, created: false };
    }
    const player = await this.playersRepo.create(dto.displayName, dto.avatarCode ?? 'default');
    return { player, created: true };
  }

  async getPlayer(id: string): Promise<Player> {
    const player = await this.playersRepo.findById(id);
    if (player == null) {
      throw AppError.notFound('Player', id);
    }
    return player;
  }

  async getPlayerStats(id: string): Promise<PlayerStats> {
    const stats = await this.playersRepo.getStats(id);
    if (stats == null) {
      throw AppError.notFound('Player', id);
    }
    return stats;
  }

  async getPlayerHistory(
    id: string,
    page = 1,
    pageSize = 20,
  ): Promise<{ entries: PlayerHistoryEntry[]; total: number }> {
    // Verify player exists
    const player = await this.playersRepo.findById(id);
    if (player == null) {
      throw AppError.notFound('Player', id);
    }

    const offset = (page - 1) * pageSize;
    const entries = await this.playersRepo.getHistory(id, pageSize + 1, offset);

    const hasMore = entries.length > pageSize;
    const pageEntries = hasMore ? entries.slice(0, pageSize) : entries;

    return { entries: pageEntries, total: offset + entries.length };
  }
}
