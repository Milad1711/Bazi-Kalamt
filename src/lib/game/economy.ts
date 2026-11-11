// ============ Economy: XP, Levels, Rewards, Events, VIP ============
import type { DailyReward, Difficulty, LevelRewards } from './types';

// ---------- XP & Level ----------
/** Cumulative XP required to reach a level (level 1 = 0 XP) */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return (100 * (level - 1) * level) / 2;
}

export function levelFromXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

export function levelProgress(xp: number): { level: number; cur: number; need: number; pct: number } {
  const level = levelFromXp(xp);
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const need = next - base;
  const cur = xp - base;
  return { level, cur, need, pct: Math.min(100, Math.round((cur / need) * 100)) };
}

export const LEVELUP_COINS = (newLevel: number) => 25 * newLevel;

/** Avatar unlock levels (id -> player level required); granted automatically on level-up */
export const AVATAR_UNLOCK_LEVEL: Record<string, number> = {
  owl: 1, fox: 3, cat: 5, frog: 7, panda: 10,
  penguin: 13, lion: 16, robot: 20, unicorn: 25, dragon: 30,
};

// ---------- Special Events (real multipliers — one active every day) ----------
export type EventId = 'doubleCoins' | 'wordMaster' | 'memoryBoost' | 'sunnySunday' | 'brainDay' | 'luckySaturday';

export interface ActiveEvent {
  id: EventId;
  coins?: number; // coin multiplier
  xpWh?: number; // xp multiplier in Word Hunter
  xpMm?: number; // xp multiplier in Memory Match
}

/** Iran's weekend = Thursday(4) & Friday(5) — Golden Weekend. One event every day. */
export function getActiveEvents(now: Date = new Date()): ActiveEvent[] {
  const day = now.getDay();
  switch (day) {
    case 4:
    case 5:
      return [{ id: 'doubleCoins', coins: 2 }];
    case 3:
      return [{ id: 'wordMaster', xpWh: 2 }];
    case 1:
      return [{ id: 'memoryBoost', xpMm: 2 }];
    case 0:
      return [{ id: 'sunnySunday', coins: 1.5 }];
    case 2:
      return [{ id: 'brainDay', xpWh: 1.5, xpMm: 1.5 }];
    default:
      return [{ id: 'luckySaturday', coins: 1.5 }];
  }
}

export function coinMultiplier(events: ActiveEvent[]): number {
  return events.reduce((m, e) => m * (e.coins ?? 1), 1);
}
export function xpMultiplier(events: ActiveEvent[], game: 'wh' | 'mm'): number {
  return events.reduce((m, e) => m * (game === 'wh' ? (e.xpWh ?? 1) : (e.xpMm ?? 1)), 1);
}

// ---------- Word Hunter rewards ----------
const WH_BASE_COINS: Record<Difficulty, number> = { easy: 20, normal: 35, hard: 55, expert: 80 };
const WH_BASE_XP: Record<Difficulty, number> = { easy: 30, normal: 50, hard: 75, expert: 110 };
const WH_BOX: Record<Difficulty, number> = { easy: 40, normal: 70, hard: 110, expert: 160 };

export function computeWHRewards(
  difficulty: Difficulty,
  wordLengths: number[],
  timeSec: number,
  hintsUsed: number,
  parTime: number,
  events: ActiveEvent[] = getActiveEvents(),
  boss = false,
): LevelRewards {
  const base = WH_BASE_COINS[difficulty];
  const noHint = hintsUsed === 0;
  const fast = timeSec <= parTime;
  const perfect = noHint && fast;
  const noHintBonus = noHint ? Math.round(base * 0.5) : 0;
  const speedBonus = fast ? Math.round(base * 0.25) : 0;
  const boxCoins = perfect ? WH_BOX[difficulty] : 0;
  const cm = coinMultiplier(events);
  const xm = xpMultiplier(events, 'wh');
  const wordsXp = wordLengths.reduce((s, l) => s + l * 5, 0);
  const bossCm = boss ? 1.5 : 1;
  const bossXm = boss ? 1.25 : 1;
  const coins = Math.round((base + noHintBonus + speedBonus + boxCoins) * cm * bossCm);
  const xp = Math.round((wordsXp + WH_BASE_XP[difficulty]) * xm * bossXm);
  const eventMultipliers: string[] = [];
  if (boss) eventMultipliers.push('BOSS ×1.5');
  if (cm > 1) eventMultipliers.push(`×${cm}`);
  if (xm > 1) eventMultipliers.push(`×${xm}`);
  return {
    coins, xp, baseCoins: base, noHintBonus, speedBonus, boxCoins,
    eventMultipliers, stars: perfect ? 3 : noHint ? 2 : 1, perfect,
  };
}

// ---------- Memory Match rewards ----------
const MM_BASE_COINS: Record<Difficulty, number> = { easy: 18, normal: 32, hard: 50, expert: 75 };
const MM_BASE_XP: Record<Difficulty, number> = { easy: 25, normal: 45, hard: 70, expert: 100 };
const MM_BOX: Record<Difficulty, number> = { easy: 35, normal: 60, hard: 95, expert: 140 };

export function computeMMRewards(
  difficulty: Difficulty,
  pairs: number,
  moves: number,
  bestCombo: number,
  mistakes: number,
  events: ActiveEvent[] = getActiveEvents(),
  boss = false,
): LevelRewards {
  const base = MM_BASE_COINS[difficulty];
  const ratio = moves / pairs;
  const stars = ratio <= 1.4 ? 3 : ratio <= 1.9 ? 2 : 1;
  const comboBonus = bestCombo >= 5 ? Math.round(base * 0.3) : bestCombo >= 3 ? Math.round(base * 0.15) : 0;
  const perfect = mistakes === 0;
  const boxCoins = perfect ? MM_BOX[difficulty] : 0;
  const cm = coinMultiplier(events);
  const xm = xpMultiplier(events, 'mm');
  const bossCm = boss ? 1.5 : 1;
  const bossXm = boss ? 1.25 : 1;
  const coins = Math.round((base + comboBonus + boxCoins) * cm * bossCm);
  const xp = Math.round((pairs * 6 + MM_BASE_XP[difficulty]) * xm * bossXm);
  const eventMultipliers: string[] = [];
  if (boss) eventMultipliers.push('BOSS ×1.5');
  if (cm > 1) eventMultipliers.push(`×${cm}`);
  if (xm > 1) eventMultipliers.push(`×${xm}`);
  return {
    coins, xp, baseCoins: base, noHintBonus: comboBonus, speedBonus: 0, boxCoins,
    eventMultipliers, stars, perfect,
  };
}

// ---------- Daily reward (section 10 — 7-day ladder with hint & special chest) ----------
export const DAILY_REWARDS: DailyReward[] = [
  { kind: 'coins', coins: 100 },
  { kind: 'coins', coins: 150 },
  { kind: 'coins', coins: 200 },
  { kind: 'coins', coins: 250 },
  { kind: 'hint', n: 1 },
  { kind: 'coins', coins: 400 },
  { kind: 'chest', chest: 'gold' }, // صندوق ویژه
];
export const DAILY_BIG_DAY = 7;

/** Reward for a given day, with VIP multiplier applied (VIP = جایزه روزانه بیشتر) */
export function dailyRewardFor(day: number, vip: boolean): DailyReward {
  const base = DAILY_REWARDS[(day - 1) % 7];
  if (!vip) return base;
  if (base.kind === 'coins') return { kind: 'coins', coins: base.coins * 2 };
  if (base.kind === 'hint') return { kind: 'hint', n: base.n + 1 };
  return base; // chest stays the same — already the grand prize
}

// ---------- VIP subscription (اشتراک VIP) ----------
export const VIP_PRICE = 2500;       // coins for one 30-day cycle (demo — server-verified)
export const VIP_DAYS = 30;
export const VIP_COIN_MULT = 2;      // bigger daily reward
export const VIP_AD_REWARD_BONUS = 1.5; // VIP earns more from optional rewarded ads

// Coin packs moved to ./shop.ts (honest demo purchase — no ads, no coercion).
export const FREE_DAILY_GIFT = 100;
/** optional rewarded ad (تبلیغ جایزه‌دار اختیاری) — always opt-in, capped per day */
export const AD_REWARD_COINS = 75;
export const AD_DAILY_LIMIT = 3;

// ---------- daily spin wheel (چرخ شانس روزانه) ----------
/** hard cap — no spin may ever award more than 50 coins (سقف جایزه: ۵۰ سکه) */
export const SPIN_MAX_REWARD = 50;
/** wheel segments in visual order; every value ≤ SPIN_MAX_REWARD, no VIP multiplier applied */
export const SPIN_SEGMENTS: number[] = [10, 20, 30, 15, 50, 25, 40, 35];
