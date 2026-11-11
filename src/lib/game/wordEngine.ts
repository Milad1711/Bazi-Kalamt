// ============ Word Search Engine ============
import type { CellPos, Difficulty, Lang, CategoryId, WordSearchPuzzle } from './types';
import { isBossLevel } from './types';
import { getWordsFor } from './words';

// ---------- RNG ----------
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- Difficulty config ----------
export interface DiffConfig {
  size: number;
  minWords: number;
  maxWords: number;
  directions: [number, number][]; // (dr, dc)
  timeLimit?: number; // seconds, expert
  reversed: boolean;
}

const H = [0, 1] as [number, number];   // horizontal forward (natural reading dir)
const V = [1, 0] as [number, number];   // vertical down
const D1 = [1, 1] as [number, number];  // diagonal ↘
const D2 = [1, -1] as [number, number]; // diagonal ↙
const H2 = [0, -1] as [number, number]; // horizontal reversed
const V2 = [-1, 0] as [number, number]; // vertical up
const D3 = [-1, -1] as [number, number];
const D4 = [-1, 1] as [number, number];

export const DIFF_CONFIG: Record<Difficulty, DiffConfig> = {
  easy:   { size: 5,  minWords: 3,  maxWords: 5,  directions: [H, V, D1, D2], reversed: false },
  normal: { size: 7,  minWords: 6,  maxWords: 8,  directions: [H, V, D1, D2], reversed: false },
  hard:   { size: 9,  minWords: 9,  maxWords: 12, directions: [H, V, D1, D2, H2, V2, D3, D4], reversed: true },
  expert: { size: 12, minWords: 12, maxWords: 18, directions: [H, V, D1, D2, H2, V2, D3, D4], reversed: true },
};

export function wordCountFor(difficulty: Difficulty, level: number): number {
  const { minWords, maxWords } = DIFF_CONFIG[difficulty];
  const span = maxWords - minWords + 1;
  let count = minWords + ((level - 1) % span);
  if (isBossLevel(level)) count = Math.min(maxWords + 2, count + 2); // Boss Challenge: extra words
  return count;
}

// ---------- Generation ----------
export interface GeneratedPuzzle {
  puzzle: WordSearchPuzzle;
  usedWords: string[];
}

/**
 * Generate a word search puzzle.
 * Anti-repetition: pass recently used words to exclude them when possible.
 */
export function generateWordSearch(
  category: CategoryId,
  difficulty: Difficulty,
  level: number,
  lang: Lang,
  recentlyUsed: string[] = [],
  seed = Date.now(),
): GeneratedPuzzle {
  const cfg = DIFF_CONFIG[difficulty];
  const size = cfg.size;
  const rand = mulberry32(seed + level * 7919 + category.length * 104729);
  const targetCount = wordCountFor(difficulty, level);

  // orientation coverage: every puzzle must mix horizontal, vertical and
  // diagonal words (never a purely vertical grid). The first placements get
  // one orientation each (random order, scanning all candidates until one
  // fits); the remaining slots are filled freely.
  const dirsH = cfg.directions.filter(([dr, dc]) => dr === 0 && dc !== 0);
  const dirsV = cfg.directions.filter(([dr, dc]) => dr !== 0 && dc === 0);
  const dirsD = cfg.directions.filter(([dr, dc]) => dr !== 0 && dc !== 0);
  const coverageDirs = shuffle([dirsH, dirsV, dirsD].filter((d) => d.length > 0), rand);

  // candidate words: fit grid, exclude recently used when we have enough margin
  const all = getWordsFor(category, lang).filter((w) => w.length >= 3 && w.length <= size);
  const usedSet = new Set(recentlyUsed);
  let candidates = all.filter((w) => !usedSet.has(w));
  if (candidates.length < targetCount + 4) candidates = all; // fall back to full bank

  // prefer longer words at higher levels / expert
  candidates = shuffle(candidates, rand);
  if (difficulty === 'expert' || difficulty === 'hard') {
    candidates.sort((a, b) => b.length - a.length);
    // keep some randomness: take from top-60% randomly
    const keep = Math.max(targetCount * 2, Math.floor(candidates.length * 0.6));
    candidates = shuffle(candidates.slice(0, keep), rand);
  }

  const grid: (string | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));
  const placements: WordSearchPuzzle['placements'] = [];
  const chosen: string[] = [];

  const placeWord = (word: string, dirs: [number, number][], attempts = 220) => {
    const cells = tryPlace(grid, word, dirs, size, rand, attempts);
    if (cells) {
      placements.push({ word, cells, found: false });
      chosen.push(word);
    }
    return !!cells;
  };

  // phase 1 — guaranteed orientation coverage (horizontal + vertical + diagonal)
  for (const dirs of coverageDirs) {
    if (chosen.length >= targetCount) break;
    for (const word of candidates) {
      if (chosen.includes(word)) continue;
      if (placeWord(word, dirs, 400)) break;
    }
  }
  // phase 2 — fill remaining slots with any allowed direction
  for (const word of candidates) {
    if (chosen.length >= targetCount) break;
    if (chosen.includes(word)) continue;
    placeWord(word, cfg.directions);
  }
  // fallback: if grid couldn't fill (very rare), retry harder with full bank
  if (chosen.length < cfg.minWords) {
    for (const word of shuffle(all, rand)) {
      if (chosen.length >= targetCount) break;
      if (chosen.includes(word)) continue;
      const placed = tryPlace(grid, word, cfg.directions, size, rand, 800);
      if (placed) {
        placements.push({ word, cells: placed, found: false });
        chosen.push(word);
      }
    }
  }

  // letter frequency for natural-looking fill
  const freq = new Map<string, number>();
  for (const w of getWordsFor(category, lang)) {
    for (const ch of w) freq.set(ch, (freq.get(ch) ?? 0) + 1);
  }
  const freqLetters: string[] = [];
  for (const [ch, n] of freq) for (let i = 0; i < n; i++) freqLetters.push(ch);
  const fillPool = freqLetters.length > 40 ? freqLetters : 'اآبپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی'.split('');

  const finalGrid: string[][] = grid.map((row) =>
    row.map((cell) => cell ?? fillPool[Math.floor(rand() * fillPool.length)]),
  );

  const totalLetters = chosen.reduce((s, w) => s + w.length, 0);
  const parTime = Math.max(60, Math.round(totalLetters * 4.5 + 25));
  let timeLimit = difficulty === 'expert' ? Math.round(chosen.length * 22 + 60) : undefined;
  if (timeLimit && isBossLevel(level)) timeLimit = Math.round(timeLimit * 0.85); // boss: tighter clock

  return {
    puzzle: { size, grid: finalGrid, placements, timeLimit, parTime },
    usedWords: chosen,
  };
}

function tryPlace(
  grid: (string | null)[][],
  word: string,
  directions: [number, number][],
  size: number,
  rand: () => number,
  attempts = 220,
): CellPos[] | null {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const [dr, dc] = directions[Math.floor(rand() * directions.length)];
    const r0 = Math.floor(rand() * size);
    const c0 = Math.floor(rand() * size);
    const rEnd = r0 + dr * (word.length - 1);
    const cEnd = c0 + dc * (word.length - 1);
    if (rEnd < 0 || rEnd >= size || cEnd < 0 || cEnd >= size) continue;
    const cells: CellPos[] = [];
    let ok = true;
    for (let i = 0; i < word.length; i++) {
      const r = r0 + dr * i;
      const c = c0 + dc * i;
      const cell = grid[r][c];
      if (cell !== null && cell !== word[i]) { ok = false; break; }
      cells.push({ r, c });
    }
    if (ok) {
      for (let i = 0; i < word.length; i++) grid[cells[i].r][cells[i].c] = word[i];
      return cells;
    }
  }
  return null;
}

// ---------- Selection path helpers ----------
const UNIT_DIRS: [number, number][] = [
  [0, 1], [1, 0], [1, 1], [1, -1],
  [0, -1], [-1, 0], [-1, -1], [-1, 1],
];

/** Snap a delta to the nearest valid unit direction */
export function snapDirection(dr: number, dc: number): [number, number] {
  if (dr === 0 && dc === 0) return [0, 0];
  const sr = Math.sign(dr);
  const sc = Math.sign(dc);
  return [sr, sc];
}

/** Build selection path from start cell to current cell (direction-locked) */
export function buildPath(start: CellPos, current: CellPos, size: number): CellPos[] {
  const dr = current.r - start.r;
  const dc = current.c - start.c;
  if (dr === 0 && dc === 0) return [start];
  const [ur, uc] = snapDirection(dr, dc);
  // project delta onto direction
  const proj = Math.max(Math.abs(dr), Math.abs(dc));
  const path: CellPos[] = [];
  for (let i = 0; i <= proj; i++) {
    const r = start.r + ur * i;
    const c = start.c + uc * i;
    if (r < 0 || r >= size || c < 0 || c >= size) break;
    path.push({ r, c });
  }
  return path;
}

export function pathWord(grid: string[][], path: CellPos[]): string {
  return path.map((p) => grid[p.r][p.c]).join('');
}

export const WORD_LINE_COLORS = [
  '#f97316', '#22c55e', '#eab308', '#a855f7', '#06b6d4',
  '#ec4899', '#84cc16', '#f43f5e', '#3b82f6', '#14b8a6',
  '#f59e0b', '#8b5cf6', '#10b981', '#ef4444', '#6366f1', '#d946ef', '#0ea5e9', '#facc15',
];
