// ============ Word Game 3D — Core Types ============

export type Lang = 'fa' | 'en';
export type Difficulty = 'easy' | 'normal' | 'hard' | 'expert';
export type Screen =
  | 'lobby'
  | 'word-select'
  | 'word-game'
  | 'memory-select'
  | 'memory-game'
  | 'shop'
  | 'missions'
  | 'settings'
  | 'profile'
  | 'leaderboard';

export type CategoryId =
  | 'animals'
  | 'fruits'
  | 'food'
  | 'countries'
  | 'cities'
  | 'nature'
  | 'technology'
  | 'sports'
  | 'science'
  | 'movies'
  | 'general'
  | 'persianWords'
  | 'englishWords';

export const ALL_CATEGORIES: CategoryId[] = [
  'animals', 'fruits', 'food', 'countries', 'cities', 'nature',
  'technology', 'sports', 'science', 'movies', 'general',
  'persianWords', 'englishWords',
];

export const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard', 'expert'];

export type ThemeId = 'meadow' | 'ocean' | 'galaxy' | 'candy' | 'forest' | 'royal' | 'aurora';
export type AvatarId =
  | 'owl' | 'fox' | 'panda' | 'cat' | 'penguin'
  | 'lion' | 'frog' | 'unicorn' | 'robot' | 'dragon';
/** 9 card decks — exactly the image topics from the design doc */
export type DeckId =
  | 'animals' | 'fruits' | 'sweets' | 'fantasy'
  | 'vehicles' | 'objects' | 'emojis' | 'nature' | 'colorful';
export const ALL_DECKS: DeckId[] = [
  'animals', 'fruits', 'sweets', 'fantasy',
  'vehicles', 'objects', 'emojis', 'nature', 'colorful',
];

/** Boss Challenge level = every 10th level */
export const isBossLevel = (level: number) => level % 10 === 0;
export const LEVELS_PER_ZONE = 10;

// ---------- Word Hunter ----------
export interface CellPos { r: number; c: number }

export interface WordPlacement {
  word: string;
  cells: CellPos[];
  found: boolean;
}

export interface WordSearchPuzzle {
  size: number;
  grid: string[][]; // grid[r][c]
  placements: WordPlacement[];
  timeLimit?: number; // seconds — expert only
  parTime: number; // seconds — target time for speed bonus
}

// ---------- Memory Match ----------
export interface MemoryLevelConfig {
  pairs: number;
  cols: number;
  rows: number;
  timeLimit?: number;   // seconds — timed levels
  moveLimit?: number;   // boss levels only
  previewSec?: number;  // "memorize" phase at level start (3–5 s)
  boss: boolean;        // Boss Challenge (every 10th level)
}

// ---------- Progress ----------
export interface DifficultyProgress {
  unlocked: number; // highest unlocked level (1-based)
  stars: Record<number, number>; // level -> stars (0-3)
}

export interface WHCategoryProgress {
  [difficulty: string]: DifficultyProgress;
}

// ---------- Missions ----------
export type MissionEvent =
  | 'word_found'
  | 'wh_level'
  | 'mm_level'
  | 'pairs_matched'
  | 'coins_earned'
  | 'combo_reached'
  | 'no_hint_level'
  | 'perfect_level'
  | 'login';

export interface MissionDef {
  id: string;
  event: MissionEvent;
  target: number;
  coins: number;
  xp: number;
}

// ---------- Rewards ----------
export interface LevelRewards {
  coins: number;
  xp: number;
  baseCoins: number;
  noHintBonus: number;
  speedBonus: number;
  boxCoins: number;
  eventMultipliers: string[];
  stars: number;
  perfect: boolean;
}

// ---------- Shop ----------
export interface ShopItem {
  id: string;
  kind: 'avatar' | 'theme' | 'deck';
  refId: string;
  price: number;
}

// ---------- Daily reward (structured — coins / hint / chest) ----------
export type DailyReward =
  | { kind: 'coins'; coins: number }
  | { kind: 'hint'; n: number }
  | { kind: 'chest'; chest: 'wooden' | 'silver' | 'gold' };

// ---------- Bundles (بسته‌های پیشنهادی) ----------
export interface BundleContents {
  coins?: number;
  hints?: number;
  skin?: SkinId;
  char?: CharId;
  theme?: ThemeId;
}
export interface BundleDef {
  id: string;
  sku: string;        // in-app product id for the market console (بازار)
  priceToman: number; // real-money price in the market
  contents: BundleContents;
  price: number;      // bundle price (already discounted)
  value: number;      // total value if bought separately
  tint: string;       // gradient for the card
}

// ---------- Player profile & game history (بخش ۱۲ — پروفایل بازیکن) ----------
/** One finished game round — the profile's «تاریخچه بازی» feed.
 *  `tx` is a unique transaction id (anti-cheat: every result is traceable). */
export interface HistoryEntry {
  tx: string;
  game: 'wh' | 'mm';
  diff: Difficulty;
  level: number;
  stars: number;
  perfect: boolean;
  timeSec: number;
  coins: number;
  xp: number;
  at: number; // epoch ms
  verified: boolean; // rewards confirmed by the server validator
}

/** Best records shown on the profile (بهترین رکورد) */
export interface Records {
  fastestWhSec: number | null; // quickest single Word-Hunter clear
  fewestMmMoves: number | null; // fewest moves in one Memory level
  bestStreak: number; // best daily-login streak
}

/** Graphics quality (تنظیم کیفیت گرافیک — بخش ۱۶) */
export type Quality = 'low' | 'medium' | 'high';

/** Account (ورود با حساب کاربری / بازی مهمان) */
export interface AccountState {
  status: 'guest' | 'member';
  username: string | null;
  token: string | null;
  lastSync: number | null; // epoch ms of the last successful push/pull
}

// ---------- Cosmetic ids ----------
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type SkinId =
  | 'classic' | 'pastel' | 'oceanic' | 'neon'
  | 'golden' | 'galaxyT' | 'rainbow' | 'inferno'
  | 'vipRoyal';
export type BoardId = 'boardClassic' | 'paper' | 'darkBoard' | 'wood' | 'neonGrid';
export type BgId = 'bgDefault' | 'sunset' | 'night' | 'meadowHills' | 'underwater';
export type FxId = 'fxNone' | 'fxSparkle' | 'fxBubbles' | 'fxHearts' | 'fxStars';
export type CharId = 'mascot' | 'robokid' | 'dragonling' | 'fairy' | 'astro';
/** cosmetic kinds sold in the customization/skins tabs (avatars/themes/decks are legacy) */
export type CosmeticKind = 'skin' | 'board' | 'bg' | 'fx' | 'char';
