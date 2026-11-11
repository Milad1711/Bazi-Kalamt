// Admin — service stats (داشبورد مدیریت: بازیکن‌ها، خریدها، گردش سکه).
// Auth: header x-admin-token verified via @/server/admin-auth (scrypt hash in
// DB once the owner sets a password; env/demo fallback before that — کادر امن).
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdminToken } from '@/server/admin-auth';

export async function GET(req: NextRequest) {
  if (!(await verifyAdminToken(req))) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  const [accounts, sessions, purchases, purchasesCoins, ledgerRows, ledgerSum, customWords, snapshots] =
    await Promise.all([
      db.account.count(),
      db.session.count(),
      db.purchase.count(),
      db.purchase.aggregate({ _sum: { priceServer: true, granted: true } }),
      db.coinLedger.count(),
      db.coinLedger.aggregate({ _sum: { delta: true } }),
      db.contentWord.count(),
      db.playerSnapshot.count(),
    ]);
  return NextResponse.json({
    ok: true,
    accounts,
    sessions,
    purchases,
    purchaseCoinsGranted: purchasesCoins._sum.granted ?? 0,
    ledgerRows,
    ledgerNetCoins: ledgerSum._sum.delta ?? 0,
    customWords,
    snapshots,
  });
}
