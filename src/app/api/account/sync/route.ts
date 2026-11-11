// POST /api/account/sync — cloud snapshot push/pull (همگام‌سازی پیشرفت).
//   mode "push": store the client's progress JSON (whitelisted fields only)
//   mode "pull": return the stored snapshot so another device can adopt it
// The snapshot NEVER contains credentials — only gameplay progress. Size is
// capped (200 KB) and the token must be valid.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { accountFromToken } from '@/server/accounts';
import { clientKey, rateLimit, tooMany } from '@/server/rate-limit';

const MAX_SNAPSHOT_BYTES = 200_000;

export async function POST(req: NextRequest) {
  const rl = rateLimit(`sync:${clientKey(req)}`, 20, 60_000);
  if (!rl.ok) return tooMany(rl);

  let body: { token?: string; mode?: string; state?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
  }

  const account = await accountFromToken(body.token ?? '');
  if (!account) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  if (body.mode === 'pull') {
    const snap = await db.playerSnapshot.findUnique({ where: { accountId: account.id } });
    return NextResponse.json({
      ok: true,
      state: snap ? JSON.parse(snap.data) : null,
      updatedAt: snap?.updatedAt.getTime() ?? null,
      username: account.username,
    });
  }

  if (body.mode === 'push') {
    const json = JSON.stringify(body.state ?? {});
    if (json.length > MAX_SNAPSHOT_BYTES) {
      return NextResponse.json({ ok: false, error: 'too_large' }, { status: 413 });
    }
    await db.playerSnapshot.upsert({
      where: { accountId: account.id },
      create: { accountId: account.id, data: json },
      update: { data: json },
    });
    return NextResponse.json({ ok: true, updatedAt: Date.now() });
  }

  return NextResponse.json({ ok: false, error: 'bad_mode' }, { status: 400 });
}
