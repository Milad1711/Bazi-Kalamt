// Admin — device (install) management (پنل مدیریت: مدیریت شناسه دستگاه + هدیه سکه).
// GET  /api/admin/devices          — recent active devices with server-side balances
// GET  /api/admin/devices?q=<id>   — full profile of one install id (ledger + purchases)
// POST /api/admin/devices          — gift coins { installId, amount, note? }
//        Appends to the anti-tamper ledger (reason 'admin_gift'). The device
//        adopts the new authoritative balance automatically on its next
//        reconcile / app start (reconcileBalance → last.balanceAfter).
// Auth: header x-admin-token verified via @/server/admin-auth (scrypt hash in
// DB once the owner sets a password; env/demo fallback before that — کادر امن).
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clientKey, rateLimit, tooMany } from '@/server/rate-limit';
import { verifyAdminToken } from '@/server/admin-auth';

const START_BALANCE = 120; // must match /api/economy/ledger

async function serverBalance(installId: string): Promise<number> {
  const last = await db.coinLedger.findFirst({ where: { installId }, orderBy: { createdAt: 'desc' } });
  return last?.balanceAfter ?? START_BALANCE;
}

export async function GET(req: NextRequest) {
  if (!(await verifyAdminToken(req))) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  const q = req.nextUrl.searchParams.get('q')?.trim().slice(0, 64) ?? '';

  // ---- single device profile ----
  if (q) {
    const [ledger, purchases] = await Promise.all([
      db.coinLedger.findMany({ where: { installId: q }, orderBy: { createdAt: 'desc' }, take: 25 }),
      db.purchase.findMany({ where: { installId: q }, orderBy: { createdAt: 'desc' }, take: 10 }),
    ]);
    if (ledger.length === 0 && purchases.length === 0) {
      return NextResponse.json({ ok: true, found: false });
    }
    const agg = await db.coinLedger.aggregate({
      where: { installId: q },
      _count: { id: true },
      _sum: { delta: true },
    });
    return NextResponse.json({
      ok: true,
      found: true,
      device: {
        installId: q,
        balance: ledger[0]?.balanceAfter ?? START_BALANCE,
        ledgerRows: agg._count.id,
        netCoins: agg._sum.delta ?? 0,
        lastActivity: ledger[0]?.createdAt ?? purchases[0]?.createdAt ?? null,
        ledger,
        purchases,
      },
    });
  }

  // ---- recent devices list ----
  const rows = await db.coinLedger.findMany({ orderBy: { createdAt: 'desc' }, take: 1500 });
  const seen = new Map<string, { installId: string; balance: number; entries: number; net: number; lastAt: Date }>();
  for (const r of rows) {
    const d = seen.get(r.installId);
    if (d) {
      d.entries++;
      d.net += r.delta;
    } else {
      seen.set(r.installId, { installId: r.installId, balance: r.balanceAfter, entries: 1, net: r.delta, lastAt: r.createdAt });
    }
  }
  const devices = [...seen.values()]
    .sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime())
    .slice(0, 40);
  return NextResponse.json({ ok: true, devices });
}

export async function POST(req: NextRequest) {
  const rl = rateLimit(`admin-dev:${clientKey(req)}`, 30, 60_000);
  if (!rl.ok) return tooMany(rl);
  if (!(await verifyAdminToken(req))) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  let body: { installId?: string; amount?: number; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
  }

  const installId = (body.installId ?? '').trim().slice(0, 64);
  const amount = Math.trunc(Number(body.amount));
  const note = (body.note ?? '').trim().slice(0, 28);
  if (!installId || !Number.isFinite(amount) || amount < 1 || amount > 1_000_000) {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
  }

  const current = await serverBalance(installId);
  const balanceAfter = current + amount;
  await db.coinLedger.create({
    data: {
      installId,
      delta: amount,
      balanceAfter,
      reason: note ? `admin_gift:${note}` : 'admin_gift', // ≤ 40 chars
    },
  });
  return NextResponse.json({ ok: true, installId, granted: amount, balance: balanceAfter });
}
