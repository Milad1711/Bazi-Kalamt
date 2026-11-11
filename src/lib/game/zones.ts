// ============ Adventure Zones — a new environment every 10 levels ============
import type { Lang } from './types';
import { LEVELS_PER_ZONE } from './types';

export interface Zone {
  id: string;
  fa: string;
  en: string;
  icon: string;           // emoji shown on the zone banner/chip
  grad: [string, string]; // zone banner gradient
  node: string;           // node accent for normal levels in this zone
}

/** 10 zones × 10 levels = 100 levels per game */
export const ZONES: Zone[] = [
  { id: 'meadow',   fa: 'دشت سبز',        en: 'Verdant Meadow',  icon: '🌿',  grad: ['#a8e063', '#56ab2f'], node: '#56ab2f' },
  { id: 'bay',      fa: 'خلیج فیروزه‌ای', en: 'Azure Bay',       icon: '🌊',  grad: ['#6dd5ed', '#2193b0'], node: '#2193b0' },
  { id: 'forest',   fa: 'جنگل اسرارآمیز', en: 'Mystic Forest',   icon: '🌳',  grad: ['#83a4d4', '#2f5d50'], node: '#2f5d50' },
  { id: 'desert',   fa: 'کویر طلایی',     en: 'Golden Desert',   icon: '🏜️',  grad: ['#f6d365', '#d68b0c'], node: '#c47f0a' },
  { id: 'candy',    fa: 'سرزمین شیرینی',  en: 'Candy Land',      icon: '🍭',  grad: ['#ffb6e1', '#f26fb1'], node: '#e75fa8' },
  { id: 'ice',      fa: 'قلعه یخی',       en: 'Frost Citadel',   icon: '❄️',  grad: ['#c1e8ff', '#5aa9e6'], node: '#4a90d9' },
  { id: 'sky',      fa: 'جزایر ابری',     en: 'Sky Isles',       icon: '☁️',  grad: ['#e0c3fc', '#8ec5fc'], node: '#7aa8e0' },
  { id: 'galaxy',   fa: 'کهکشان بنفش',    en: 'Violet Galaxy',   icon: '🪐',  grad: ['#a18cd1', '#5b247a'], node: '#5b247a' },
  { id: 'volcano',  fa: 'آتشفشان غرغرو',  en: 'Roaring Volcano', icon: '🌋',  grad: ['#f83600', '#93261f'], node: '#a32b23' },
  { id: 'crystal',  fa: 'برج بلور',       en: 'Crystal Spire',   icon: '💎',  grad: ['#8ec5ff', '#c86dd7'], node: '#8e5bd0' },
];

export const TOTAL_ZONES = ZONES.length;

export function zoneIndexForLevel(level: number): number {
  return Math.min(ZONES.length - 1, Math.max(0, Math.floor((level - 1) / LEVELS_PER_ZONE)));
}

export function zoneForLevel(level: number): Zone {
  return ZONES[zoneIndexForLevel(level)];
}

export function zoneName(z: Zone, lang: Lang): string {
  return lang === 'fa' ? z.fa : z.en;
}

/** Zone z (0-based) is reachable when the player unlocked its first level */
export function zoneUnlocked(unlockedLevel: number, z: number): boolean {
  return unlockedLevel >= z * LEVELS_PER_ZONE + 1;
}
