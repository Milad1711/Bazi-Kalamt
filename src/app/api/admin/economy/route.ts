// Admin — economy prices (پنل مدیریت: قیمت‌ها از سرور قابل مدیریت باشند).
// GET  /api/admin/economy — current merged config + stored overrides
// POST /api/admin/economy — upsert an override { key: "pack:small"|"bundle:starter"|"vip", price }
// Auth: header x-admin-token verified via @/server/admin-auth (scrypt hash in
// DB once the owner sets a password; env/demo fallback before that — کادر امن).
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { economyConfig } from '@/server/economy-config';
import { clientKey, rateLimit, tooMany } from '@/server/rate-limit';
import { verifyAdminToken } from '@/server/admin-auth';

export async function GET(req: NextRequest) {
  if (!(await verifyAdminToken(req))) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  const [cfg, overrides] = await Promise.all([
    economyConfig(),
    db.economyOverride.findMany({ orderBy: { key: 'asc' } }),
  ]);
  return NextResponse.json({ ok: true, config: cfg, overrides });
}

export async function POST(req: NextRequest) {
  const rl = rateLimit(`admin:${clientKey(req)}`, 30, 60_000);
  if (!rl.ok) return tooMany(rl);
  if (!(await verifyAdminToken(req))) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  let body: { key?: string; price?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
  }

  const key = (body.key ?? '').slice(0, 64);
  const price = Math.trunc(Number(body.price));
  const validKeys = [
    'vip',
    ...['pack_small', 'pack_medium', 'pack_large', 'pack_mega', 'pack_vip'].map((id) => `pack:${id}`),
    ...['bundle_starter', 'bundle_gold', 'bundle_legend'].map((id) => `bundle:${id}`),
  ];
  if (!validKeys.includes(key) || !Number.isFinite(price) || price < 0 || price > 1_000_000) {
    return NextResponse.json({ ok: false, error: 'bad_key_or_price' }, { status: 400 });
  }

  await db.economyOverride.upsert({
    where: { key },
    create: { key, price },
    update: { price },
  });
  return NextResponse.json({ ok: true, key, price });
}
