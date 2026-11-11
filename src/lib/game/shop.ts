// ============ Shop catalog — coins, skins, customization, bundles, VIP ============
// All cosmetics are pure CSS/SVG (data-* attributes on .game-root) — no external assets.
import type { BundleDef, Rarity, SkinId, BoardId, BgId, FxId, CharId } from './types';

export interface CatalogItem<ID extends string = string> {
  id: ID;
  price: number; // coins — 0 = free starter item
  rarity: Rarity;
  /** VIP-exclusive: only obtainable with an active VIP subscription */
  vipOnly?: boolean;
}

/** Rarity meta: label key suffix, gradient + text color for badges */
export const RARITY_META: Record<Rarity, { grad: string; ink: string; glow: string }> = {
  common: { grad: 'linear-gradient(180deg,#cfd8dc,#90a4ae)', ink: '#37474f', glow: 'rgba(144,164,174,.55)' },
  rare: { grad: 'linear-gradient(180deg,#81d4fa,#29b6f6)', ink: '#01579b', glow: 'rgba(41,182,246,.55)' },
  epic: { grad: 'linear-gradient(180deg,#ce93d8,#ab47bc)', ink: '#4a148c', glow: 'rgba(171,71,188,.6)' },
  legendary: { grad: 'linear-gradient(180deg,#ffe082,#ffa000)', ink: '#5d4037', glow: 'rgba(255,160,0,.65)' },
};

// ---------- Coin packs (demo purchase — honest & non-coercive) ----------
export interface CoinPackDef {
  id: 'pack_small' | 'pack_medium' | 'pack_large' | 'pack_mega' | 'pack_vip';
  coins: number;   // base coins
  bonusPct: number; // extra %
  best?: boolean;  // "best value" badge
  vip?: boolean;
  sku: string;        // in-app product id — define the exact same id in the market console (کافه بازار / مایکت)
  priceToman: number; // real-money price shown in the market
}
export const COIN_PACKS: CoinPackDef[] = [
  { id: 'pack_small', coins: 500, bonusPct: 0, sku: 'wg_coins_small', priceToman: 9000 },
  { id: 'pack_medium', coins: 1200, bonusPct: 5, sku: 'wg_coins_medium', priceToman: 19000 },
  { id: 'pack_large', coins: 3000, bonusPct: 10, sku: 'wg_coins_large', priceToman: 49000 },
  { id: 'pack_mega', coins: 8000, bonusPct: 20, sku: 'wg_coins_mega', priceToman: 99000 },
  { id: 'pack_vip', coins: 20000, bonusPct: 30, best: true, vip: true, sku: 'wg_coins_vip', priceToman: 249000 },
];
export const packTotalCoins = (p: CoinPackDef) => Math.round(p.coins * (1 + p.bonusPct / 100));

// ---------- Skins (tiles & card backs) ----------
export const SKINS: CatalogItem<SkinId>[] = [
  { id: 'classic', price: 0, rarity: 'common' },
  { id: 'pastel', price: 250, rarity: 'common' },
  { id: 'oceanic', price: 500, rarity: 'rare' },
  { id: 'neon', price: 700, rarity: 'rare' },
  { id: 'golden', price: 1200, rarity: 'epic' },
  { id: 'galaxyT', price: 1500, rarity: 'epic' },
  { id: 'rainbow', price: 2500, rarity: 'legendary' },
  { id: 'inferno', price: 2500, rarity: 'legendary' },
  { id: 'vipRoyal', price: 0, rarity: 'legendary', vipOnly: true }, // اسکین اختصاصی VIP — granted with the subscription
];

/** visual preview chips for skin cards/previews */
export const SKIN_SWATCH: Record<SkinId, string[]> = {
  classic: ['#ffffff', '#cbbde8', '#4a3b6b'],
  pastel: ['#fff1f7', '#c9f0ff', '#a78bcb'],
  oceanic: ['#e0f7ff', '#8fd8f2', '#0c5a7a'],
  neon: ['#101426', '#39ff88', '#ff3df2'],
  golden: ['#fff6d8', '#ffd75e', '#8a5a00'],
  galaxyT: ['#2a1d5e', '#9c6dff', '#ffffff'],
  rainbow: ['#ff5f6d', '#ffc371', '#47e5bc'],
  inferno: ['#2b0f0a', '#ff7043', '#ffd180'],
  vipRoyal: ['#1a1040', '#c9a227', '#f6e7b2'],
};

// ---------- Board styles (Word Hunter grid) ----------
export const BOARDS: CatalogItem<BoardId>[] = [
  { id: 'boardClassic', price: 0, rarity: 'common' },
  { id: 'paper', price: 300, rarity: 'common' },
  { id: 'darkBoard', price: 600, rarity: 'rare' },
  { id: 'wood', price: 900, rarity: 'epic' },
  { id: 'neonGrid', price: 1400, rarity: 'legendary' },
];

// ---------- Backgrounds (override sky) ----------
export const BGS: CatalogItem<BgId>[] = [
  { id: 'bgDefault', price: 0, rarity: 'common' },
  { id: 'sunset', price: 400, rarity: 'rare' },
  { id: 'night', price: 600, rarity: 'rare' },
  { id: 'meadowHills', price: 900, rarity: 'epic' },
  { id: 'underwater', price: 1200, rarity: 'legendary' },
];

export const BG_SWATCH: Record<BgId, string[]> = {
  bgDefault: ['#7bd3f7', '#d3f5c9'],
  sunset: ['#ff9d5c', '#ffd36e', '#e05a7a'],
  night: ['#0f1b4d', '#283a7a', '#7a5fb8'],
  meadowHills: ['#8bd3a8', '#5cb878', '#3a8a5f'],
  underwater: ['#0a6ea8', '#1ba8d8', '#7fe3e0'],
};

// ---------- Special FX (ambient particles) ----------
export const FXS: CatalogItem<FxId>[] = [
  { id: 'fxNone', price: 0, rarity: 'common' },
  { id: 'fxSparkle', price: 0, rarity: 'common' },
  { id: 'fxBubbles', price: 350, rarity: 'rare' },
  { id: 'fxHearts', price: 500, rarity: 'epic' },
  { id: 'fxStars', price: 1000, rarity: 'legendary' },
];

// ---------- Exclusive characters (companions) ----------
export const CHARS: CatalogItem<CharId>[] = [
  { id: 'mascot', price: 0, rarity: 'common' },
  { id: 'robokid', price: 1500, rarity: 'rare' },
  { id: 'dragonling', price: 2500, rarity: 'epic' },
  { id: 'fairy', price: 4000, rarity: 'legendary' },
  { id: 'astro', price: 5000, rarity: 'legendary' },
];

// ---------- Bundles (بسته‌های پیشنهادی — discount vs buying separately) ----------
export const BUNDLES: BundleDef[] = [
  {
    id: 'bundle_starter',
    sku: 'wg_bundle_starter',
    priceToman: 9900,
    contents: { coins: 300, hints: 1, skin: 'pastel' },
    price: 400, // pastel 250 + coins 300 + hint ~25 → value 575
    value: 575,
    tint: 'linear-gradient(135deg,#7be3a3,#38c172)',
  },
  {
    id: 'bundle_gold',
    sku: 'wg_bundle_gold',
    priceToman: 29000,
    contents: { coins: 800, hints: 2, skin: 'golden' },
    price: 1500, // golden 1200 + coins 800 + hints 50 → value 2050
    value: 2050,
    tint: 'linear-gradient(135deg,#ffd75e,#f5a300)',
  },
  {
    id: 'bundle_legend',
    sku: 'wg_bundle_legend',
    priceToman: 69000,
    contents: { coins: 1500, hints: 3, skin: 'rainbow', char: 'dragonling' },
    price: 5000, // rainbow 2500 + dragonling 2500 + coins 1500 + hints 75 → value 6575
    value: 6575,
    tint: 'linear-gradient(135deg,#9c6dff,#7a45e0)',
  },
];

// ---------- Chests (prize chests from playing) ----------
export type ChestKind = 'wooden' | 'silver' | 'gold';
export const CHESTS: Record<ChestKind, { coins: number; grad: string; deep: string }> = {
  wooden: { coins: 150, grad: 'linear-gradient(180deg,#d4a373,#a97142)', deep: '#7c5230' },
  silver: { coins: 350, grad: 'linear-gradient(180deg,#eceff1,#a7b8c4)', deep: '#7d8f9c' },
  gold: { coins: 700, grad: 'linear-gradient(180deg,#ffd75e,#f5a300)', deep: '#c47f00' },
};
/** levels completed needed for the next chest */
export const CHEST_STEP_LEVELS = 4;
export const CHESTS_PENDING_CAP = 3;
/** weighted roll for chest kind */
export function rollChestKind(rnd = Math.random): ChestKind {
  const r = rnd();
  if (r < 0.55) return 'wooden';
  if (r < 0.88) return 'silver';
  return 'gold';
}

// ---------- Market products (محصولات بازار — for the market developer console) ----------
/**
 * Registration sheet for in-app products in Cafe Bazaar / Myket (کافه بازار / مایکت).
 * `sku` must match the product id defined in the console exactly; prices are
 * suggested Toman price points (the console may ask for Rial = ×10).
 * Bigger packs give progressively cheaper coins (Toman per coin: 18 → 9.6).
 */
export interface MarketProduct {
  sku: string;
  kind: 'coins' | 'bundle' | 'vip';
  nameFa: string;
  nameEn: string;
  priceToman: number;
  detailFa: string;
  detailEn: string;
}

export const VIP_SKU = 'wg_vip_month';
export const VIP_PRICE_TOMAN = 59000;

const PACK_MARKET_META: Record<CoinPackDef['id'], { nameFa: string; nameEn: string; detailFa: string; detailEn: string }> = {
  pack_small: { nameFa: 'بسته کوچک سکه', nameEn: 'Small Coin Pack', detailFa: '500 سکه', detailEn: '500 coins' },
  pack_medium: { nameFa: 'بسته متوسط سکه', nameEn: 'Medium Coin Pack', detailFa: '1260 سکه (+5% جایزه)', detailEn: '1,260 coins (+5% bonus)' },
  pack_large: { nameFa: 'بسته بزرگ سکه', nameEn: 'Large Coin Pack', detailFa: '3300 سکه (+10% جایزه)', detailEn: '3,300 coins (+10% bonus)' },
  pack_mega: { nameFa: 'بسته عظیم سکه', nameEn: 'Mega Coin Pack', detailFa: '9600 سکه (+20% جایزه)', detailEn: '9,600 coins (+20% bonus)' },
  pack_vip: { nameFa: 'بسته VIP سکه', nameEn: 'VIP Coin Pack', detailFa: '26000 سکه (+30% جایزه)', detailEn: '26,000 coins (+30% bonus)' },
};

const BUNDLE_MARKET_META: Record<string, { nameFa: string; nameEn: string; detailFa: string; detailEn: string }> = {
  bundle_starter: { nameFa: 'بسته استارتر', nameEn: 'Starter Bundle', detailFa: '300 سکه + 1 راهنما + اسکین رؤیای پاستلی', detailEn: '300 coins + 1 hint + Pastel Dream skin' },
  bundle_gold: { nameFa: 'بسته طلایی', nameEn: 'Golden Bundle', detailFa: '800 سکه + 2 راهنما + اسکین طلای سلطنتی', detailEn: '800 coins + 2 hints + Royal Gold skin' },
  bundle_legend: { nameFa: 'بسته افسانه‌ای', nameEn: 'Legendary Bundle', detailFa: '1500 سکه + 3 راهنما + اسکین درخشش رنگین‌کمان + شخصیت اژدهاک', detailEn: '1,500 coins + 3 hints + Rainbow Shine skin + Draco Jr. char' },
};

export const MARKET_PRODUCTS: MarketProduct[] = [
  ...COIN_PACKS.map((p) => ({
    sku: p.sku, kind: 'coins' as const, priceToman: p.priceToman,
    ...PACK_MARKET_META[p.id],
  })),
  ...BUNDLES.map((b) => ({
    sku: b.sku, kind: 'bundle' as const, priceToman: b.priceToman,
    ...BUNDLE_MARKET_META[b.id],
  })),
  {
    sku: VIP_SKU,
    kind: 'vip' as const,
    nameFa: 'اشتراک VIP (۳۰ روزه)',
    nameEn: 'VIP Subscription (30 days)',
    priceToman: VIP_PRICE_TOMAN,
    detailFa: 'جایزه روزانه دوبرابر، اسکین و تم اختصاصی، مأموریت‌های ویژه',
    detailEn: 'Double daily rewards, exclusive skin & themes, special missions',
  },
];
