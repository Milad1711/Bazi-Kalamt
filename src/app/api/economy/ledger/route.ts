// POST /api/economy/ledger — anti-tamper coin ledger (دستکاری موجودی سکه).
// The client reports EVERY coin delta with the balance after the change.
// Server keeps an append-only ledger per install and enforces continuity:
//   expectedBalance = last.balanceAfter + delta
// If the client reports a balance that does not follow the ledger (coins added
// via devtools / a hacked save), the report is REJECTED and the authoritative
// server balance is returned — the client adopts it (self-correction).
// GET /api/economy/ledger?installId=... — reconcile on app start.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const START_BALANCE = 120; // must match the client's initial coins

export async function GET(req: NextRequest) {
  const installId = req.nextUrl.searchParams.get('installId')?.slice(0, 64) ?? '';
  if (!installId) return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
  const last = await db.coinLedger.findFirst({
    where: { installId },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ ok: true, balance: last?.balanceAfter ?? START_BALANCE });
}

export async function POST(req: NextRequest) {
  let body: { installId?: string; delta?: number; balanceAfter?: number; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
  }
  const installId = (body.installId ?? '').slice(0, 64);
  const delta = Math.trunc(Number(body.delta));
  const balanceAfter = Math.trunc(Number(body.balanceAfter));
  const reason = (body.reason ?? 'unknown').slice(0, 40);
  if (!installId || !Number.isFinite(delta) || !Number.isFinite(balanceAfter)) {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
  }

  const last = await db.coinLedger.findFirst({
    where: { installId },
    orderBy: { createdAt: 'desc' },
  });
  const serverBalance = last?.balanceAfter ?? START_BALANCE;
  const expected = serverBalance + delta;

  if (balanceAfter !== expected) {
    // tampering or divergence — reject and hand back the authoritative balance
    return NextResponse.json({
      ok: false,
      balance: serverBalance,
      reason: 'balance_mismatch',
      note: 'server balance is authoritative — client self-corrects',
    });
  }

  await db.coinLedger.create({
    data: { installId, delta, balanceAfter, reason },
  });
  return NextResponse.json({ ok: true, balance: balanceAfter });
}
