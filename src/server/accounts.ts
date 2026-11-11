// ============ Accounts — secure authentication (بخش ۱۲ و ۱۴) ============
// scrypt password hashing (node:crypto — no external deps), opaque bearer
// session tokens, constant-time comparison. Guest play never touches this.
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { db } from '@/lib/db';

const KEY_LEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, KEY_LEN).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, KEY_LEN);
  const expected = Buffer.from(hash, 'hex');
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export function newToken(): string {
  return randomBytes(32).toString('hex');
}

/** Username rules: 3–20 chars, letters (any script incl. Persian), digits, _ . */
export function validUsername(name: string): boolean {
  return /^[\p{L}\p{N}_.]{3,20}$/u.test(name);
}

export const MIN_PASSWORD_LEN = 4;
export const MAX_PASSWORD_LEN = 72;

/** Resolve a bearer token to its account, bumping lastSeen. */
export async function accountFromToken(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const session = await db.session.findUnique({
    where: { token },
    include: { account: true },
  });
  if (!session) return null;
  // keep session warm (fire & forget)
  db.session.update({ where: { token }, data: { lastSeen: new Date() } }).catch(() => {});
  return session.account;
}
