// ============ Weekly Tournament — friendly competition vs simulated rivals ============
// Fair-play design: bots are deterministic per-week; playing levels always moves you up.
// Everyone gets a reward at rollover — no punishment, no pay-to-win.

export interface BotDef { name: string; avatar: string }

/** Rival roster (fa/en names) */
export const BOTS: { id: string; fa: string; en: string; avatar: string }[] = [
  { id: 'b1', fa: 'آرش', en: 'Arash', avatar: 'fox' },
  { id: 'b2', fa: 'سارا', en: 'Sara', avatar: 'cat' },
  { id: 'b3', fa: 'کیانا', en: 'Kiana', avatar: 'penguin' },
  { id: 'b4', fa: 'بردیا', en: 'Bardia', avatar: 'frog' },
  { id: 'b5', fa: 'مهسا', en: 'Mahsa', avatar: 'panda' },
  { id: 'b6', fa: 'رستا', en: 'Rasta', avatar: 'unicorn' },
  { id: 'b7', fa: 'پویا', en: 'Pouya', avatar: 'lion' },
  { id: 'b8', fa: 'درنا', en: 'Dorna', avatar: 'robot' },
  { id: 'b9', fa: 'سهیل', en: 'Sohail', avatar: 'dragon' },
  { id: 'b10', fa: 'نیلوفر', en: 'Niloufar', avatar: 'owl' },
  { id: 'b11', fa: 'کاوه', en: 'Kaveh', avatar: 'fox' },
  { id: 'b12', fa: 'ترانه', en: 'Taraneh', avatar: 'cat' },
];

/** Final bot scores for a given week (deterministic from week key) */
export function botScores(wk: string): number[] {
  let t = 2166136261;
  for (let i = 0; i < wk.length; i++) {
    t ^= wk.charCodeAt(i);
    t = Math.imul(t, 16777619);
  }
  const rand = () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
  const base = [1650, 1250, 980, 790, 640, 520, 420, 330, 250, 180, 120, 70];
  const factor = 0.85 + rand() * 0.35; // week difficulty factor
  return base.map((b) => Math.round((b * factor) / 10) * 10);
}

/** Rank of a score against the week's bots (1 = first) */
export function rankOf(points: number, wk: string): number {
  const scores = botScores(wk);
  return 1 + scores.filter((s) => s > points).length;
}

/** Rollover reward by final rank — every participant earns something (no punishment) */
export function tournamentReward(rank: number): { coins: number; chest?: 'silver' | 'gold' } {
  if (rank <= 1) return { coins: 600, chest: 'gold' };
  if (rank <= 3) return { coins: 400, chest: 'silver' };
  if (rank <= 6) return { coins: 220 };
  return { coins: 100 };
}

/** Live milestone rewards claimable during the week (progress-preserving) */
export const TOUR_MILESTONES: { points: number; coins: number }[] = [
  { points: 150, coins: 100 },
  { points: 400, coins: 200 },
  { points: 800, coins: 350 },
  { points: 1400, coins: 500 },
];

/** Points earned for one completed level */
export function tournamentPoints(stars: number, perfect: boolean, boss: boolean): number {
  return stars * 15 + (perfect ? 20 : 0) + (boss ? 30 : 0);
}
