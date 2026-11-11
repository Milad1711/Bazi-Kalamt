// POST /api/account/register — create an account + session token (ثبت‌نام).
// Body: { username, password }
// The password is scrypt-hashed server-side; the client only ever holds the
// opaque session token. Rate-limited to stop credential-stuffing robots.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  hashPassword, newToken, validUsername,
  MIN_PASSWORD_LEN, MAX_PASSWORD_LEN,
} from '@/server/accounts';
import { clientKey, rateLimit, tooMany } from '@/server/rate-limit';

export async function POST(req: NextRequest) {
  const rl = rateLimit(`register:${clientKey(req)}`, 5, 60_000);
  if (!rl.ok) return tooMany(rl);

  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
  }

  const username = (body.username ?? '').trim();
  const password = body.password ?? '';
  if (!validUsername(username)) {
    return NextResponse.json({ ok: false, error: 'bad_username' }, { status: 400 });
  }
  if (password.length < MIN_PASSWORD_LEN || password.length > MAX_PASSWORD_LEN) {
    return NextResponse.json({ ok: false, error: 'bad_password' }, { status: 400 });
  }

  const exists = await db.account.findUnique({ where: { username } });
  if (exists) {
    return NextResponse.json({ ok: false, error: 'username_taken' }, { status: 409 });
  }

  const account = await db.account.create({
    data: { username, passHash: hashPassword(password) },
  });
  const token = newToken();
  await db.session.create({ data: { token, accountId: account.id } });

  return NextResponse.json({ ok: true, token, username });
}
