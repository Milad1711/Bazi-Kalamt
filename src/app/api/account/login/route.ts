// POST /api/account/login — sign in and get a session token (ورود با حساب).
// Same password on every device → playing from device B picks up the cloud
// snapshot during sync (همگام‌سازی بین دستگاه‌ها).
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, newToken } from '@/server/accounts';
import { clientKey, rateLimit, tooMany } from '@/server/rate-limit';

export async function POST(req: NextRequest) {
  // brute-force guard: 8 attempts / minute / IP
  const rl = rateLimit(`login:${clientKey(req)}`, 8, 60_000);
  if (!rl.ok) return tooMany(rl);

  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
  }

  const username = (body.username ?? '').trim();
  const password = body.password ?? '';
  const account = await db.account.findUnique({ where: { username } });
  // identical response for unknown user and wrong password (no user enumeration)
  if (!account || !verifyPassword(password, account.passHash)) {
    return NextResponse.json({ ok: false, error: 'invalid_credentials' }, { status: 401 });
  }

  const token = newToken();
  await db.session.create({ data: { token, accountId: account.id } });
  return NextResponse.json({ ok: true, token, username });
}
