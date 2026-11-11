// ============ Game Store (zustand + localStorage persistence) ============
'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  AccountState, AvatarId, CategoryId, CosmeticKind, DailyReward, DeckId, Difficulty, HistoryEntry, Lang, LevelRewards, Quality, Records, ThemeId,
} from './types';
import {
  AVATAR_UNLOCK_LEVEL, LEVELUP_COINS, levelFromXp, dailyRewardFor,
  VIP_DAYS, AD_REWARD_COINS, AD_DAILY_LIMIT, SPIN_SEGMENTS,
} from './economy';
import { todayMissionIds, weekKey, weekMissionIds, DAILY_CORE, VIP_MISSION, ALL_MISSIONS, WEEKLY_POOL } from './missions';
import { ACHIEVEMENTS, type AchCtx } from './achievements';
import {
  SKINS, BOARDS, BGS, FXS, CHARS, COIN_PACKS, packTotalCoins, BUNDLES,
  CHESTS, CHEST_STEP_LEVELS, CHESTS_PENDING_CAP, rollChestKind,
} from './shop';
import { rankOf, tournamentReward, TOUR_MILESTONES, tournamentPoints } from './tournament';
import { TOTAL_MM_LEVELS, TOTAL_WH_LEVELS } from './memoryEngine';
import { audio } from './audio';
import { reportDelta, reconcileBalance, verifyPurchase, validateLevelResult } from './server-economy';
import { apiRegister, apiLogin, apiPushSnapshot, apiPullSnapshot, authErrorKey } from './account';

// ---------- storage migration: carry saves over from the pre-rebrand key ----------
if (typeof window !== 'undefined' && !localStorage.getItem('word-game-3d-v1')) {
  const legacy = localStorage.getItem('brain-quest-3d-v1');
  if (legacy) localStorage.setItem('word-game-3d-v1', legacy);
}

// ---------- Shop catalog (legacy kinds) ----------
export const SHOP_AVATARS: { id: AvatarId; price: number }[] = [
  { id: 'owl', price: 0 }, { id: 'fox', price: 300 }, { id: 'cat', price: 350 },
  { id: 'frog', price: 400 }, { id: 'panda', price: 500 }, { id: 'penguin', price: 600 },
  { id: 'lion', price: 750 }, { id: 'robot', price: 900 }, { id: 'unicorn', price: 1200 },
  { id: 'dragon', price: 1500 },
];
export const SHOP_THEMES: { id: ThemeId; price: number; vipOnly?: boolean }[] = [
  { id: 'meadow', price: 0 }, { id: 'ocean', price: 400 }, { id: 'candy', price: 500 },
  { id: 'forest', price: 600 }, { id: 'galaxy', price: 800 },
  // تم‌های اختصاصی VIP — granted with the subscription (دسترسی به تم‌های خاص)
  { id: 'royal', price: 0, vipOnly: true },
  { id: 'aurora', price: 0, vipOnly: true },
];
export const SHOP_DECKS: { id: DeckId; price: number }[] = [
  { id: 'animals', price: 0 }, { id: 'fruits', price: 0 }, { id: 'sweets', price: 500 },
  { id: 'fantasy', price: 600 }, { id: 'nature', price: 650 }, { id: 'vehicles', price: 700 },
  { id: 'objects', price: 750 }, { id: 'emojis', price: 800 }, { id: 'colorful', price: 900 },
];

export interface LevelUpEvent { level: number; coins: number; unlockedAvatar?: AvatarId }

export interface WHRecordResult {
  rewards: LevelRewards;
  wordsFound: number;
  usedWords: string[];
  newBest: boolean;
}

export interface OpenedChest { kind: 'wooden' | 'silver' | 'gold'; coins: number }

type OwnedMap = Record<CosmeticKind, string[]>;
type EquippedMap = Record<CosmeticKind, string>;

const DEFAULT_OWNED: OwnedMap = {
  skin: ['classic'],
  board: ['boardClassic'],
  bg: ['bgDefault'],
  fx: ['fxNone', 'fxSparkle'],
  char: ['mascot'],
};
const DEFAULT_EQUIPPED: EquippedMap = {
  skin: 'classic',
  board: 'boardClassic',
  bg: 'bgDefault',
  fx: 'fxSparkle',
  char: 'mascot',
};

const COSMETIC_CATALOG: Record<CosmeticKind, { id: string; price: number }[]> = {
  skin: SKINS, board: BOARDS, bg: BGS, fx: FXS, char: CHARS,
};

interface GameStore {
  hydrated: boolean;
  // profile
  name: string;
  avatar: AvatarId;
  onboarded: boolean;
  xp: number;
  coins: number;
  // VIP subscription (اشتراک VIP)
  vipUntil: number | null; // epoch ms — active while > Date.now()
  hintTokens: number; // free hints (daily reward day 5, achievements, bundles)
  bundlesOwned: string[];
  // optional rewarded ads (consent-only) — usage counter
  adDay: string | null;
  adCount: number;
  // settings
  lang: Lang;
  music: boolean;
  sfx: boolean;
  haptics: boolean;
  // cosmetics — legacy kinds
  ownedAvatars: AvatarId[];
  ownedThemes: ThemeId[];
  ownedDecks: DeckId[];
  theme: ThemeId;
  deck: DeckId;
  // cosmetics — new kinds
  owned: OwnedMap;
  equipped: EquippedMap;
  // progress
  whUnlocked: Record<string, Record<string, number>>; // cat -> diff -> unlocked level
  whStars: Record<string, number>; // `${cat}:${diff}:${level}` -> stars
  mmUnlocked: Record<string, number>; // diff -> unlocked level
  mmStars: Record<string, number>; // `${diff}:${level}` -> stars
  whUsedWords: Record<string, string[]>; // `${lang}:${cat}` -> recent words
  // stats
  stats: {
    wordsFound: number; whLevels: number; whPerfects: number;
    pairsMatched: number; mmLevels: number; mmPerfects: number; bestCombo: number;
    noHintLevels: number;
  };
  // daily & gift
  dailyLastClaim: string | null;
  dailyStreakDay: string | null;
  dailyStreak: number;
  freeGiftDay: string | null;
  spinDay: string | null; // daily spin wheel (چرخ شانس روزانه) — last spin date
  // daily missions
  missionDay: string;
  missionIds: string[];
  missionProgress: Record<string, number>;
  missionClaimed: string[];
  // weekly missions
  week: string;
  weeklyIds: string[];
  weeklyProgress: Record<string, number>;
  weeklyClaimed: string[];
  // achievements
  achClaimed: string[];
  // tournament
  tourWeek: string;
  tourPoints: number;
  tourMilestonesClaimed: number;
  tourPrevWeek: string | null;
  tourPrevPoints: number;
  tourPrevRank: number;
  tourPrevCoins: number;
  tourPrevChest: 'silver' | 'gold' | null;
  tourPrevClaimed: boolean;
  tourBestRank: number;
  tourWins: number;
  // chests
  chestProgress: number;
  chestsPending: ('wooden' | 'silver' | 'gold')[];
  // profile & history (بخش ۱۲)
  history: HistoryEntry[];
  records: Records;
  // account (مهمان / عضو) + sync
  account: AccountState;
  // leaderboard friends (جدول دوستان)
  friendIds: string[];
  // graphics quality (بخش ۱۶)
  quality: Quality;
  // display scale (تنظیمات — اندازه جدول و فونت، قابل تغییر توسط بازیکن)
  gridScale: number;   // 0.85 (کوچک) | 1 (متوسط) | 1.15 (بزرگ)
  letterScale: number; // same steps — applies to the Word Hunter letters

  // actions
  setLang: (lang: Lang) => void;
  setMusic: (on: boolean) => void;
  setSfx: (on: boolean) => void;
  setHaptics: (on: boolean) => void;
  completeOnboarding: (name: string, avatar: AvatarId) => void;
  isVip: () => boolean;
  addCoins: (n: number, reason?: string) => void;
  spendCoins: (n: number, reason?: string) => boolean;
  useHintToken: () => boolean;
  addHintTokens: (n: number) => void;
  buyVip: () => Promise<boolean>;
  buyBundle: (id: string) => Promise<boolean>;
  watchRewardedAd: () => Promise<number | null>;
  addXp: (n: number) => LevelUpEvent[];
  buyAvatar: (id: AvatarId) => boolean;
  buyTheme: (id: ThemeId) => boolean;
  buyDeck: (id: DeckId) => boolean;
  equipAvatar: (id: AvatarId) => void;
  equipTheme: (id: ThemeId) => void;
  equipDeck: (id: DeckId) => void;
  buyCosmetic: (kind: CosmeticKind, id: string) => boolean;
  equipCosmetic: (kind: CosmeticKind, id: string) => void;
  buyPack: (packId: string) => Promise<number | null>;
  whUnlockedLevel: (cat: CategoryId, diff: Difficulty) => number;
  whStarsFor: (cat: CategoryId, diff: Difficulty, level: number) => number;
  mmUnlockedLevel: (diff: Difficulty) => number;
  mmStarsFor: (diff: Difficulty, level: number) => number;
  recordWHResult: (cat: CategoryId, diff: Difficulty, level: number, rewards: LevelRewards, wordsFound: number, hintsUsed: number, usedWords: string[], timeSec?: number) => LevelUpEvent[];
  recordMMResult: (diff: Difficulty, level: number, rewards: LevelRewards, pairs: number, bestCombo: number, mistakes: number, usedPowerup?: boolean, moves?: number, timeSec?: number) => LevelUpEvent[];
  trackMission: (event: string, value: number) => void;
  claimMission: (id: string, coins: number, xp: number) => LevelUpEvent[];
  ensureWeekly: () => void;
  claimWeekly: (id: string, coins: number, xp: number) => LevelUpEvent[];
  achCtx: () => AchCtx;
  claimAchievement: (id: string) => LevelUpEvent[] | null;
  ensureTournament: () => void;
  claimTourMilestone: (coins: number) => boolean;
  claimTourRollover: () => OpenedChest | null;
  openChest: () => OpenedChest | null;
  claimDaily: () => { day: number; reward: DailyReward; big: boolean } | null;
  claimFreeGift: () => number | null;
  spinDailyWheel: () => number | null;
  resetProgress: () => void;
  ensureMissions: () => void;
  // profile & account actions
  setName: (name: string) => void;
  setQuality: (q: Quality) => void;
  setGridScale: (v: number) => void;
  setLetterScale: (v: number) => void;
  toggleFriend: (id: string) => void;
  registerAccount: (username: string, password: string) => Promise<string | null>;
  loginAccount: (username: string, password: string) => Promise<string | null>;
  logoutAccount: () => void;
  pushCloud: () => Promise<string | null>;
  pullCloud: () => Promise<string | null>;
  snapshotForCloud: () => Record<string, unknown>;
  applyCloudState: (state: unknown) => void;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function yesterdayStr(): string {
  const d = new Date(Date.now() - 86400000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const initialProgress = {
  whUnlocked: {} as Record<string, Record<string, number>>,
  whStars: {} as Record<string, number>,
  mmUnlocked: {} as Record<string, number>,
  mmStars: {} as Record<string, number>,
};

/** shared mission-progress bump used by daily & weekly missions */
function bumpProgress(
  progress: Record<string, number>,
  defs: { id: string; event: string }[],
  event: string,
  value: number,
): { changed: boolean; next: Record<string, number> } {
  let changed = false;
  const next = { ...progress };
  for (const def of defs) {
    if (def.event !== event) continue;
    if (event === 'combo_reached') {
      if ((next[def.id] ?? 0) < value) { next[def.id] = value; changed = true; }
    } else {
      next[def.id] = (next[def.id] ?? 0) + value;
      changed = true;
    }
  }
  return { changed, next };
}

/** unique transaction id for every finished level (بخش ۱۴ — شناسه یکتا) */
function newTxId(): string {
  try { return crypto.randomUUID(); } catch {
    return `tx-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

/** Apply the server validator's verdict to a history entry + the coin balance.
 *  verified → adopt the server's numbers (self-correction on mismatch)
 *  rejected → the grant is reverted (server is authoritative)
 *  offline  → keep the locally computed result (بخش ۱۶ — ادامه پس از اتصال) */
function applyValidation(
  tx: string,
  localCoins: number,
  v: { ok: boolean; verified?: boolean; reason?: string; rewards?: { coins: number; xp: number } },
): void {
  const s = useGame.getState();
  const idx = s.history.findIndex((h) => h.tx === tx);
  if (idx === -1) return;
  const history = [...s.history];
  if (v.ok && v.verified && v.rewards) {
    const diff = v.rewards.coins - localCoins;
    if (diff !== 0) {
      useGame.setState({ coins: Math.max(0, useGame.getState().coins + diff) });
    }
    history[idx] = { ...history[idx], coins: v.rewards.coins, xp: v.rewards.xp, verified: true };
  } else if (v.reason !== 'offline') {
    useGame.setState({ coins: Math.max(0, useGame.getState().coins - localCoins) });
    history[idx] = { ...history[idx], coins: 0, xp: 0, verified: false };
  } else {
    history[idx] = { ...history[idx], verified: false };
  }
  useGame.setState({ history });
}

export const useGame = create<GameStore>()(
  persist(
    (set, get) => ({
      hydrated: false,
      name: '',
      avatar: 'owl',
      onboarded: false,
      xp: 0,
      coins: 120,
      vipUntil: null,
      hintTokens: 0,
      bundlesOwned: [],
      adDay: null,
      adCount: 0,
      lang: 'fa',
      music: true,
      sfx: true,
      haptics: true,
      ownedAvatars: ['owl'],
      ownedThemes: ['meadow'],
      ownedDecks: ['animals', 'fruits'],
      theme: 'meadow',
      deck: 'animals',
      owned: { ...DEFAULT_OWNED },
      equipped: { ...DEFAULT_EQUIPPED },
      ...initialProgress,
      whUsedWords: {},
      stats: { wordsFound: 0, whLevels: 0, whPerfects: 0, pairsMatched: 0, mmLevels: 0, mmPerfects: 0, bestCombo: 0, noHintLevels: 0 },
      dailyLastClaim: null,
      dailyStreakDay: null,
      dailyStreak: 0,
      freeGiftDay: null,
      spinDay: null,
      missionDay: '',
      missionIds: [],
      missionProgress: {},
      missionClaimed: [],
      week: '',
      weeklyIds: [],
      weeklyProgress: {},
      weeklyClaimed: [],
      achClaimed: [],
      tourWeek: '',
      tourPoints: 0,
      tourMilestonesClaimed: 0,
      tourPrevWeek: null,
      tourPrevPoints: 0,
      tourPrevRank: 0,
      tourPrevCoins: 0,
      tourPrevChest: null,
      tourPrevClaimed: true,
      tourBestRank: 99,
      tourWins: 0,
      chestProgress: 0,
      chestsPending: [],
      history: [],
      records: { fastestWhSec: null, fewestMmMoves: null, bestStreak: 0 },
      account: { status: 'guest', username: null, token: null, lastSync: null },
      friendIds: [],
      quality: 'high',
      gridScale: 1,
      letterScale: 1,

      setLang: (lang) => {
        set({ lang });
      },
      setMusic: (on) => {
        audio.setMusicEnabled(on);
        set({ music: on });
      },
      setSfx: (on) => {
        audio.setSfxEnabled(on);
        set({ sfx: on });
      },
      setHaptics: (on) => {
        audio.setHaptics(on);
        set({ haptics: on });
      },

      completeOnboarding: (name, avatar) => {
        set({
          name: name.trim() || (get().lang === 'fa' ? 'بازیکن' : 'Player'),
          avatar,
          ownedAvatars: get().ownedAvatars.includes(avatar) ? get().ownedAvatars : [...get().ownedAvatars, avatar],
          onboarded: true,
        });
      },

      isVip: () => (get().vipUntil ?? 0) > Date.now(),

      /** every coin gain flows through here → reported to the anti-tamper server ledger */
      addCoins: (n, reason = 'reward') => {
        if (n <= 0) return;
        const coins = get().coins + n;
        set({ coins });
        reportDelta(n, coins, reason, (serverBalance) => useGame.setState({ coins: serverBalance }));
      },

      spendCoins: (n, reason = 'spend') => {
        if (get().coins < n) return false;
        const coins = get().coins - n;
        set({ coins });
        reportDelta(-n, coins, reason, (serverBalance) => useGame.setState({ coins: serverBalance }));
        return true;
      },

      /** consume a free hint token (daily reward / achievements / bundles) */
      useHintToken: () => {
        if (get().hintTokens <= 0) return false;
        set({ hintTokens: get().hintTokens - 1 });
        return true;
      },

      addHintTokens: (n) => set({ hintTokens: get().hintTokens + n }),

      /** VIP subscription — server-verified demo purchase (30-day cycle) */
      buyVip: async () => {
        if (get().isVip()) return false;
        const ver = await verifyPurchase('vip', 'vip');
        if (!ver.ok || ver.duplicate) return false;
        if (!get().spendCoins(ver.price ?? 0, 'vip')) return false;
        set({
          vipUntil: Date.now() + (VIP_DAYS * 24 * 3600 * 1000),
          // اسکین اختصاصی VIP — granted with the subscription
          owned: get().owned.skin.includes('vipRoyal')
            ? get().owned
            : { ...get().owned, skin: [...get().owned.skin, 'vipRoyal'] },
          // دسترسی به تم‌های خاص — VIP themes unlocked
          ownedThemes: [...new Set([...get().ownedThemes, 'royal' as ThemeId, 'aurora' as ThemeId])],
        });
        // VIP mission becomes available immediately
        get().ensureMissions();
        return true;
      },

      /** bundle purchase (بسته پیشنهادی) — server-verified, one-time */
      buyBundle: async (id) => {
        const b = BUNDLES.find((x) => x.id === id);
        if (!b || get().bundlesOwned.includes(id)) return false;
        const ver = await verifyPurchase('bundle', id);
        if (!ver.ok || ver.duplicate) return false;
        if (!get().spendCoins(ver.price ?? b.price, 'bundle')) return false;
        const ownedSet = new Set(get().bundlesOwned);
        ownedSet.add(id);
        const c = b.contents;
        const ownedPrev = get().owned;
        set({
          bundlesOwned: [...ownedSet],
          hintTokens: get().hintTokens + (c.hints ?? 0),
          owned: {
            ...ownedPrev,
            skin: c.skin && !ownedPrev.skin.includes(c.skin) ? [...ownedPrev.skin, c.skin] : ownedPrev.skin,
            char: c.char && !ownedPrev.char.includes(c.char) ? [...ownedPrev.char, c.char] : ownedPrev.char,
          },
        });
        if (c.coins) get().addCoins(c.coins, 'bundle');
        return true;
      },

      /** optional rewarded ad — the UI collects explicit consent BEFORE calling this.
       *  Capped per day; VIP players see this section removed (حذف تبلیغات). */
      watchRewardedAd: async () => {
        if (get().isVip()) return null;
        const today = todayStr();
        const count = get().adDay === today ? get().adCount : 0;
        if (count >= AD_DAILY_LIMIT) return null;
        // server-verified like every other monetized grant
        const ver = await verifyPurchase('pack', 'ad_reward');
        if (!ver.ok || ver.duplicate) return null;
        set({ adDay: today, adCount: count + 1 });
        get().addCoins(AD_REWARD_COINS, 'ad');
        return AD_REWARD_COINS;
      },

      addXp: (n) => {
        const oldLevel = levelFromXp(get().xp);
        const xp = get().xp + n;
        set({ xp });
        const newLevel = levelFromXp(xp);
        const events: LevelUpEvent[] = [];
        if (newLevel > oldLevel) {
          for (let l = oldLevel + 1; l <= newLevel; l++) {
            const coins = LEVELUP_COINS(l);
            set({ coins: get().coins + coins });
            events.push({ level: l, coins });
            for (const [av, req] of Object.entries(AVATAR_UNLOCK_LEVEL)) {
              if (req === l && !get().ownedAvatars.includes(av as AvatarId)) {
                set({ ownedAvatars: [...get().ownedAvatars, av as AvatarId] });
                events.push({ level: l, coins: 0, unlockedAvatar: av as AvatarId });
              }
            }
          }
        }
        return events;
      },

      buyAvatar: (id) => {
        const item = SHOP_AVATARS.find((a) => a.id === id);
        if (!item || get().ownedAvatars.includes(id)) return false;
        if (!get().spendCoins(item.price)) return false;
        set({ ownedAvatars: [...get().ownedAvatars, id], avatar: id });
        return true;
      },
      buyTheme: (id) => {
        const item = SHOP_THEMES.find((a) => a.id === id);
        if (!item || get().ownedThemes.includes(id)) return false;
        if (item.vipOnly && !get().isVip()) return false;
        if (!get().spendCoins(item.price)) return false;
        set({ ownedThemes: [...get().ownedThemes, id], theme: id });
        return true;
      },
      buyDeck: (id) => {
        const item = SHOP_DECKS.find((a) => a.id === id);
        if (!item || get().ownedDecks.includes(id)) return false;
        if (!get().spendCoins(item.price)) return false;
        set({ ownedDecks: [...get().ownedDecks, id], deck: id });
        return true;
      },
      equipAvatar: (id) => { if (get().ownedAvatars.includes(id)) set({ avatar: id }); },
      equipTheme: (id) => { if (get().ownedThemes.includes(id)) set({ theme: id }); },
      equipDeck: (id) => { if (get().ownedDecks.includes(id)) set({ deck: id }); },

      buyCosmetic: (kind, id) => {
        const item = COSMETIC_CATALOG[kind].find((x) => x.id === id);
        if (!item || get().owned[kind].includes(id)) return false;
        // VIP-exclusive items need an active subscription
        if ('vipOnly' in item && item.vipOnly && !get().isVip()) return false;
        if (item.price > 0 && !get().spendCoins(item.price)) return false;
        set({
          owned: { ...get().owned, [kind]: [...get().owned[kind], id] },
          equipped: { ...get().equipped, [kind]: id },
        });
        return true;
      },
      equipCosmetic: (kind, id) => {
        if (!get().owned[kind].includes(id)) return;
        set({ equipped: { ...get().equipped, [kind]: id } });
      },

      /** Demo purchase — verified by the server (idempotent nonce) before granting.
       *  In production the same flow validates the store/gateway receipt. */
      buyPack: async (packId) => {
        const pack = COIN_PACKS.find((p) => p.id === packId);
        if (!pack) return null;
        const ver = await verifyPurchase('pack', packId);
        if (!ver.ok || ver.duplicate) return null;
        const total = packTotalCoins(pack);
        get().addCoins(total, 'pack');
        return total;
      },

      whUnlockedLevel: (cat, diff) => get().whUnlocked[cat]?.[diff] ?? 1,
      whStarsFor: (cat, diff, level) => get().whStars[`${cat}:${diff}:${level}`] ?? 0,
      mmUnlockedLevel: (diff) => get().mmUnlocked[diff] ?? 1,
      mmStarsFor: (diff, level) => get().mmStars[`${diff}:${level}`] ?? 0,

      recordWHResult: (cat, diff, level, rewards, wordsFound, hintsUsed, usedWords, timeSec = 0) => {
        // coins & xp
        set({ coins: get().coins + rewards.coins });
        const events = get().addXp(rewards.xp);
        // progress
        const whUnlocked = { ...get().whUnlocked };
        const catProg = { ...(whUnlocked[cat] ?? {}) };
        const cur = catProg[diff] ?? 1;
        catProg[diff] = Math.max(cur, Math.min(level + 1, TOTAL_WH_LEVELS));
        whUnlocked[cat] = catProg;
        const key = `${cat}:${diff}:${level}`;
        const whStars = { ...get().whStars };
        whStars[key] = Math.max(whStars[key] ?? 0, rewards.stars);
        // anti-repetition memory
        const wkey = `${get().lang}:${cat}`;
        const prev = get().whUsedWords[wkey] ?? [];
        const next = [...prev, ...usedWords].slice(-80);
        const whUsedWords = { ...get().whUsedWords, [wkey]: next };
        // stats
        const stats = {
          ...get().stats,
          wordsFound: get().stats.wordsFound + wordsFound,
          whLevels: get().stats.whLevels + 1,
          whPerfects: get().stats.whPerfects + (rewards.perfect ? 1 : 0),
          noHintLevels: get().stats.noHintLevels + (hintsUsed === 0 ? 1 : 0),
        };
        set({ whUnlocked, whStars, whUsedWords, stats });
        // missions
        const m = get();
        m.trackMission('wh_level', 1);
        m.trackMission('coins_earned', rewards.coins);
        if (hintsUsed === 0) m.trackMission('no_hint_level', 1);
        if (rewards.perfect) m.trackMission('perfect_level', 1);
        // tournament + chests
        const pts = tournamentPoints(rewards.stars, rewards.perfect, level % 10 === 0);
        set({ tourPoints: get().tourPoints + pts });
        const pending = [...get().chestsPending];
        let chestProgress = get().chestProgress + 1;
        if (chestProgress >= CHEST_STEP_LEVELS) {
          chestProgress = 0;
          if (pending.length < CHESTS_PENDING_CAP) pending.push(rollChestKind());
        }
        set({ chestProgress, chestsPending: pending });
        // ---- game history + server validation (بخش ۱۲ + ۱۴) ----
        const tx = newTxId();
        const entry: HistoryEntry = {
          tx, game: 'wh', diff, level,
          stars: rewards.stars, perfect: rewards.perfect,
          timeSec, coins: rewards.coins, xp: rewards.xp,
          at: Date.now(), verified: false,
        };
        const rec = get().records;
        const records: Records = {
          ...rec,
          fastestWhSec: timeSec > 0 ? (rec.fastestWhSec === null ? timeSec : Math.min(rec.fastestWhSec, timeSec)) : rec.fastestWhSec,
        };
        set({ history: [entry, ...get().history].slice(0, 30), records });
        // the server recomputes the reward from the inputs; a mismatch self-corrects
        validateLevelResult({
          game: 'wh', cat, diff, level, timeSec, hintsUsed, wordsFound,
          wordLengths: usedWords.map((w) => w.length),
        }).then((v) => applyValidation(tx, rewards.coins, v));
        return events;
      },

      recordMMResult: (diff, level, rewards, pairs, bestCombo, mistakes, usedPowerup = false, moves = 0, timeSec = 0) => {
        set({ coins: get().coins + rewards.coins });
        const events = get().addXp(rewards.xp);
        const mmUnlocked = { ...get().mmUnlocked };
        mmUnlocked[diff] = Math.max(mmUnlocked[diff] ?? 1, Math.min(level + 1, TOTAL_MM_LEVELS));
        const key = `${diff}:${level}`;
        const mmStars = { ...get().mmStars };
        mmStars[key] = Math.max(mmStars[key] ?? 0, rewards.stars);
        const stats = {
          ...get().stats,
          pairsMatched: get().stats.pairsMatched + pairs,
          mmLevels: get().stats.mmLevels + 1,
          mmPerfects: get().stats.mmPerfects + (rewards.perfect ? 1 : 0),
          bestCombo: Math.max(get().stats.bestCombo, bestCombo),
          noHintLevels: get().stats.noHintLevels + (!usedPowerup ? 1 : 0),
        };
        set({ mmUnlocked, mmStars, stats });
        const m = get();
        m.trackMission('mm_level', 1);
        m.trackMission('coins_earned', rewards.coins);
        if (!usedPowerup) m.trackMission('no_hint_level', 1);
        if (rewards.perfect) m.trackMission('perfect_level', 1);
        // tournament + chests
        const pts = tournamentPoints(rewards.stars, rewards.perfect, level % 10 === 0);
        set({ tourPoints: get().tourPoints + pts });
        const pending = [...get().chestsPending];
        let chestProgress = get().chestProgress + 1;
        if (chestProgress >= CHEST_STEP_LEVELS) {
          chestProgress = 0;
          if (pending.length < CHESTS_PENDING_CAP) pending.push(rollChestKind());
        }
        set({ chestProgress, chestsPending: pending });
        // ---- game history + server validation (بخش ۱۲ + ۱۴) ----
        const tx = newTxId();
        const entry: HistoryEntry = {
          tx, game: 'mm', diff, level,
          stars: rewards.stars, perfect: rewards.perfect,
          timeSec, coins: rewards.coins, xp: rewards.xp,
          at: Date.now(), verified: false,
        };
        const rec = get().records;
        const records: Records = {
          ...rec,
          fewestMmMoves: moves > 0 ? (rec.fewestMmMoves === null ? moves : Math.min(rec.fewestMmMoves, moves)) : rec.fewestMmMoves,
        };
        set({ history: [entry, ...get().history].slice(0, 30), records });
        validateLevelResult({
          game: 'mm', diff, level, pairs, moves, bestCombo, mistakes, usedPowerup,
        }).then((v) => applyValidation(tx, rewards.coins, v));
        return events;
      },

      trackMission: (event, value) => {
        get().ensureMissions();
        get().ensureWeekly();
        const { missionIds, missionProgress, weeklyIds, weeklyProgress } = get();
        const dailyDefs = missionIds
          .map((id) => ALL_MISSIONS.find((d) => d.id === id))
          .filter(Boolean) as { id: string; event: string }[];
        const weeklyDefs = weeklyIds
          .map((id) => WEEKLY_POOL.find((d) => d.id === id))
          .filter(Boolean) as { id: string; event: string }[];
        const d = bumpProgress(missionProgress, dailyDefs, event, value);
        const w = bumpProgress(weeklyProgress, weeklyDefs, event, value);
        if (d.changed || w.changed) set({ missionProgress: d.next, weeklyProgress: w.next });
      },

      claimMission: (id, coins, xp) => {
        if (get().missionClaimed.includes(id)) return [];
        set({
          coins: get().coins + coins,
          missionClaimed: [...get().missionClaimed, id],
        });
        return get().addXp(xp);
      },

      ensureWeekly: () => {
        const wk = weekKey();
        if (get().week !== wk) {
          set({ week: wk, weeklyIds: weekMissionIds(wk), weeklyProgress: {}, weeklyClaimed: [] });
        }
      },

      claimWeekly: (id, coins, xp) => {
        if (get().weeklyClaimed.includes(id)) return [];
        set({
          coins: get().coins + coins,
          weeklyClaimed: [...get().weeklyClaimed, id],
        });
        return get().addXp(xp);
      },

      achCtx: () => {
        const s = get();
        // count only *earned/purchased* items (free starter items don't count)
        const priced = new Set(
          [...SHOP_AVATARS, ...SHOP_THEMES, ...SHOP_DECKS, ...SKINS, ...BOARDS, ...BGS, ...FXS, ...CHARS]
            .filter((x) => x.price > 0)
            .map((x) => `${x.id}`),
        );
        const pricedIn = (arr: string[]) => arr.filter((id) => priced.has(id)).length;
        const ownedCount =
          pricedIn(s.ownedAvatars as string[]) + pricedIn(s.ownedThemes as string[]) + pricedIn(s.ownedDecks as string[]) +
          pricedIn(s.owned.skin) + pricedIn(s.owned.board) + pricedIn(s.owned.bg) +
          pricedIn(s.owned.fx) + pricedIn(s.owned.char);
        return {
          stats: s.stats,
          level: levelFromXp(s.xp),
          streak: s.dailyStreak,
          ownedCount,
          skinsOwned: s.owned.skin.filter((id) => !['classic', 'vipRoyal'].includes(id)).length,
          tourTop3: s.tourBestRank <= 3,
          tourWins: s.tourWins,
        };
      },

      claimAchievement: (id) => {
        const def = ACHIEVEMENTS.find((a) => a.id === id);
        if (!def || get().achClaimed.includes(id)) return null;
        const ctx = get().achCtx();
        if (def.progress(ctx) < def.target) return null;
        // exclusive bonus rewards (هر دستاورد جایزه اختصاصی دارد)
        if (def.bonus?.hints) set({ hintTokens: get().hintTokens + def.bonus.hints });
        if (def.bonus?.chest) {
          const pending = [...get().chestsPending];
          if (pending.length < CHESTS_PENDING_CAP) pending.push(def.bonus.chest);
          set({ chestsPending: pending });
        }
        set({
          coins: get().coins + def.coins,
          achClaimed: [...get().achClaimed, id],
        });
        return get().addXp(def.xp);
      },

      ensureTournament: () => {
        const wk = weekKey();
        if (get().tourWeek !== wk) {
          // rollover of the finished week
          const prevWeek = get().tourWeek;
          const prevPoints = get().tourPoints;
          if (prevWeek && prevPoints > 0) {
            const rank = rankOf(prevPoints, prevWeek);
            const reward = tournamentReward(rank);
            set({
              tourPrevWeek: prevWeek,
              tourPrevPoints: prevPoints,
              tourPrevRank: rank,
              tourPrevCoins: reward.coins,
              tourPrevChest: reward.chest ?? null,
              tourPrevClaimed: false,
              tourBestRank: Math.min(get().tourBestRank, rank),
              tourWins: get().tourWins + (rank === 1 ? 1 : 0),
            });
          } else {
            set({ tourPrevWeek: null, tourPrevPoints: 0, tourPrevRank: 0, tourPrevCoins: 0, tourPrevChest: null, tourPrevClaimed: true });
          }
          set({ tourWeek: wk, tourPoints: 0, tourMilestonesClaimed: 0 });
        }
      },

      claimTourMilestone: (coins) => {
        if (get().tourMilestonesClaimed >= TOUR_MILESTONES.length) return false;
        set({
          coins: get().coins + coins,
          tourMilestonesClaimed: get().tourMilestonesClaimed + 1,
        });
        return true;
      },

      claimTourRollover: () => {
        if (get().tourPrevClaimed) return null;
        const coins = get().tourPrevCoins;
        const chest = get().tourPrevChest;
        const pending = [...get().chestsPending];
        if (chest && pending.length < CHESTS_PENDING_CAP) pending.push(chest);
        set({ tourPrevClaimed: true, chestsPending: pending });
        return { kind: chest ?? 'wooden', coins };
      },

      openChest: () => {
        const pending = [...get().chestsPending];
        const kind = pending.shift();
        if (!kind) return null;
        set({ chestsPending: pending });
        return { kind, coins: CHESTS[kind].coins };
      },

      claimDaily: () => {
        const today = todayStr();
        if (get().dailyLastClaim === today) return null;
        const streak = get().dailyStreakDay === yesterdayStr() ? get().dailyStreak + 1 : 1;
        const day = ((streak - 1) % 7) + 1;
        const vip = get().isVip();
        const reward = dailyRewardFor(day, vip);
        // apply the structured reward
        if (reward.kind === 'coins') get().addCoins(reward.coins, 'daily');
        else if (reward.kind === 'hint') set({ hintTokens: get().hintTokens + reward.n });
        else {
          const pending = [...get().chestsPending];
          if (pending.length < CHESTS_PENDING_CAP) pending.push(reward.chest);
          set({ chestsPending: pending });
        }
        set({
          dailyLastClaim: today,
          dailyStreakDay: today,
          dailyStreak: streak,
          records: { ...get().records, bestStreak: Math.max(get().records.bestStreak, streak) },
        });
        return { day, reward, big: day === 7 };
      },

      claimFreeGift: () => {
        const today = todayStr();
        if (get().freeGiftDay === today) return null;
        set({ freeGiftDay: today, coins: get().coins + 100 });
        return 100;
      },

      /** one free spin per day — reward is a random wheel segment, hard-capped at SPIN_MAX_REWARD (۵۰) */
      spinDailyWheel: () => {
        const today = todayStr();
        if (get().spinDay === today) return null;
        const got = SPIN_SEGMENTS[Math.floor(Math.random() * SPIN_SEGMENTS.length)];
        set({ spinDay: today, coins: get().coins + got });
        return got;
      },

      resetProgress: () => {
        set({
          name: '', avatar: 'owl', onboarded: false, xp: 0, coins: 120,
          vipUntil: null, hintTokens: 0, bundlesOwned: [], adDay: null, adCount: 0,
          ownedAvatars: ['owl'], ownedThemes: ['meadow'], ownedDecks: ['animals', 'fruits'],
          theme: 'meadow', deck: 'animals',
          owned: { ...DEFAULT_OWNED },
          equipped: { ...DEFAULT_EQUIPPED },
          ...initialProgress,
          whUsedWords: {},
          stats: { wordsFound: 0, whLevels: 0, whPerfects: 0, pairsMatched: 0, mmLevels: 0, mmPerfects: 0, bestCombo: 0, noHintLevels: 0 },
          dailyLastClaim: null, dailyStreakDay: null, dailyStreak: 0,
          freeGiftDay: null,
          spinDay: null,
          missionDay: '', missionIds: [], missionProgress: {}, missionClaimed: [],
          week: '', weeklyIds: [], weeklyProgress: {}, weeklyClaimed: [],
          achClaimed: [],
          tourWeek: '', tourPoints: 0, tourMilestonesClaimed: 0,
          tourPrevWeek: null, tourPrevPoints: 0, tourPrevRank: 0, tourPrevCoins: 0, tourPrevChest: null, tourPrevClaimed: true,
          tourBestRank: 99, tourWins: 0,
          chestProgress: 0, chestsPending: [],
          history: [],
          records: { fastestWhSec: null, fewestMmMoves: null, bestStreak: 0 },
        });
      },

      ensureMissions: () => {
        const today = todayStr();
        const s = get();
        const vip = (s.vipUntil ?? 0) > Date.now();
        const expected = todayMissionIds(today, vip);
        const KNOWN = new Set([...DAILY_CORE, VIP_MISSION].map((m) => m.id));
        const isLegacySet = s.missionIds.length > 0 && s.missionIds.some((id) => !KNOWN.has(id));
        if (s.missionDay !== today || isLegacySet) {
          // new day (or legacy migration) — fresh missions; the login mission is
          // auto-completed because opening the game IS the login
          set({ missionDay: today, missionIds: expected, missionProgress: { d_login: 1 }, missionClaimed: [] });
        } else if (s.missionIds.join(',') !== expected.join(',')) {
          // VIP toggled mid-day — sync membership without wiping progress
          set({ missionIds: expected });
        }
      },

      // ---------- profile & account (بخش ۱۲) ----------
      setName: (name) => {
        const n = name.trim().slice(0, 20);
        if (n) set({ name: n });
      },
      setQuality: (q) => set({ quality: q }),
      setGridScale: (v) => { if (v === 0.85 || v === 1 || v === 1.15) set({ gridScale: v }); },
      setLetterScale: (v) => { if (v === 0.85 || v === 1 || v === 1.15) set({ letterScale: v }); },
      toggleFriend: (id) => {
        const cur = get().friendIds;
        set({ friendIds: cur.includes(id) ? cur.filter((f) => f !== id) : [...cur, id] });
      },

      registerAccount: async (username, password) => {
        const res = await apiRegister(username, password);
        if (!res) return 'accountErrNet';
        if (!res.ok) return authErrorKey(res.error);
        set({ account: { status: 'member', username: res.username ?? username, token: res.token ?? null, lastSync: null } });
        get().pushCloud(); // seed the fresh account with this device's progress
        return null;
      },

      loginAccount: async (username, password) => {
        const res = await apiLogin(username, password);
        if (!res) return 'accountErrNet';
        if (!res.ok) return authErrorKey(res.error);
        set({ account: { status: 'member', username: res.username ?? username, token: res.token ?? null, lastSync: null } });
        // cross-device sync: whichever copy has MORE progress wins
        const pull = await apiPullSnapshot(res.token ?? '');
        if (pull?.ok && pull.state && typeof pull.state === 'object') {
          const cloud = pull.state as { xp?: number };
          if ((cloud.xp ?? 0) > get().xp) get().applyCloudState(pull.state);
          else get().pushCloud(); // this device is ahead → upload it
        } else {
          get().pushCloud(); // empty cloud → seed it
        }
        if (pull?.ok) set({ account: { ...get().account, lastSync: pull.updatedAt ?? Date.now() } });
        return null;
      },

      logoutAccount: () => set({ account: { status: 'guest', username: null, token: null, lastSync: null } }),

      pushCloud: async () => {
        const acc = get().account;
        if (acc.status !== 'member' || !acc.token) return 'accountErrGuest';
        const res = await apiPushSnapshot(acc.token, get().snapshotForCloud());
        if (!res) return 'accountErrNet';
        if (!res.ok) return authErrorKey(res.error);
        set({ account: { ...get().account, lastSync: res.updatedAt ?? Date.now() } });
        return null;
      },

      pullCloud: async () => {
        const acc = get().account;
        if (acc.status !== 'member' || !acc.token) return 'accountErrGuest';
        const res = await apiPullSnapshot(acc.token);
        if (!res) return 'accountErrNet';
        if (!res.ok) return authErrorKey(res.error);
        if (res.state && typeof res.state === 'object') {
          const cloud = res.state as { xp?: number };
          if ((cloud.xp ?? 0) >= get().xp) get().applyCloudState(res.state);
        }
        set({ account: { ...get().account, lastSync: res.updatedAt ?? Date.now() } });
        return null;
      },

      /** progress-only payload — credentials never leave the device */
      snapshotForCloud: () => {
        const s = get();
        return {
          name: s.name, avatar: s.avatar, xp: s.xp, coins: s.coins,
          vipUntil: s.vipUntil, hintTokens: s.hintTokens, bundlesOwned: s.bundlesOwned,
          ownedAvatars: s.ownedAvatars, ownedThemes: s.ownedThemes, ownedDecks: s.ownedDecks,
          theme: s.theme, deck: s.deck, owned: s.owned, equipped: s.equipped,
          whUnlocked: s.whUnlocked, whStars: s.whStars, mmUnlocked: s.mmUnlocked, mmStars: s.mmStars,
          stats: s.stats, records: s.records, history: s.history,
          dailyLastClaim: s.dailyLastClaim, dailyStreakDay: s.dailyStreakDay, dailyStreak: s.dailyStreak,
          achClaimed: s.achClaimed, tourBestRank: s.tourBestRank, tourWins: s.tourWins,
          lang: s.lang,
        };
      },

      /** adopt a cloud snapshot — whitelisted progress fields only */
      applyCloudState: (state) => {
        const p = state as Partial<GameStore>;
        if (!p || typeof p !== 'object') return;
        const clean: Partial<GameStore> = {};
        const keys: (keyof GameStore)[] = [
          'name', 'avatar', 'xp', 'coins', 'vipUntil', 'hintTokens', 'bundlesOwned',
          'ownedAvatars', 'ownedThemes', 'ownedDecks', 'theme', 'deck', 'owned', 'equipped',
          'whUnlocked', 'whStars', 'mmUnlocked', 'mmStars', 'stats', 'records', 'history',
          'dailyLastClaim', 'dailyStreakDay', 'dailyStreak', 'achClaimed',
          'tourBestRank', 'tourWins', 'lang',
        ];
        for (const k of keys) {
          if (p[k] !== undefined) (clean as Record<string, unknown>)[k as string] = p[k];
        }
        set(clean);
        const g = get();
        g.ensureMissions();
        g.ensureWeekly();
        g.ensureTournament();
      },
    }),
    {
      name: 'word-game-3d-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        name: s.name, avatar: s.avatar, onboarded: s.onboarded, xp: s.xp, coins: s.coins,
        vipUntil: s.vipUntil, hintTokens: s.hintTokens, bundlesOwned: s.bundlesOwned,
        adDay: s.adDay, adCount: s.adCount,
        lang: s.lang, music: s.music, sfx: s.sfx, haptics: s.haptics,
        ownedAvatars: s.ownedAvatars, ownedThemes: s.ownedThemes, ownedDecks: s.ownedDecks,
        theme: s.theme, deck: s.deck,
        owned: s.owned, equipped: s.equipped,
        whUnlocked: s.whUnlocked, whStars: s.whStars, mmUnlocked: s.mmUnlocked, mmStars: s.mmStars,
        whUsedWords: s.whUsedWords, stats: s.stats,
        dailyLastClaim: s.dailyLastClaim, dailyStreakDay: s.dailyStreakDay, dailyStreak: s.dailyStreak,
        freeGiftDay: s.freeGiftDay,
        spinDay: s.spinDay,
        missionDay: s.missionDay, missionIds: s.missionIds, missionProgress: s.missionProgress, missionClaimed: s.missionClaimed,
        week: s.week, weeklyIds: s.weeklyIds, weeklyProgress: s.weeklyProgress, weeklyClaimed: s.weeklyClaimed,
        achClaimed: s.achClaimed,
        tourWeek: s.tourWeek, tourPoints: s.tourPoints, tourMilestonesClaimed: s.tourMilestonesClaimed,
        tourPrevWeek: s.tourPrevWeek, tourPrevPoints: s.tourPrevPoints, tourPrevRank: s.tourPrevRank,
        tourPrevCoins: s.tourPrevCoins, tourPrevChest: s.tourPrevChest, tourPrevClaimed: s.tourPrevClaimed,
        tourBestRank: s.tourBestRank, tourWins: s.tourWins,
        chestProgress: s.chestProgress, chestsPending: s.chestsPending,
        history: s.history, records: s.records,
        account: s.account, friendIds: s.friendIds, quality: s.quality,
        gridScale: s.gridScale, letterScale: s.letterScale,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<GameStore>;
        const merged = { ...current, ...p };
        // migration guard: fill new cosmetic maps if an older save lacks them
        merged.owned = { ...DEFAULT_OWNED, ...(p.owned ?? {}) };
        merged.equipped = { ...DEFAULT_EQUIPPED, ...(p.equipped ?? {}) };
        merged.chestsPending = Array.isArray(p.chestsPending) ? p.chestsPending : [];
        merged.stats = { ...current.stats, ...(p.stats ?? {}), noHintLevels: p.stats?.noHintLevels ?? 0 };
        merged.bundlesOwned = Array.isArray(p.bundlesOwned) ? p.bundlesOwned : [];
        merged.history = Array.isArray(p.history) ? p.history : [];
        merged.records = { ...current.records, ...(p.records ?? {}) };
        merged.account = p.account ?? current.account;
        merged.friendIds = Array.isArray(p.friendIds) ? p.friendIds : [];
        merged.quality = p.quality ?? current.quality;
        merged.gridScale = p.gridScale ?? current.gridScale;
        merged.letterScale = p.letterScale ?? current.letterScale;
        return merged as GameStore;
      },
    },
  ),
);

// localStorage is synchronous → persist has already rehydrated by this point.
// (Setting the flag from inside onRehydrateStorage would hit a TDZ error because
// the `useGame` const is not assigned yet while `create()` is still running.)
if (typeof window !== 'undefined') {
  const s = useGame.getState();
  // --- save migration: deck catalog changed (space/monsters → fantasy) ---
  const LEGACY_DECK_MAP: Record<string, DeckId> = { space: 'fantasy', monsters: 'fantasy' };
  const validDecks = new Set(SHOP_DECKS.map((d) => d.id));
  const ownedDecks = s.ownedDecks
    .map((d) => validDecks.has(d) ? d : LEGACY_DECK_MAP[d])
    .filter((d): d is DeckId => !!d && validDecks.has(d));
  for (const legacy of Object.keys(LEGACY_DECK_MAP)) {
    if (s.ownedDecks.includes(legacy as DeckId) && !ownedDecks.includes(LEGACY_DECK_MAP[legacy])) {
      ownedDecks.push(LEGACY_DECK_MAP[legacy]);
    }
  }
  const deck = validDecks.has(s.deck) ? s.deck : LEGACY_DECK_MAP[s.deck] ?? 'animals';
  useGame.setState({
    ownedDecks: [...new Set(ownedDecks)],
    deck,
  });
  s.ensureMissions();
  s.ensureWeekly();
  s.ensureTournament();
  audio.setMusicEnabled(s.music);
  audio.setSfxEnabled(s.sfx);
  audio.setHaptics(s.haptics);
  // anti-tamper reconcile: adopt the server's authoritative balance if it differs
  reconcileBalance(s.coins, (serverBalance) => useGame.setState({ coins: serverBalance }));
  useGame.setState({ hydrated: true });
}

// ---------- Non-reactive helpers ----------
export function todayMissionState() {
  const s = useGame.getState();
  s.ensureMissions();
  return {
    ids: useGame.getState().missionIds,
    progress: useGame.getState().missionProgress,
    claimed: useGame.getState().missionClaimed,
  };
}
