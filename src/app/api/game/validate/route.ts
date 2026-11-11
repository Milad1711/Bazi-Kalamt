// POST /api/game/validate — server-side level-result validation (ضدتقلب).
// The client reports the round's INPUTS (what happened); the server recomputes
// the rewards with its own copy of the formulas and rejects impossible inputs
// (negative times, more words than a level can hold, fewer moves than pairs…).
// GET is a health probe.
import { NextRequest, NextResponse } from 'next/server';
import { validateReport } from '@/server/game-validation';
import { clientKey, rateLimit, tooMany } from '@/server/rate-limit';

export async function GET() {
  return NextResponse.json({ ok: true, service: 'game-validation' });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
  }

  const install = (body as { installId?: string })?.installId ?? '';
  // 60 validations / minute / install — far above honest play, far below abuse
  const rl = rateLimit(`validate:${clientKey(req, install.slice(0, 64))}`, 60, 60_000);
  if (!rl.ok) return tooMany(rl);

  const result = validateReport(body);
  if (!result.ok) {
    return NextResponse.json(result, { status: 422 });
  }
  return NextResponse.json(result);
}
