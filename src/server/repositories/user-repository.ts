import { User, UserRole, UserVerificationStatus } from '@/types/prophunta';
import { getDb, saveDb, hashPassword } from '../db/store';

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    const db = getDb();
    return db.users.find((u) => u.id === id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const db = getDb();
    return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim()) || null;
  }

  async verifyPassword(userId: string, plainPassword: string): Promise<boolean> {
    const db = getDb();
    const storedHash = db.passwords[userId];
    if (!storedHash) return false;
    return storedHash === hashPassword(plainPassword);
  }

  async create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>, plainPassword: string): Promise<User> {
    const db = getDb();
    const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newUser: User = {
      ...user,
      id,
      createdAt: now,
      updatedAt: now,
    };

    db.users.push(newUser);
    db.passwords[id] = hashPassword(plainPassword);
    saveDb(db);

    return newUser;
  }

  async update(id: string, partial: Partial<User>): Promise<User | null> {
    const db = getDb();
    const idx = db.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;

    db.users[idx] = {
      ...db.users[idx],
      ...partial,
      updatedAt: new Date().toISOString(),
    };
    saveDb(db);
    return db.users[idx];
  }

  async listAll(): Promise<User[]> {
    const db = getDb();
    return [...db.users];
  }
}

export const userRepository = new UserRepository();
