// ============ Server-side level-result validation (بخش ۱۴ — ضدتقلب) ============
// "نتیجه مراحل سمت سرور اعتبارسنجی شود" — the client reports WHAT happened
// (inputs), the server recomputes WHAT it is worth (outputs) with the same
// formulas as the client and rejects impossible inputs. The response is the
// authoritative reward; a tampered client cannot inflate it.
//
// The reward formulas are mirrored from src/lib/game/economy.ts on purpose:
// the server must never trust client-side arithmetic.

import {
  computeMMRewards,
  computeWHRewards,
  getActiveEvents,
  type ActiveEvent,
} from '@/lib/game/economy';
import type { Difficulty, LevelRewards } from '@/lib/game/types';

const DIFFS: Difficulty[] = ['easy', 'normal', 'hard', 'expert'];
const MAX_LEVEL = 100; // TOTAL levels per mini-game
const MAX_WORDS_IN_LEVEL = 12; // hard cap for any word-search level
const MAX_PAIRS = 12; // hard cap for any memory level
const MAX_TIME_SEC = 60 * 60; // one hour — anything longer is junk data
const MIN_TIME_SEC = 3;

export interface WHReport {
  game: 'wh';
  cat: string;
  diff: Difficulty;
  level: number;
  timeSec: number;
  hintsUsed: number;
  wordsFound: number;
  wordLengths: number[];
}

export interface MMReport {
  game: 'mm';
  diff: Difficulty;
  level: number;
  pairs: number;
  moves: number;
  bestCombo: number;
  mistakes: number;
  usedPowerup?: boolean;
}

export type LevelReport = WHReport | MMReport;

export interface ValidationResult {
  ok: boolean;
  verified: boolean;
  reason?: string;
  rewards?: LevelRewards;
  events?: ActiveEvent[];
}

function isFiniteInt(n: unknown, min: number, max: number): n is number {
  return typeof n === 'number' && Number.isFinite(n) && Number.isInteger(n) && n >= min && n <= max;
}

function sanitizeEvents(events: unknown): ActiveEvent[] {
  // events may be supplied by the client for determinism — validate the shape,
  // otherwise recompute from the current clock
  if (!Array.isArray(events) || !events.length) return getActiveEvents();
  const clean: ActiveEvent[] = [];
  for (const e of events.slice(0, 3)) {
    if (e && typeof e === 'object' && typeof (e as ActiveEvent).id === 'string') {
      const ev: ActiveEvent = { id: (e as ActiveEvent).id as ActiveEvent['id'] };
      if (typeof (e as ActiveEvent).coins === 'number') ev.coins = (e as ActiveEvent).coins;
      if (typeof (e as ActiveEvent).xpWh === 'number') ev.xpWh = (e as ActiveEvent).xpWh;
      if (typeof (e as ActiveEvent).xpMm === 'number') ev.xpMm = (e as ActiveEvent).xpMm;
      clean.push(ev);
    }
  }
  return clean.length ? clean : getActiveEvents();
}

/** Validate + recompute a Word-Hunter result. */
export function validateWH(r: WHReport): ValidationResult {
  if (!DIFFS.includes(r.diff)) return { ok: false, verified: false, reason: 'bad_diff' };
  if (!isFiniteInt(r.level, 1, MAX_LEVEL)) return { ok: false, verified: false, reason: 'bad_level' };
  if (!isFiniteInt(r.timeSec, MIN_TIME_SEC, MAX_TIME_SEC)) return { ok: false, verified: false, reason: 'bad_time' };
  if (!isFiniteInt(r.hintsUsed, 0, 20) || !isFiniteInt(r.wordsFound, 0, MAX_WORDS_IN_LEVEL)) {
    return { ok: false, verified: false, reason: 'bad_counts' };
  }
  if (!Array.isArray(r.wordLengths) || r.wordLengths.length !== r.wordsFound) {
    return { ok: false, verified: false, reason: 'word_lengths_mismatch' };
  }
  for (const l of r.wordLengths) {
    if (!isFiniteInt(l, 3, 12)) return { ok: false, verified: false, reason: 'bad_word_length' };
  }
  const boss = r.level % 10 === 0;
  const rewards = computeWHRewards(
    r.diff,
    r.wordLengths,
    r.timeSec,
    r.hintsUsed,
    parTimeFor(r.diff, r.level),
    sanitizeEvents((r as unknown as { events?: unknown }).events),
    boss,
  );
  return { ok: true, verified: true, rewards };
}

/** Validate + recompute a Memory-Match result. */
export function validateMM(r: MMReport): ValidationResult {
  if (!DIFFS.includes(r.diff)) return { ok: false, verified: false, reason: 'bad_diff' };
  if (!isFiniteInt(r.level, 1, MAX_LEVEL)) return { ok: false, verified: false, reason: 'bad_level' };
  if (!isFiniteInt(r.pairs, 1, MAX_PAIRS)) return { ok: false, verified: false, reason: 'bad_pairs' };
  if (!isFiniteInt(r.moves, r.pairs, r.pairs * 200)) return { ok: false, verified: false, reason: 'bad_moves' };
  if (!isFiniteInt(r.bestCombo, 0, 50) || !isFiniteInt(r.mistakes, 0, 500)) {
    return { ok: false, verified: false, reason: 'bad_counts' };
  }
  // a flipped pair is 2 moves — fewer moves than pairs is impossible
  if (r.moves < r.pairs) return { ok: false, verified: false, reason: 'impossible_moves' };
  const boss = r.level % 10 === 0;
  const rewards = computeMMRewards(
    r.diff,
    r.pairs,
    r.moves,
    r.bestCombo,
    r.mistakes,
    sanitizeEvents((r as unknown as { events?: unknown }).events),
    boss,
  );
  return { ok: true, verified: true, rewards };
}

/** Mirror of the client par-time table (wordEngine parTime) — coarse bound only. */
function parTimeFor(diff: Difficulty, level: number): number {
  const base: Record<Difficulty, number> = { easy: 90, normal: 120, hard: 150, expert: 180 };
  return base[diff] + level * 4;
}

export function validateReport(body: unknown): ValidationResult {
  const r = body as LevelReport;
  if (!r || typeof r !== 'object') return { ok: false, verified: false, reason: 'bad_json' };
  return r.game === 'wh' ? validateWH(r) : r.game === 'mm' ? validateMM(r) : { ok: false, verified: false, reason: 'bad_game' };
}
