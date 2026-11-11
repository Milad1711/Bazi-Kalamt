// ============ Client ↔ server economy bridge ============
// Every purchase is verified by the server before any grant is applied, and
// every coin delta is reported to the anti-tamper ledger. If the server rejects
// a report (balance mismatch → tampered/devtools-edited coins), the client
// adopts the authoritative server balance.
'use client';

// ---------- install identity ----------
export function installId(): string {
  if (typeof window === 'undefined') return 'server';
  let id = localStorage.getItem('bq3-install-id');
  if (!id) {
    id = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    localStorage.setItem('bq3-install-id', id);
  }
  return id;
}

// ---------- server-managed config (prices) ----------
export interface ServerEconomyConfig {
  version: number;
  packs: { id: string; coins: number; bonusPct: number; price: number }[];
  bundles: { id: string; price: number; value: number }[];
  vip: { price: number; days: number };
  ad: { reward: number; dailyLimit: number; consentOnly: true };
}

let cachedConfig: ServerEconomyConfig | null = null;

export async function fetchEconomyConfig(): Promise<ServerEconomyConfig | null> {
  if (cachedConfig) return cachedConfig;
  try {
    const res = await fetch('/api/economy/config', { cache: 'no-store' });
    if (!res.ok) return null;
    cachedConfig = (await res.json()) as ServerEconomyConfig;
    return cachedConfig;
  } catch {
    return null; // offline → client falls back to bundled defaults
  }
}

// ---------- purchase verification (server-side) ----------
export interface PurchaseResult {
  ok: boolean;
  duplicate?: boolean;
  granted?: number;
  price?: number;
  error?: string;
}

/**
 * Ask the server to verify a purchase. The client never sends a price —
 * the server computes it from its own config. Returns the verified grant.
 */
export async function verifyPurchase(
  kind: 'pack' | 'bundle' | 'vip',
  itemId: string,
): Promise<PurchaseResult> {
  const nonce = `${installId()}:${kind}:${itemId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
  try {
    const res = await fetch('/api/economy/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ installId: installId(), kind, itemId, nonce }),
    });
    if (!res.ok) return { ok: false, error: `http_${res.status}` };
    return (await res.json()) as PurchaseResult;
  } catch {
    return { ok: false, error: 'network' };
  }
}

// ---------- server-side level-result validation (ضدتقلب) ----------
export interface ServerValidatedRewards {
  ok: boolean;
  verified: boolean;
  reason?: string;
  rewards?: { coins: number; xp: number; stars: number; perfect: boolean };
}

/**
 * Report a finished level's inputs to the validator. The server recomputes the
 * reward; if the client's local computation disagrees, the caller adopts the
 * server's numbers. Offline → `{ ok:false, verified:false }` and the level
 * result stays locally computed (offline play keeps working — بخش ۱۶).
 */
export async function validateLevelResult(
  report: Record<string, unknown>,
): Promise<ServerValidatedRewards> {
  try {
    const res = await fetch('/api/game/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...report, installId: installId() }),
      signal: AbortSignal.timeout?.(4000),
    });
    if (!res.ok) return { ok: false, verified: false, reason: `http_${res.status}` };
    return (await res.json()) as ServerValidatedRewards;
  } catch {
    return { ok: false, verified: false, reason: 'offline' }; // resume-on-reconnect path
  }
}

// ---------- anti-tamper ledger ----------
let ledgerQueue: Promise<void> = Promise.resolve();

/** report a coin delta; if rejected, `onCorrection(serverBalance)` runs so the
 *  caller can reset the local balance to the authoritative value. */
export function reportDelta(
  delta: number,
  balanceAfter: number,
  reason: string,
  onCorrection?: (serverBalance: number) => void,
): void {
  // serialize reports so continuity checks never race with each other
  ledgerQueue = ledgerQueue.then(async () => {
    try {
      const res = await fetch('/api/economy/ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ installId: installId(), delta, balanceAfter, reason }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { ok: boolean; balance?: number };
      if (!data.ok && typeof data.balance === 'number') {
        onCorrection?.(data.balance);
      }
    } catch {
      // offline — the next successful report re-syncs continuity
    }
  });
}

/** reconcile on app start: adopt the server's authoritative balance if it differs */
export function reconcileBalance(
  clientBalance: number,
  onAdopt: (serverBalance: number) => void,
): void {
  ledgerQueue = ledgerQueue.then(async () => {
    try {
      const res = await fetch(`/api/economy/ledger?installId=${encodeURIComponent(installId())}`, {
        cache: 'no-store',
      });
      if (!res.ok) return;
      const data = (await res.json()) as { ok: boolean; balance?: number };
      if (data.ok && typeof data.balance === 'number' && data.balance !== clientBalance) {
        onAdopt(data.balance);
      }
    } catch {
      // offline — keep local balance
    }
  });
}
