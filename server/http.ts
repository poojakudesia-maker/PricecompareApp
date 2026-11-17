import type { Response } from 'express';
import type { User } from '../shared/types.ts';
import type { UserRecord } from './store.ts';

export function fail(res: Response, status: number, code: string, error: string) {
  res.status(status).json({ error, code });
}

export function publicUser(u: UserRecord): User {
  return { id: u.id, phone: u.phone, profile: u.profile, createdAt: u.createdAt };
}
