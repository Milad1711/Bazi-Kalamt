// GET /api/economy/config — server-managed prices & product config.
// The shop fetches this so prices can be changed centrally without a client update.
import { NextResponse } from 'next/server';
import { economyConfig } from '@/server/economy-config';

export async function GET() {
  const cfg = await economyConfig();
  return NextResponse.json(cfg, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
