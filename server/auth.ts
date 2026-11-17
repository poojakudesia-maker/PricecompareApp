import { createHash, createHmac, randomInt, randomUUID, timingSafeEqual } from 'node:crypto';
import { Router, type NextFunction, type Request, type Response } from 'express';
import { AUTH_SECRET, SESSION_DAYS } from './config.ts';
import { store, type UserRecord } from './store.ts';
import { sendOtpSms } from './sms.ts';
import { fail, publicUser } from './http.ts';

// ---------- phone ----------

/** Accepts "98765 43210", "+91 9876543210", "09876543210"; returns 10 digits or null. */
export function normalizeIndianMobile(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  let d = input.replace(/[\s\-()]/g, '');
  if (d.startsWith('+91')) d = d.slice(3);
  else if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : null;
}

// ---------- tokens ----------
// Stateless HMAC-signed token: base64url(payload).base64url(sig). Long-lived so users stay signed in.

const b64 = (b: Buffer | string) => Buffer.from(b).toString('base64url');

export function signToken(userId: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = b64(JSON.stringify({ sub: userId, iat: now, exp: now + SESSION_DAYS * 86400 }));
  const sig = b64(createHmac('sha256', AUTH_SECRET).update(payload).digest());
  return `${payload}.${sig}`;
}

export function verifyToken(token: string): string | null {
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = createHmac('sha256', AUTH_SECRET).update(payload).digest();
  const given = Buffer.from(sig, 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const { sub, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return typeof sub === 'string' && exp * 1000 > Date.now() ? sub : null;
  } catch {
    return null;
  }
}

export interface AuthedRequest extends Request {
  user: UserRecord;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const h = req.headers.authorization ?? '';
  const id = h.startsWith('Bearer ') ? verifyToken(h.slice(7)) : null;
  const user = id ? store.userById(id) : undefined;
  if (!user) return fail(res, 401, 'unauthorized', 'Please log in again.');
  (req as AuthedRequest).user = user;
  next();
}

// ---------- OTP ----------

const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 30 * 1000;
const MAX_SENDS_PER_HOUR = 5;
const MAX_ATTEMPTS = 5;
const hashOtp = (phone: string, otp: string) => createHash('sha256').update(`${AUTH_SECRET}:${phone}:${otp}`).digest('hex');

// Per-IP throttle so one client can't spray OTPs at many numbers.
const ipHits = new Map<string, number[]>();
function ipAllowed(ip: string): boolean {
  const now = Date.now();
  const hits = (ipHits.get(ip) ?? []).filter((t) => now - t < 3600_000);
  hits.push(now);
  ipHits.set(ip, hits);
  return hits.length <= 20;
}

export const authRouter = Router();

authRouter.post('/otp', async (req, res) => {
  const phone = normalizeIndianMobile(req.body?.phone);
  if (!phone) return fail(res, 400, 'invalid_phone', 'Enter a valid 10-digit Indian mobile number.');
  if (!ipAllowed(req.ip ?? 'unknown')) return fail(res, 429, 'rate_limited', 'Too many attempts. Try again in a while.');

  const now = Date.now();
  const prev = store.otp(phone);
  const recent = (prev?.sentAt ?? []).filter((t) => now - t < 3600_000);
  const last = recent[recent.length - 1];
  if (last && now - last < RESEND_COOLDOWN_MS) {
    const wait = Math.ceil((RESEND_COOLDOWN_MS - (now - last)) / 1000);
    return fail(res, 429, 'resend_cooldown', `Please wait ${wait}s before requesting another OTP.`);
  }
  if (recent.length >= MAX_SENDS_PER_HOUR) return fail(res, 429, 'rate_limited', 'Too many OTPs requested. Try again in an hour.');

  const otp = String(randomInt(0, 1_000_000)).padStart(6, '0');
  try {
    const { devOtp } = await sendOtpSms(phone, otp);
    store.saveOtp({ phone, hash: hashOtp(phone, otp), expiresAt: now + OTP_TTL_MS, attempts: 0, sentAt: [...recent, now] });
    res.json({ ok: true, phone, expiresIn: OTP_TTL_MS / 1000, resendIn: RESEND_COOLDOWN_MS / 1000, devOtp });
  } catch (e) {
    console.error('[auth] SMS send failed', e);
    fail(res, 502, 'sms_failed', "We couldn't send the OTP. Please try again.");
  }
});

authRouter.post('/verify', (req, res) => {
  const phone = normalizeIndianMobile(req.body?.phone);
  const otp = String(req.body?.otp ?? '');
  if (!phone) return fail(res, 400, 'invalid_phone', 'Enter a valid 10-digit Indian mobile number.');
  if (!/^\d{6}$/.test(otp)) return fail(res, 400, 'invalid_otp', 'Enter the 6-digit OTP.');

  const rec = store.otp(phone);
  if (!rec || rec.expiresAt < Date.now()) return fail(res, 400, 'otp_expired', 'This OTP has expired. Request a new one.');
  if (rec.attempts >= MAX_ATTEMPTS) return fail(res, 429, 'too_many_attempts', 'Too many wrong attempts. Request a new OTP.');

  const ok = timingSafeEqual(Buffer.from(rec.hash), Buffer.from(hashOtp(phone, otp)));
  if (!ok) {
    store.saveOtp({ ...rec, attempts: rec.attempts + 1 });
    const left = MAX_ATTEMPTS - rec.attempts - 1;
    return fail(res, 400, 'wrong_otp', left > 0 ? `Incorrect OTP. ${left} attempt${left === 1 ? '' : 's'} left.` : 'Incorrect OTP. Request a new one.');
  }

  store.deleteOtp(phone);
  const now = new Date().toISOString();
  const user: UserRecord = store.userByPhone(phone) ?? {
    id: randomUUID(),
    phone,
    profile: null,
    createdAt: now,
    lastLoginAt: now,
    searchCount: 0,
  };
  user.lastLoginAt = now;
  store.saveUser(user);
  res.json({ token: signToken(user.id), user: publicUser(user) });
});
