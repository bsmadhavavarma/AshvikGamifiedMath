export interface User {
  id: string;
  fullName: string;
  displayName: string;
  level: number;
  pin?: string; // stored for admin visibility
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRow {
  id: string;
  full_name: string;
  display_name: string;
  level: number;
  pin_hash: string;
  pin?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserDto {
  fullName: string;
  displayName: string;
  level: number;
  pin?: string;
}

export interface UpdateUserDto {
  level?: number;
  displayName?: string;
}

export function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    fullName: row.full_name,
    displayName: row.display_name,
    level: row.level,
    pin: row.pin ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
