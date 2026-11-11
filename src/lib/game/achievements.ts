// ============ Achievements — one-time milestone rewards ============
// Progress is always *derived* from profile state (no separate tracking needed).
import type { LevelUpEvent } from './store';

export interface AchCtx {
  stats: {
    wordsFound: number; whLevels: number; whPerfects: number;
    pairsMatched: number; mmLevels: number; mmPerfects: number; bestCombo: number;
    noHintLevels: number;
  };
  level: number;
  streak: number;
  ownedCount: number; // cosmetic items owned (avatars+themes+decks+skins+boards+bgs+fx+chars)
  skinsOwned: number; // skins only (جمع‌آوری اسکین)
  tourTop3: boolean;  // ever finished a tournament week in top 3
  tourWins: number;   // finished a tournament week rank 1
}

export interface AchievementDef {
  id: string;
  tier: 'bronze' | 'silver' | 'gold';
  target: number;
  coins: number;
  xp: number;
  /** exclusive reward beyond coins/xp (هر دستاورد جایزه اختصاصی داشته باشد) */
  bonus?: { hints?: number; chest?: 'wooden' | 'silver' | 'gold' };
  progress: (c: AchCtx) => number;
}

/**
 * Section 11 spec achievements (marked ◆) + extended tiers:
 *  ◆ اولین پیروزی، ۱۰۰ کلمه، ۵۰ مرحله، ۱۰۰ جفت، ۱۰ مرحله بدون راهنما،
 *    سطح ۱۰، جمع‌آوری ۱۰ اسکین — هر کدام با جایزه اختصاصی.
 */
export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'a_first_level', tier: 'bronze', target: 1, coins: 50, xp: 40, progress: (c) => c.stats.whLevels + c.stats.mmLevels }, // ◆ اولین پیروزی
  { id: 'a_levels25', tier: 'bronze', target: 25, coins: 150, xp: 120, progress: (c) => c.stats.whLevels + c.stats.mmLevels },
  { id: 'a_levels50', tier: 'bronze', target: 50, coins: 260, xp: 180, bonus: { hints: 1 }, progress: (c) => c.stats.whLevels + c.stats.mmLevels }, // ◆ ۵۰ مرحله
  { id: 'a_levels100', tier: 'silver', target: 100, coins: 400, xp: 300, progress: (c) => c.stats.whLevels + c.stats.mmLevels },
  { id: 'a_words100', tier: 'bronze', target: 100, coins: 120, xp: 100, progress: (c) => c.stats.wordsFound }, // ◆ ۱۰۰ کلمه
  { id: 'a_words1000', tier: 'silver', target: 1000, coins: 500, xp: 350, progress: (c) => c.stats.wordsFound },
  { id: 'a_words5000', tier: 'gold', target: 5000, coins: 1200, xp: 800, progress: (c) => c.stats.wordsFound },
  { id: 'a_pairs100', tier: 'bronze', target: 100, coins: 130, xp: 100, bonus: { chest: 'wooden' }, progress: (c) => c.stats.pairsMatched }, // ◆ ۱۰۰ جفت
  { id: 'a_pairs250', tier: 'bronze', target: 250, coins: 150, xp: 120, progress: (c) => c.stats.pairsMatched },
  { id: 'a_pairs1500', tier: 'silver', target: 1500, coins: 500, xp: 350, progress: (c) => c.stats.pairsMatched },
  { id: 'a_combo5', tier: 'bronze', target: 5, coins: 100, xp: 90, progress: (c) => c.stats.bestCombo },
  { id: 'a_combo10', tier: 'gold', target: 10, coins: 450, xp: 320, progress: (c) => c.stats.bestCombo },
  { id: 'a_nohint10', tier: 'silver', target: 10, coins: 240, xp: 180, bonus: { hints: 3 }, progress: (c) => c.stats.noHintLevels }, // ◆ ۱۰ مرحله بدون راهنما
  { id: 'a_perfect10', tier: 'silver', target: 10, coins: 250, xp: 200, progress: (c) => c.stats.whPerfects + c.stats.mmPerfects },
  { id: 'a_perfect50', tier: 'gold', target: 50, coins: 700, xp: 500, progress: (c) => c.stats.whPerfects + c.stats.mmPerfects },
  { id: 'a_level10', tier: 'silver', target: 10, coins: 200, xp: 150, bonus: { chest: 'silver' }, progress: (c) => c.level }, // ◆ سطح ۱۰
  { id: 'a_level25', tier: 'gold', target: 25, coins: 600, xp: 450, progress: (c) => c.level },
  { id: 'a_streak7', tier: 'silver', target: 7, coins: 300, xp: 220, progress: (c) => c.streak },
  { id: 'a_skins10', tier: 'silver', target: 10, coins: 350, xp: 260, bonus: { hints: 2 }, progress: (c) => c.skinsOwned }, // ◆ جمع‌آوری ۱۰ اسکین
  { id: 'a_collector5', tier: 'bronze', target: 5, coins: 200, xp: 150, progress: (c) => c.ownedCount },
  { id: 'a_collector15', tier: 'silver', target: 15, coins: 500, xp: 350, progress: (c) => c.ownedCount },
  { id: 'a_collector30', tier: 'gold', target: 30, coins: 1000, xp: 700, progress: (c) => c.ownedCount },
  { id: 'a_tour_top3', tier: 'silver', target: 1, coins: 400, xp: 300, progress: (c) => (c.tourTop3 ? 1 : 0) },
  { id: 'a_tour_win', tier: 'gold', target: 1, coins: 800, xp: 600, progress: (c) => (c.tourWins ? 1 : 0) },
];

export const TIER_STYLE: Record<AchievementDef['tier'], { grad: string; ink: string }> = {
  bronze: { grad: 'linear-gradient(180deg,#e8c39e,#bf8a55)', ink: '#6d4320' },
  silver: { grad: 'linear-gradient(180deg,#eceff1,#a7b8c4)', ink: '#475661' },
  gold: { grad: 'linear-gradient(180deg,#ffe082,#f5a300)', ink: '#7a5200' },
};

export function achLabel(id: string, lang: 'fa' | 'en', n: number): string {
  return lang === 'fa' ? (ACH_FA[id] ?? id).replace('{n}', faNum(n)) : (ACH_EN[id] ?? id).replace('{n}', String(n));
}

function faNum(n: number): string {
  return n.toLocaleString('fa-IR');
}

const ACH_FA: Record<string, string> = {
  a_first_level: 'اولین پیروزی‌ات را جشن بگیر',
  a_levels25: '{n} مرحله کامل کن',
  a_levels50: '{n} مرحله کامل کن',
  a_levels100: '{n} مرحله کامل کن',
  a_words100: '{n} کلمه پیدا کن',
  a_words1000: '{n} کلمه پیدا کن',
  a_words5000: '{n} کلمه پیدا کن',
  a_pairs100: '{n} جفت کارت پیدا کن',
  a_pairs250: '{n} جفت کارت پیدا کن',
  a_pairs1500: '{n} جفت کارت پیدا کن',
  a_combo5: 'به کمبوی {n} برس',
  a_combo10: 'به کمبوی {n} برس',
  a_nohint10: '{n} مرحله را بدون راهنما کامل کن',
  a_perfect10: '{n} مرحله بی‌نقص انجام بده',
  a_perfect50: '{n} مرحله بی‌نقص انجام بده',
  a_level10: 'به سطح بازیکن {n} برس',
  a_level25: 'به سطح بازیکن {n} برس',
  a_streak7: '{n} روز پیوسته جایزه بگیر',
  a_skins10: '{n} اسکین مختلف جمع کن',
  a_collector5: '{n} آیتم فروشگاهی جمع کن',
  a_collector15: '{n} آیتم فروشگاهی جمع کن',
  a_collector30: '{n} آیتم فروشگاهی جمع کن',
  a_tour_top3: 'در مسابقه هفتگی جزو ۳ نفر اول شو',
  a_tour_win: 'قهرمان مسابقه هفتگی شو',
};

const ACH_EN: Record<string, string> = {
  a_first_level: 'Celebrate your first win',
  a_levels25: 'Complete {n} levels',
  a_levels50: 'Complete {n} levels',
  a_levels100: 'Complete {n} levels',
  a_words100: 'Find {n} words',
  a_words1000: 'Find {n} words',
  a_words5000: 'Find {n} words',
  a_pairs100: 'Match {n} pairs',
  a_pairs250: 'Match {n} pairs',
  a_pairs1500: 'Match {n} pairs',
  a_combo5: 'Reach a ×{n} combo',
  a_combo10: 'Reach a ×{n} combo',
  a_nohint10: 'Finish {n} levels without hints',
  a_perfect10: 'Finish {n} perfect levels',
  a_perfect50: 'Finish {n} perfect levels',
  a_level10: 'Reach player level {n}',
  a_level25: 'Reach player level {n}',
  a_streak7: 'Claim the daily reward {n} days in a row',
  a_skins10: 'Collect {n} different skins',
  a_collector5: 'Collect {n} shop items',
  a_collector15: 'Collect {n} shop items',
  a_collector30: 'Collect {n} shop items',
  a_tour_top3: 'Reach the top 3 in the weekly tournament',
  a_tour_win: 'Win the weekly tournament',
};

export type AchClaimResult = { coins: number; events: LevelUpEvent[] };
