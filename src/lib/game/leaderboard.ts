// ============ Leaderboard module (بخش ۱۳ — رتبه‌بندی، ماژول مستقل) ============
// This module is deliberately self-contained: the UI only talks to the
// `LeaderboardProvider` interface, so swapping the local simulation for the
// online backend (REST/WebSocket) later requires NO changes anywhere else.
//
//   now:  LocalSimProvider  — deterministic rivals, works fully offline
//   soon: RemoteProvider    — same interface, backed by /api/leaderboard +
//                             WebSocket updates (see ARCHITECTURE.md §12)
//
// Fair-play: rival scores are a pure function of the period key, so every
// client sees the same board; playing more levels always moves you up.

import { BOTS, botScores } from './tournament';
import type { Lang } from './types';

export type BoardScope = 'weekly' | 'monthly' | 'friends';

export interface LeaderRow {
  id: string;
  name: string; // already localized by the provider
  avatar: string; // avatar id for GameIcon
  score: number;
  isPlayer: boolean;
  isFriend: boolean;
}

export interface BoardQuery {
  scope: BoardScope;
  periodKey: string; // weekKey() / monthKey()
  playerScore: number;
  playerName: string;
  playerAvatar: string;
  friendIds: string[]; // bot ids marked as friends
  lang: Lang;
}

export interface LimitedComp {
  id: string;
  active: boolean;
  endsAt: number; // epoch ms
  pointsMultiplier: number;
  topReward: { coins: number; chest: 'gold' | null };
}

/** ISO-ish week key — identical scheme to the weekly missions/tournament */
export function weekKey(d: Date = new Date()): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = (t.getUTCDay() + 6) % 7; // Monday = 0
  t.setUTCDate(t.getUTCDate() - day + 3);
  const first = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  const wk = 1 + Math.round(((t.getTime() - first.getTime()) / 86400000 - 3 + ((first.getUTCDay() + 6) % 7)) / 7);
  return `${t.getUTCFullYear()}-W${String(wk).padStart(2, '0')}`;
}

/** Monthly period key, e.g. 2026-11 */
export function monthKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ---------- deterministic monthly rival scores ----------
const MONTH_BASE = [4200, 3350, 2750, 2200, 1780, 1450, 1180, 950, 760, 600, 470, 360, 270, 190];

function hashOf(key: string): number {
  let t = 2166136261;
  for (let i = 0; i < key.length; i++) {
    t ^= key.charCodeAt(i);
    t = Math.imul(t, 16777619);
  }
  return t >>> 0;
}

function monthlyBotScores(mk: string): number[] {
  let t = hashOf(mk);
  const rand = () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
  const factor = 0.85 + rand() * 0.35;
  return MONTH_BASE.map((b) => Math.round((b * factor) / 10) * 10);
}

/** Local simulated provider — ships with the game, zero backend needed. */
export class LocalSimProvider {
  async getBoard(q: BoardQuery): Promise<LeaderRow[]> {
    const roster =
      q.scope === 'monthly'
        ? BOTS.map((b, i) => ({ ...b, score: monthlyBotScores(q.periodKey)[i] }))
        : BOTS.map((b, i) => ({ ...b, score: botScores(q.periodKey)[i] }));

    const rows: LeaderRow[] = roster.map((b) => ({
      id: b.id,
      name: q.lang === 'fa' ? b.fa : b.en,
      avatar: b.avatar,
      score: b.score,
      isPlayer: false,
      isFriend: q.friendIds.includes(b.id),
    }));
    rows.push({
      id: 'player',
      name: q.playerName,
      avatar: q.playerAvatar,
      score: q.playerScore,
      isPlayer: true,
      isFriend: false,
    });
    if (q.scope === 'friends') {
      return rows.filter((r) => r.isPlayer || r.isFriend).sort((a, b) => b.score - a.score);
    }
    return rows.sort((a, b) => b.score - a.score);
  }
}

/** Online provider — same contract, backend not part of this milestone.
 *  Falls back to the local simulation until /api/leaderboard goes live. */
export class RemoteLeaderboardProvider {
  private fallback = new LocalSimProvider();
  async getBoard(q: BoardQuery): Promise<LeaderRow[]> {
    try {
      const res = await fetch(`/api/leaderboard?scope=${q.scope}&period=${q.periodKey}`, {
        signal: AbortSignal.timeout?.(2500),
      });
      if (res.ok) {
        const data = (await res.json()) as { rows: LeaderRow[] };
        if (Array.isArray(data.rows)) return data.rows;
      }
    } catch {
      /* offline or not deployed yet */
    }
    return this.fallback.getBoard(q);
  }
}

/** Shared default instance — the rest of the app imports this. */
export const leaderboard = new LocalSimProvider();

// ---------- limited-time competition (مسابقات محدود زمانی) ----------
// "Golden Weekend Sprint" — Iran's weekend (Thu 4 / Fri 5): double tournament
// points; top-3 on Sunday rollover earn the golden chest bonus on top of the
// normal weekly rewards.
export function activeComp(now: Date = new Date()): LimitedComp {
  const day = now.getDay(); // 4 = Thursday, 5 = Friday
  const active = day === 4 || day === 5;
  // ends at the end of Friday local time
  const ends = new Date(now);
  ends.setHours(23, 59, 59, 999);
  ends.setDate(ends.getDate() + ((5 - day + 7) % 7));
  return {
    id: 'goldenWeekend',
    active,
    endsAt: ends.getTime(),
    pointsMultiplier: 2,
    topReward: { coins: 250, chest: 'gold' },
  };
}

// ---------- top-rank rewards (جوایز رتبه‌های برتر) ----------
export const MONTHLY_REWARDS: { upTo: number; coins: number; chest?: 'silver' | 'gold' }[] = [
  { upTo: 1, coins: 1200, chest: 'gold' },
  { upTo: 3, coins: 800, chest: 'silver' },
  { upTo: 10, coins: 400 },
  { upTo: 25, coins: 200 },
  { upTo: Infinity, coins: 75 },
];

export function monthlyReward(rank: number): { coins: number; chest?: 'silver' | 'gold' } {
  return MONTHLY_REWARDS.find((r) => rank <= r.upTo) ?? MONTHLY_REWARDS[MONTHLY_REWARDS.length - 1];
}
