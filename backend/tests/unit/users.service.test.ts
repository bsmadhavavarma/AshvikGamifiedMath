import { usersService } from '../../src/modules/users/users.service';
import { usersRepository } from '../../src/modules/users/users.repository';
import { AppError } from '../../src/shared/types/errors';

jest.mock('../../src/modules/users/users.repository');
jest.mock('../../src/db/client');

const mockRepo = usersRepository as jest.Mocked<typeof usersRepository>;

const fakeRow = {
  id: 'user-1', full_name: 'Test User', display_name: 'tester',
  level: 5, pin_hash: '$2b$10$abc123', created_at: new Date(), updated_at: new Date(),
};

beforeEach(() => jest.clearAllMocks());

describe('usersService.create', () => {
  it('generates a 6-digit PIN when not provided', async () => {
    mockRepo.findByDisplayName.mockResolvedValue(null);
    mockRepo.create.mockResolvedValue(fakeRow);
    const { pin } = await usersService.create({ fullName: 'Test', displayName: 'tester', level: 5 });
    expect(pin).toMatch(/^\d{6}$/);
  });

  it('uses provided PIN', async () => {
    mockRepo.findByDisplayName.mockResolvedValue(null);
    mockRepo.create.mockResolvedValue(fakeRow);
    const { pin } = await usersService.create({ fullName: 'Test', displayName: 'tester', level: 5, pin: '123456' });
    expect(pin).toBe('123456');
  });

  it('throws conflict if display name taken', async () => {
    mockRepo.findByDisplayName.mockResolvedValue(fakeRow);
    await expect(usersService.create({ fullName: 'Test', displayName: 'tester', level: 5 }))
      .rejects.toBeInstanceOf(AppError);
  });

  it('throws bad request for invalid PIN format', async () => {
    mockRepo.findByDisplayName.mockResolvedValue(null);
    await expect(usersService.create({ fullName: 'Test', displayName: 'tester', level: 5, pin: '12345' }))
      .rejects.toBeInstanceOf(AppError);
  });
});

describe('usersService.updateLevel', () => {
  it('throws for out-of-range level', async () => {
    await expect(usersService.updateLevel('user-1', 0)).rejects.toBeInstanceOf(AppError);
    await expect(usersService.updateLevel('user-1', 13)).rejects.toBeInstanceOf(AppError);
  });

  it('returns updated user on success', async () => {
    mockRepo.updateLevel.mockResolvedValue({ ...fakeRow, level: 6 });
    const user = await usersService.updateLevel('user-1', 6);
    expect(user.level).toBe(6);
  });
});
