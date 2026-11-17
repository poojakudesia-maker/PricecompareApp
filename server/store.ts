import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DATA_DIR } from './config.ts';
import type { Profile } from '../shared/types.ts';

// Tiny JSON-file store. Good enough for a prototype and a single server.
// When you outgrow it, swap these functions for Postgres/SQLite; nothing else changes.

export interface UserRecord {
  id: string;
  phone: string;
  profile: Profile | null;
  createdAt: string;
  lastLoginAt: string;
  searchCount: number;
}

export interface OtpRecord {
  phone: string;
  hash: string;
  expiresAt: number;
  attempts: number;
  sentAt: number[];
}

interface Db {
  users: Record<string, UserRecord>;
  usersByPhone: Record<string, string>;
  otps: Record<string, OtpRecord>;
}

const FILE = join(DATA_DIR, 'db.json');
const db: Db = existsSync(FILE)
  ? JSON.parse(readFileSync(FILE, 'utf8'))
  : { users: {}, usersByPhone: {}, otps: {} };

let pending: NodeJS.Timeout | null = null;
function persist() {
  // Coalesce writes and replace the file atomically.
  if (pending) return;
  pending = setTimeout(() => {
    pending = null;
    writeFileSync(FILE + '.tmp', JSON.stringify(db));
    renameSync(FILE + '.tmp', FILE);
  }, 50);
}

export const store = {
  userById: (id: string) => db.users[id],
  userByPhone: (phone: string) => db.users[db.usersByPhone[phone]],
  saveUser(u: UserRecord) {
    db.users[u.id] = u;
    db.usersByPhone[u.phone] = u.id;
    persist();
  },
  otp: (phone: string) => db.otps[phone],
  saveOtp(o: OtpRecord) {
    db.otps[o.phone] = o;
    persist();
  },
  deleteOtp(phone: string) {
    delete db.otps[phone];
    persist();
  },
};
