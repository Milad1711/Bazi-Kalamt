// ============ Memory Match Engine ============
import type { DeckId, Difficulty, MemoryLevelConfig } from './types';
import { isBossLevel } from './types';
import { mulberry32 } from './wordEngine';

/**
 * Card faces per deck. Entries are either SVG icon ids (drawn in art.tsx)
 * or raw emoji characters (rendered through the emoji fallback in GameIcon).
 * Every deck carries at least 20 icons so even Expert (20 pairs) never repeats.
 */
export const DECK_ICONS: Record<DeckId, string[]> = {
  animals: [
    'owl', 'fox', 'panda', 'cat', 'penguin', 'lion', 'frog', 'unicorn', 'robot', 'dragon', 'monkey', 'bunny',
    '🐯', '🐷', '🐮', '🐔', '🦜', '🐬', '🐢', '🐝',
  ],
  fruits: [
    'apple', 'banana', 'cherry', 'strawberry', 'orange', 'watermelon', 'grape', 'pineapple', 'pear', 'lemon', 'kiwi', 'peach',
    '🥭', '🥥', '🫐', '🍅', '🥑', '🥕', '🌽', '🥦',
  ],
  sweets: [
    'candy', 'lollipop', 'cupcake', 'donut', 'icecream', 'cookie', 'cake', 'chocolate', 'gum', 'pie', 'brownie', 'macaron',
    '🍿', '🥨', '🍮', '🍨', '🍹', '🍬', '☕', '🧊',
  ],
  fantasy: [
    'mblue', 'mgreen', 'mpink', 'mpurple', 'morange', 'mteal', 'mred', 'myellow', 'mcyan', 'mlime', 'mmagenta', 'mbrown',
    'unicorn', 'dragon', '🧙', '🧚', '🧜', '🥷', '🧞', '👻',
  ],
  vehicles: [
    '🚗', '🚕', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚚', '🚜',
    '🚲', '🛴', '🏍️', '🚂', '✈️', '🚁', '⛵', '🚤', '🛺', '🛸',
  ],
  objects: [
    '🎒', '🎩', '👑', '👓', '🕶️', '⌚', '📱', '💻', '📷', '🔋',
    '💡', '🔑', '🔨', '🧲', '🧦', '🧤', '☂️', '🪑', '🚪', '🧸',
  ],
  emojis: [
    '😀', '😂', '😍', '😎', '🥳', '🤔', '😴', '😭', '😡', '🤯',
    '🥶', '🤠', '😇', '🤗', '🤫', '🤪', '🥰', '😱', '🤓', '😬',
  ],
  nature: [
    '🌸', '🌼', '🌻', '🌷', '🌵', '🌴', '🍀', '🍁', '🍂', '🍃',
    '🌞', '🌙', '⭐', '☁️', '⚡', '❄️', '🔥', '🌊', '🌋', '⛰️',
  ],
  colorful: [
    '🌈', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '🎈', '🎊', '🎉',
    '🎆', '🎇', '🎀', '🎁', '🎨', '🖍️', '✨', '💎', '🪄', '🧿',
  ],
};

/** Fixed pair counts straight from the design doc (cards = pairs × 2) */
const PAIRS: Record<Difficulty, number> = { easy: 5, normal: 10, hard: 15, expert: 20 };
const COLS: Record<Difficulty, number> = { easy: 5, normal: 5, hard: 6, expert: 8 };

/** Some levels start with a 3–5 s "memorize" phase (design doc special feature) */
function previewFor(level: number): number | undefined {
  const hasPreview = level <= 2 || (level - 1) % 4 === 0; // levels 1, 2, 5, 9, 13, …
  if (!hasPreview) return undefined;
  return Math.max(3, 5 - Math.floor((level - 1) / 25)); // 5s → 4s → 3s as levels climb
}

export function memoryLevelConfig(difficulty: Difficulty, level: number): MemoryLevelConfig {
  const pairs = PAIRS[difficulty];
  const cards = pairs * 2;
  const cols = COLS[difficulty];
  const rows = Math.ceil(cards / cols);
  const boss = isBossLevel(level);

  // Time pressure grows with difficulty (easy stays relaxed)
  let timeLimit: number | undefined;
  if (difficulty === 'expert') timeLimit = pairs * 13 + 20;
  else if (difficulty === 'hard') timeLimit = pairs * 14 + 30;
  else if (difficulty === 'normal' && level >= 6) timeLimit = pairs * 20 + 40;
  if (timeLimit && boss) timeLimit = Math.round(timeLimit * 0.85);

  // Boss Challenge: moves are limited (design doc — "محدودیت تعداد حرکت در مراحل ویژه")
  const moveLimit = boss ? Math.ceil(pairs * 1.6) + 1 : undefined;

  return { pairs, cols, rows, timeLimit, moveLimit, previewSec: previewFor(level), boss };
}

export interface MemoryCard {
  id: number;        // unique per card instance
  icon: string;      // deck icon id (SVG slug or emoji char)
  matched: boolean;
}

export function buildMemoryCards(deck: DeckId, pairs: number, seed = Date.now()): MemoryCard[] {
  const rand = mulberry32(seed);
  const pool = [...DECK_ICONS[deck]];
  // shuffle & pick
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const icons = pool.slice(0, pairs);
  const cards: MemoryCard[] = [];
  icons.forEach((icon) => {
    cards.push({ id: cards.length, icon, matched: false });
    cards.push({ id: cards.length, icon, matched: false });
  });
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards.map((c, i) => ({ ...c, id: i }));
}

export const TOTAL_MM_LEVELS = 100;
export const TOTAL_WH_LEVELS = 100;
