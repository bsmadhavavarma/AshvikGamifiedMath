import { PlayersService } from '../../../../src/modules/players/players.service';
import { PlayersRepository } from '../../../../src/modules/players/players.repository';
import { Player, PlayerStats } from '../../../../src/modules/players/players.types';

// ---- Test fixtures -------------------------------------------------------

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'player-uuid-1',
    displayName: 'Ashvik',
    avatarCode: 'hero',
    totalCoins: 100,
    currentStreak: 2,
    longestStreak: 5,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    ...overrides,
  };
}

function makeStats(overrides: Partial<PlayerStats> = {}): PlayerStats {
  return {
    playerId: 'player-uuid-1',
    displayName: 'Ashvik',
    avatarCode: 'hero',
    totalCoins: 100,
    currentStreak: 2,
    longestStreak: 5,
    totalSessions: 10,
    completedSessions: 8,
    totalQuestionsAnswered: 80,
    totalCorrect: 64,
    accuracyPct: 80,
    createdAt: new Date('2024-01-01'),
    ...overrides,
  };
}

// ---- Tests ---------------------------------------------------------------

describe('PlayersService', () => {
  let repo: jest.Mocked<PlayersRepository>;
  let service: PlayersService;

  beforeEach(() => {
    repo = {
      findById: jest.fn(),
      findByName: jest.fn(),
      create: jest.fn(),
      updateCoins: jest.fn(),
      updateStreak: jest.fn(),
      getStats: jest.fn(),
      getHistory: jest.fn(),
    } as unknown as jest.Mocked<PlayersRepository>;

    service = new PlayersService(repo);
  });

  // ---- createOrGetPlayer ------------------------------------------------

  describe('createOrGetPlayer', () => {
    it('returns existing player with created=false when name already exists', async () => {
      const existing = makePlayer();
      repo.findByName.mockResolvedValue(existing);

      const result = await service.createOrGetPlayer({ displayName: 'Ashvik' });

      expect(result.created).toBe(false);
      expect(result.player).toEqual(existing);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('creates a new player with created=true when name does not exist', async () => {
      const newPlayer = makePlayer({ id: 'new-uuid' });
      repo.findByName.mockResolvedValue(null);
      repo.create.mockResolvedValue(newPlayer);

      const result = await service.createOrGetPlayer({ displayName: 'Ashvik' });

      expect(result.created).toBe(true);
      expect(result.player).toEqual(newPlayer);
      expect(repo.create).toHaveBeenCalledWith('Ashvik', 'default');
    });

    it('uses provided avatarCode when creating a new player', async () => {
      const newPlayer = makePlayer({ avatarCode: 'ninja' });
      repo.findByName.mockResolvedValue(null);
      repo.create.mockResolvedValue(newPlayer);

      await service.createOrGetPlayer({ displayName: 'Ashvik', avatarCode: 'ninja' });

      expect(repo.create).toHaveBeenCalledWith('Ashvik', 'ninja');
    });

    it('uses default avatarCode when none is provided', async () => {
      repo.findByName.mockResolvedValue(null);
      repo.create.mockResolvedValue(makePlayer());

      await service.createOrGetPlayer({ displayName: 'Ashvik' });

      expect(repo.create).toHaveBeenCalledWith('Ashvik', 'default');
    });
  });

  // ---- getPlayer --------------------------------------------------------

  describe('getPlayer', () => {
    it('returns the player when found', async () => {
      const player = makePlayer();
      repo.findById.mockResolvedValue(player);

      const result = await service.getPlayer('player-uuid-1');

      expect(result).toEqual(player);
    });

    it('throws NOT_FOUND error when player does not exist', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.getPlayer('missing-id')).rejects.toMatchObject({
        code: 'NOT_FOUND',
        statusCode: 404,
      });
    });
  });

  // ---- getPlayerStats ---------------------------------------------------

  describe('getPlayerStats', () => {
    it('returns player stats when found', async () => {
      const stats = makeStats();
      repo.getStats.mockResolvedValue(stats);

      const result = await service.getPlayerStats('player-uuid-1');

      expect(result).toEqual(stats);
    });

    it('throws NOT_FOUND error when stats are not found', async () => {
      repo.getStats.mockResolvedValue(null);

      await expect(service.getPlayerStats('missing-id')).rejects.toMatchObject({
        code: 'NOT_FOUND',
        statusCode: 404,
      });
    });
  });

  // ---- getPlayerHistory -------------------------------------------------

  describe('getPlayerHistory', () => {
    it('throws NOT_FOUND when player does not exist', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(service.getPlayerHistory('missing-id')).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('returns history entries for an existing player', async () => {
      repo.findById.mockResolvedValue(makePlayer());
      repo.getHistory.mockResolvedValue([
        {
          sessionId: 'sess-1',
          mathModule: 'percentages',
          difficultyLevel: 'class5',
          status: 'completed',
          totalQuestions: 10,
          questionsAnswered: 10,
          correctCount: 8,
          coinsEarned: 80,
          timeTakenSecs: 120,
          startedAt: new Date(),
          completedAt: new Date(),
        },
      ]);

      const { entries } = await service.getPlayerHistory('player-uuid-1');

      expect(entries).toHaveLength(1);
      expect(entries[0]).toHaveProperty('sessionId', 'sess-1');
    });

    it('paginates correctly', async () => {
      repo.findById.mockResolvedValue(makePlayer());
      // Return pageSize+1 items to simulate hasMore
      const historyItems = Array.from({ length: 21 }, (_, i) => ({
        sessionId: `sess-${i}`,
        mathModule: 'percentages',
        difficultyLevel: 'class5',
        status: 'completed',
        totalQuestions: 10,
        questionsAnswered: 10,
        correctCount: 8,
        coinsEarned: 80,
        timeTakenSecs: 120,
        startedAt: new Date(),
        completedAt: new Date(),
      }));
      repo.getHistory.mockResolvedValue(historyItems);

      const { entries } = await service.getPlayerHistory('player-uuid-1', 1, 20);

      // Should slice to 20 items
      expect(entries).toHaveLength(20);
    });
  });
});
