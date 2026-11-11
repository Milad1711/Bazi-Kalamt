// ============ Daily Missions ============
import type { MissionDef, MissionEvent } from './types';

/**
 * Section 10 — the five core DAILY missions (fixed set, per spec):
 *  1. انجام ۵ مرحله کلمات        (5 Word Hunter levels)
 *  2. پیدا کردن ۲۰ کلمه          (find 20 words)
 *  3. تکمیل ۳ مرحله حافظه        (3 Memory Match levels)
 *  4. تکمیل یک مرحله بدون اشتباه (one level with no mistakes)
 *  5. ورود روزانه به بازی        (daily login — auto-tracked on app open)
 */
export const DAILY_CORE: MissionDef[] = [
  { id: 'd_wh5', event: 'wh_level', target: 5, coins: 120, xp: 90 },
  { id: 'd_words20', event: 'word_found', target: 20, coins: 90, xp: 70 },
  { id: 'd_mm3', event: 'mm_level', target: 3, coins: 100, xp: 80 },
  { id: 'd_perfect1', event: 'perfect_level', target: 1, coins: 110, xp: 90 },
  { id: 'd_login', event: 'login', target: 1, coins: 40, xp: 30 },
];

/** VIP-only daily mission (مأموریت‌های ویژه) — appended when VIP is active */
export const VIP_MISSION: MissionDef = { id: 'd_vip_coins', event: 'coins_earned', target: 400, coins: 200, xp: 150 };

/** Legacy variety pool (kept for reference / future rotations) */
export const MISSION_POOL: MissionDef[] = [
  { id: 'm_words15', event: 'word_found', target: 15, coins: 60, xp: 50 },
  { id: 'm_words30', event: 'word_found', target: 30, coins: 100, xp: 80 },
  { id: 'm_wh2', event: 'wh_level', target: 2, coins: 80, xp: 60 },
  { id: 'm_mm2', event: 'mm_level', target: 2, coins: 80, xp: 60 },
  { id: 'm_pairs24', event: 'pairs_matched', target: 24, coins: 60, xp: 50 },
  { id: 'm_coins200', event: 'coins_earned', target: 200, coins: 70, xp: 40 },
  { id: 'm_combo4', event: 'combo_reached', target: 4, coins: 50, xp: 50 },
  { id: 'm_nohint', event: 'no_hint_level', target: 1, coins: 90, xp: 70 },
  { id: 'm_pairs40', event: 'pairs_matched', target: 40, coins: 100, xp: 80 },
  { id: 'm_wh3', event: 'wh_level', target: 3, coins: 110, xp: 90 },
];

/**
 * Daily mission set — the 5 core missions from the spec (plus the VIP mission
 * when the subscription is active). Fixed, deterministic, resets every day.
 */
export function todayMissionIds(dateStr: string, vip = false): string[] {
  const ids = DAILY_CORE.map((m) => m.id);
  if (vip) ids.push(VIP_MISSION.id);
  return ids;
}

/** every mission definition (daily core + vip + legacy pool) for label lookup */
export const ALL_MISSIONS: MissionDef[] = [...DAILY_CORE, VIP_MISSION, ...MISSION_POOL];

export function missionLabelKey(id: string): { key: string; vars?: Record<string, number> } {
  const m = ALL_MISSIONS.find((x) => x.id === id);
  if (!m) return { key: '' };
  return { key: `mission_${m.id}`, vars: { n: m.target } };
}

// Mission label translation keys are defined in the game screen via a map
export const MISSION_LABELS: Record<MissionEvent, { fa: string; en: string }> = {
  word_found: { fa: '{n} کلمه در شکارچی کلمات پیدا کن', en: 'Find {n} words in Word Hunter' },
  wh_level: { fa: '{n} مرحله شکارچی کلمات را کامل کن', en: 'Complete {n} Word Hunter levels' },
  mm_level: { fa: '{n} مرحله حافظه سه‌بعدی را کامل کن', en: 'Complete {n} Memory Match levels' },
  pairs_matched: { fa: '{n} جفت کارت پیدا کن', en: 'Match {n} pairs of cards' },
  coins_earned: { fa: '{n} سکه کسب کن', en: 'Earn {n} coins' },
  combo_reached: { fa: 'یک کمبوی {n}تایی بساز', en: 'Reach a ×{n} combo' },
  no_hint_level: { fa: 'یک مرحله را بدون راهنما کامل کن', en: 'Complete a level without hints' },
  perfect_level: { fa: '{n} مرحله بدون اشتباه انجام بده', en: 'Finish {n} levels with no mistakes' },
  login: { fa: 'وارد بازی شو', en: 'Check in to the game' },
};

// ============ Weekly missions ============
export interface WeeklyDef {
  id: string;
  event: MissionEvent;
  target: number;
  coins: number;
  xp: number;
}

export const WEEKLY_POOL: WeeklyDef[] = [
  { id: 'w_wh8', event: 'wh_level', target: 8, coins: 280, xp: 200 },
  { id: 'w_mm6', event: 'mm_level', target: 6, coins: 280, xp: 200 },
  { id: 'w_words100', event: 'word_found', target: 100, coins: 320, xp: 220 },
  { id: 'w_pairs100', event: 'pairs_matched', target: 100, coins: 320, xp: 220 },
  { id: 'w_coins1200', event: 'coins_earned', target: 1200, coins: 360, xp: 240 },
  { id: 'w_perfect4', event: 'perfect_level', target: 4, coins: 400, xp: 300 },
  { id: 'w_combo6', event: 'combo_reached', target: 6, coins: 260, xp: 200 },
  { id: 'w_wh15', event: 'wh_level', target: 15, coins: 450, xp: 320 },
];

export const WEEKLY_PER_WEEK = 3;

/** ISO-ish week key, e.g. "2026-W46" (weeks start Saturday — Iran weekend aware) */
export function weekKey(d: Date = new Date()): string {
  // Saturday = start of week in Iran; getDay(): Sat=6
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = date.getDay(); // 0=Sun..6=Sat
  const offsetToSaturday = (day + 1) % 7; // Sat→0, Sun→1, Mon→2 ... Fri→6
  const thursday = new Date(date);
  thursday.setDate(date.getDate() - offsetToSaturday + 3); // the Thursday of this week
  const year = thursday.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const week = Math.floor((thursday.getTime() - jan1.getTime()) / (7 * 86400000)) + 1;
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/** Deterministic weekly mission selection */
export function weekMissionIds(wk: string): string[] {
  let h = 2166136261;
  for (let i = 0; i < wk.length; i++) {
    h ^= wk.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const seed = h >>> 0;
  const arr = [...WEEKLY_POOL];
  let t = seed;
  const rand = () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, WEEKLY_PER_WEEK).map((m) => m.id);
}
