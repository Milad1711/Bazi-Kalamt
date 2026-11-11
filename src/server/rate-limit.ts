// ============ Rate limiting (بخش ۱۴ — محدودسازی درخواست‌های تکراری و سوءاستفاده) ============
// Sliding-window limiter kept in module memory. In a multi-instance production
// deployment this would move to Redis — the call signature stays identical.
import { NextResponse } from 'next/server';

interface Bucket {
  hits: number[];
}

const buckets = new Map<string, Bucket>();

/** prune old buckets every few minutes to avoid unbounded growth */
let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < 120_000) return;
  lastSweep = now;
  for (const [k, b] of buckets) {
    if (!b.hits.length || now - b.hits[b.hits.length - 1] > 3_600_000) buckets.delete(k);
  }
}

export interface RateResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

/**
 * Consume one slot from the bucket `key` (usually `${route}:${ip}:${installId}`).
 * Allows `max` requests per `windowMs`; returns ok=false with a retry hint when exceeded.
 */
export function rateLimit(key: string, max: number, windowMs: number): RateResult {
  const now = Date.now();
  sweep(now);
  const b = buckets.get(key) ?? { hits: [] };
  b.hits = b.hits.filter((t) => now - t < windowMs);
  if (b.hits.length >= max) {
    buckets.set(key, b);
    const oldest = b.hits[0];
    return { ok: false, remaining: 0, retryAfterSec: Math.ceil((windowMs - (now - oldest)) / 1000) };
  }
  b.hits.push(now);
  buckets.set(key, b);
  return { ok: true, remaining: max - b.hits.length, retryAfterSec: 0 };
}

/** Best-effort client identity for a request (proxy-aware). */
export function clientKey(req: Request, extra?: string): string {
  const h = req.headers;
  const ip =
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    'local';
  return extra ? `${ip}:${extra}` : ip;
}

/** Standard 429 response with Retry-After. */
export function tooMany(r: RateResult): NextResponse {
  return NextResponse.json(
    { ok: false, error: 'rate_limited', retryAfterSec: r.retryAfterSec },
    { status: 429, headers: { 'Retry-After': String(r.retryAfterSec) } },
  );
}
