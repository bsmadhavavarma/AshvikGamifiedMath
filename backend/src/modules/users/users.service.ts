import bcrypt from 'bcrypt';
import { usersRepository } from './users.repository';
import { User, CreateUserDto, UpdateUserDto, rowToUser } from './users.types';
import { AppError } from '../../shared/types/errors';

const BCRYPT_ROUNDS = 10;

function generatePin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export const usersService = {
  async create(dto: CreateUserDto): Promise<{ user: User; pin: string }> {
    const existing = await usersRepository.findByDisplayName(dto.displayName);
    if (existing) throw AppError.conflict(`Display name "${dto.displayName}" is already taken`);

    const pin = dto.pin ?? generatePin();
    if (!/^\d{6}$/.test(pin)) throw AppError.badRequest('PIN must be exactly 6 digits');

    const pinHash = await bcrypt.hash(pin, BCRYPT_ROUNDS);
    const row = await usersRepository.create(dto.fullName, dto.displayName, dto.level, pinHash, pin);
    return { user: rowToUser(row), pin };
  },

  async login(displayName: string, pin: string): Promise<User> {
    const row = await usersRepository.findByDisplayName(displayName);
    if (!row) throw AppError.invalidPin('Invalid name or PIN');

    const match = await bcrypt.compare(pin, row.pin_hash);
    if (!match) throw AppError.invalidPin('Invalid name or PIN');

    return rowToUser(row);
  },

  async updateLevel(userId: string, level: number): Promise<User> {
    if (level < 1 || level > 12) throw AppError.badRequest('Level must be between 1 and 12');
    const row = await usersRepository.updateLevel(userId, level);
    if (!row) throw AppError.notFound('User not found');
    return rowToUser(row);
  },

  async updatePin(userId: string, currentPin: string, newPin: string): Promise<void> {
    const row = await usersRepository.findById(userId);
    if (!row) throw AppError.notFound('User not found');

    const match = await bcrypt.compare(currentPin, row.pin_hash);
    if (!match) throw AppError.invalidPin('Current PIN is incorrect');

    if (!/^\d{6}$/.test(newPin)) throw AppError.badRequest('New PIN must be exactly 6 digits');
    const pinHash = await bcrypt.hash(newPin, BCRYPT_ROUNDS);
    await usersRepository.updatePin(userId, pinHash);
  },

  async adminUpdate(userId: string, dto: { fullName?: string; displayName?: string; level?: number; pin?: string }): Promise<{ user: User; pin?: string }> {
    const existing = await usersRepository.findById(userId);
    if (!existing) throw AppError.notFound('User not found');

    if (dto.displayName && dto.displayName !== existing.display_name) {
      const taken = await usersRepository.findByDisplayName(dto.displayName);
      if (taken) throw AppError.conflict(`Display name "${dto.displayName}" is already taken`);
    }

    let pinHash: string | undefined;
    let plainPin: string | undefined;
    if (dto.pin !== undefined) {
      plainPin = dto.pin || generatePin();
      if (!/^\d{6}$/.test(plainPin)) throw AppError.badRequest('PIN must be exactly 6 digits');
      pinHash = await bcrypt.hash(plainPin, BCRYPT_ROUNDS);
    }

    const row = await usersRepository.adminUpdate(userId, {
      fullName: dto.fullName,
      displayName: dto.displayName,
      level: dto.level,
      pinHash,
      pin: plainPin,
    });
    return { user: rowToUser(row!), pin: plainPin };
  },

  async findAll(): Promise<User[]> {
    const rows = await usersRepository.findAll();
    return rows.map(rowToUser);
  },

  async findById(id: string): Promise<User> {
    const row = await usersRepository.findById(id);
    if (!row) throw AppError.notFound('User not found');
    return rowToUser(row);
  },

  async delete(id: string, dto: UpdateUserDto): Promise<void> {
    void dto;
    await usersRepository.delete(id);
  },

  async clearUserData(userId: string, classLevel?: number, subject?: string): Promise<void> {
    const row = await usersRepository.findById(userId);
    if (!row) throw AppError.notFound('User not found');
    await usersRepository.clearUserData(userId, classLevel, subject);
  },
};
