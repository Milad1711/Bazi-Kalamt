// ============ Server-side economy config — SINGLE SOURCE OF TRUTH for prices ============
// "قیمت‌ها باید از سرور قابل مدیریت باشند" — in production this module would read
// from the database / admin panel; the client always fetches prices from here and
// purchase verification recomputes them server-side, so a tampered client cannot
// pay a different (lower) price.
import { COIN_PACKS, packTotalCoins, BUNDLES } from '@/lib/game/shop';
import { VIP_PRICE, VIP_DAYS, AD_REWARD_COINS, AD_DAILY_LIMIT } from '@/lib/game/economy';
import { db } from '@/lib/db';

export interface EconomyConfig {
  version: number;
  currency: 'coins';
  packs: { id: string; coins: number; bonusPct: number; price: number }[];
  bundles: { id: string; price: number; value: number }[];
  vip: { price: number; days: number };
  ad: { reward: number; dailyLimit: number; consentOnly: true };
  minVersionNote: string;
}

/** canonical server config — prices merged with admin-panel overrides
 *  (پنل مدیریت: قیمت‌ها بدون آپدیت کلاینت تغییر می‌کنند) */
export async function economyConfig(): Promise<EconomyConfig> {
  const cfg: EconomyConfig = {
    version: 1,
    currency: 'coins',
    packs: COIN_PACKS.map((p) => ({
      id: p.id,
      coins: packTotalCoins(p),
      bonusPct: p.bonusPct,
      price: p.coins, // demo build: price is expressed in the same coin currency
    })),
    bundles: BUNDLES.map((b) => ({ id: b.id, price: b.price, value: b.value })),
    vip: { price: VIP_PRICE, days: VIP_DAYS },
    ad: { reward: AD_REWARD_COINS, dailyLimit: AD_DAILY_LIMIT, consentOnly: true },
    minVersionNote: 'demo',
  };
  try {
    const overrides = await db.economyOverride.findMany();
    for (const o of overrides) {
      const [kind, id] = o.key.split(':');
      if (kind === 'pack') {
        const p = cfg.packs.find((x) => x.id === id);
        if (p) p.price = o.price;
      } else if (kind === 'bundle') {
        const b = cfg.bundles.find((x) => x.id === id);
        if (b) b.price = o.price;
      } else if (kind === 'vip' && o.key === 'vip') {
        cfg.vip.price = o.price;
      }
    }
  } catch {
    // DB unavailable — serve bundled defaults (offline-safe)
  }
  return cfg;
}

export type ServerItemKind = 'pack' | 'bundle' | 'vip';

/** price lookup used by purchase verification — server values only */
export async function serverPrice(kind: ServerItemKind, itemId: string): Promise<number | null> {
  const cfg = await economyConfig();
  if (kind === 'vip') return itemId === 'vip' ? cfg.vip.price : null;
  if (kind === 'pack') {
    // special server-known grant: the consent-gated rewarded ad (capped client-side)
    if (itemId === 'ad_reward') return 0;
    return cfg.packs.find((p) => p.id === itemId)?.price ?? null;
  }
  return cfg.bundles.find((b) => b.id === itemId)?.price ?? null;
}

/** grant lookup — what the server tells the client to grant after verification */
export function serverGrant(kind: ServerItemKind, itemId: string): number {
  if (kind === 'pack') return COIN_PACKS.find((p) => p.id === itemId)
    ? packTotalCoins(COIN_PACKS.find((p) => p.id === itemId)!)
    : 0;
  if (kind === 'bundle') return BUNDLES.find((b) => b.id === itemId)?.contents.coins ?? 0;
  return 0; // vip grants a subscription, not coins
}
