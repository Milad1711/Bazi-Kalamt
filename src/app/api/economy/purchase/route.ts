// POST /api/economy/purchase — SERVER-SIDE purchase verification.
// Flow (mirrors real store flows — IAP / درگاه پرداخت مجاز):
//   1. Client sends { installId, kind, itemId, nonce } — NEVER a price.
//   2. Server looks up the canonical price, checks stock/validity.
//   3. The unique nonce makes the purchase idempotent: replaying the same
//      request (network retry, tampered client) returns the original result
//      WITHOUT granting coins again  → جلوگیری از خرید تکراری.
//   4. Valid purchase is recorded in the Purchase table (audit trail).
// In production the "receipt" step would additionally verify the app-store /
// payment-gateway receipt; in this demo the store confirmation IS the receipt.
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { serverPrice, serverGrant, type ServerItemKind } from '@/server/economy-config';
import { clientKey, rateLimit, tooMany } from '@/server/rate-limit';

const KINDS: ServerItemKind[] = ['pack', 'bundle', 'vip'];

export async function POST(req: NextRequest) {
  let body: { installId?: string; kind?: string; itemId?: string; nonce?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
  }

  const installId = (body.installId ?? '').slice(0, 64);
  const kind = body.kind as ServerItemKind;
  const itemId = (body.itemId ?? '').slice(0, 64);
  const nonce = (body.nonce ?? '').slice(0, 64);

  if (!installId || !nonce || !KINDS.includes(kind) || !itemId) {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
  }

  // 0) abuse control — a client can never hammer the purchase endpoint
  const rl = rateLimit(`purchase:${clientKey(req, installId)}`, 10, 60_000);
  if (!rl.ok) return tooMany(rl);

  // 1) idempotency — same nonce never grants twice
  const existing = await db.purchase.findUnique({ where: { nonce } });
  if (existing) {
    return NextResponse.json({
      ok: true,
      duplicate: true,
      granted: existing.granted,
      price: existing.priceServer,
      note: 'replay detected — original grant returned (no double purchase)',
    });
  }

  // 2) price from the server config only — client price is not trusted
  const price = await serverPrice(kind, itemId);
  if (price === null) {
    return NextResponse.json({ ok: false, error: 'unknown_item' }, { status: 400 });
  }

  // 3) record the verified purchase (idempotent via unique nonce)
  const granted = serverGrant(kind, itemId);
  try {
    await db.purchase.create({
      data: { installId, itemId, kind, nonce, priceServer: price, granted },
    });
  } catch {
    // unique-constraint race → treat as replay
    return NextResponse.json({ ok: true, duplicate: true, granted: 0, price });
  }

  return NextResponse.json({
    ok: true,
    duplicate: false,
    itemId,
    kind,
    price, // what the client should charge
    granted, // what the client may grant
  });
}
