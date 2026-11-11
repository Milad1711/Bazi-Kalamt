// Admin — secure password management (کادر امن — تعیین/تغییر رمز مدیریت).
// GET  /api/admin/password   — public, rate-limited: { hasCustom } only, so the
//        login screen can show the demo-default hint until the owner sets a
//        real password. Never returns any secret.
// POST /api/admin/password   — authenticated with the CURRENT password (header
//        x-admin-token): { currentToken?, newToken } → stores a scrypt hash of
//        newToken in AdminAuth. From then on the env/demo fallback is dead and
//        the hashed password is the only key that opens the panel.
import { NextRequest, NextResponse } from 'next/server';
import { clientKey, rateLimit, tooMany } from '@/server/rate-limit';
import {
  adminTokenFrom,
  hasCustomAdminPassword,
  MAX_ADMIN_PASS_LEN,
  MIN_ADMIN_PASS_LEN,
  setAdminPassword,
  verifyAdminToken,
} from '@/server/admin-auth';

export async function GET(req: NextRequest) {
  const rl = rateLimit(`admin-pass-get:${clientKey(req)}`, 20, 60_000);
  if (!rl.ok) return tooMany(rl);
  return NextResponse.json({ ok: true, hasCustom: await hasCustomAdminPassword() });
}

export async function POST(req: NextRequest) {
  const rl = rateLimit(`admin-pass-set:${clientKey(req)}`, 10, 60_000);
  if (!rl.ok) return tooMany(rl);
  if (!(await verifyAdminToken(req))) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  let body: { currentToken?: string; newToken?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
  }

  // defence in depth: if the client echoes its current password it must match
  // the header token (catches confused/stale clients before we rotate).
  if (body.currentToken && body.currentToken !== adminTokenFrom(req)) {
    return NextResponse.json({ ok: false, error: 'wrong_current' }, { status: 403 });
  }

  const next = (body.newToken ?? '').trim();
  if (next.length < MIN_ADMIN_PASS_LEN || next.length > MAX_ADMIN_PASS_LEN) {
    return NextResponse.json({ ok: false, error: 'weak_password' }, { status: 400 });
  }

  await setAdminPassword(next);
  return NextResponse.json({ ok: true });
}
