import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const env = process.env;
export const isProd = env.NODE_ENV === 'production';
export const PORT = Number(env.PORT ?? 8787);
export const DATA_DIR = env.DATA_DIR ?? join(process.cwd(), '.data');
mkdirSync(DATA_DIR, { recursive: true });

// Signing key for login tokens. In production set AUTH_SECRET; locally we keep
// a generated one on disk so you stay logged in across server restarts.
function loadSecret(): string {
  if (env.AUTH_SECRET) return env.AUTH_SECRET;
  if (isProd) throw new Error('AUTH_SECRET must be set in production');
  const f = join(DATA_DIR, 'dev-secret');
  if (!existsSync(f)) writeFileSync(f, randomBytes(32).toString('hex'));
  return readFileSync(f, 'utf8').trim();
}
export const AUTH_SECRET = loadSecret();

/** 'console' prints OTPs to the server log (and returns them to the app) — dev only. */
export const SMS_PROVIDER = (env.SMS_PROVIDER ?? (isProd ? 'msg91' : 'console')) as 'console' | 'msg91';
if (isProd && SMS_PROVIDER === 'console' && env.ALLOW_CONSOLE_OTP !== '1') {
  throw new Error('SMS_PROVIDER=console is not allowed in production');
}
export const MSG91 = {
  authKey: env.MSG91_AUTH_KEY ?? '',
  templateId: env.MSG91_TEMPLATE_ID ?? '',
};

export const SESSION_DAYS = Number(env.SESSION_DAYS ?? 180);
export const DEFAULT_PINCODE = '560001';
export const ADS_EVERY_N_SEARCHES = 5;
