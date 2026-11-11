// ============ Shop 3D — Coins / Skins / Customization / VIP / Bundles ============
// Design rules (per spec): honest demo purchases, no ads shown without consent,
// no coercion, no dark patterns. Every purchase requires explicit user
// confirmation, every price is verified server-side, every item has a preview.
'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Gift, Check, Lock, Sparkles, ShoppingBag, ShieldCheck, Crown, Zap } from 'lucide-react';
import { useI18n, TopBar, CoinPill, GameButton, GameModal, SectionTitle } from './ui';
import { useGame, SHOP_AVATARS, SHOP_THEMES, SHOP_DECKS } from '@/lib/game/store';
import { VIP_PRICE, VIP_DAYS, FREE_DAILY_GIFT, SPIN_SEGMENTS, SPIN_MAX_REWARD } from '@/lib/game/economy';
import {
  COIN_PACKS, packTotalCoins, SKINS, BOARDS, BGS, FXS, CHARS, BUNDLES,
  RARITY_META, SKIN_SWATCH, BG_SWATCH, VIP_PRICE_TOMAN,
} from '@/lib/game/shop';
import { GameIcon, CoinIcon, CharBuddy, CHAR_ART } from '@/lib/game/art';
import { DECK_ICONS } from '@/lib/game/memoryEngine';
import { audio } from '@/lib/game/audio';
import { coinsFrom, burstAt } from '@/lib/game/fx-bus';
import { useToast } from '@/hooks/use-toast';
import type { Rarity, CosmeticKind } from '@/lib/game/types';

type ShopTab = 'coins' | 'skins' | 'custom';
type CustSub = 'decks' | 'board' | 'bg' | 'fx' | 'avatars' | 'chars' | 'themes';

interface PreviewTarget {
  kind: CosmeticKind | 'deck' | 'avatar' | 'theme' | 'pack' | 'bundle' | 'vip';
  id: string;
}

export function Shop({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  const coins = useGame((s) => s.coins);
  const [tab, setTab] = useState<ShopTab>('coins');
  const [preview, setPreview] = useState<PreviewTarget | null>(null);
  const [confirm, setConfirm] = useState<PreviewTarget | null>(null);

  const tabs: { id: ShopTab; label: string; icon: React.ReactNode }[] = [
    { id: 'coins', label: t('shopCoins'), icon: <CoinIcon className="w-4 h-4" /> },
    { id: 'skins', label: t('shopSkins'), icon: <Sparkles className="w-4 h-4" /> },
    { id: 'custom', label: t('shopCustom'), icon: <ShoppingBag className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col gap-3 pb-8">
      <TopBar title={t('shopTitle')} onBack={onBack} right={<CoinPill amount={coins} />} />

      {/* honest no-pressure notice */}
      <div className="glass-panel p-2.5 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: 'var(--green)' }} />
        <p className="text-[10px] font-bold opacity-70 leading-snug">
          {t('demoBuyDesc')}
        </p>
      </div>

      {/* 3D tabs */}
      <div className="grid grid-cols-3 gap-2">
        {tabs.map((x) => {
          const active = tab === x.id;
          return (
            <button
              key={x.id}
              className="rounded-2xl py-2.5 flex flex-col items-center gap-0.5 border-2 transition-all active:translate-y-1"
              style={{
                background: active
                  ? 'linear-gradient(180deg, color-mix(in srgb, var(--accent) 82%, #fff 18%), var(--accent))'
                  : 'var(--panel)',
                borderColor: active ? 'var(--accent-deep)' : 'var(--panel-border)',
                color: active ? '#fff' : 'var(--ink)',
                boxShadow: active ? '0 4px 0 var(--accent-deep)' : '0 4px 0 rgba(31,20,60,.08)',
              }}
              onClick={() => { audio.sfx('tick'); setTab(x.id); }}
            >
              {x.icon}
              <span className="text-[11px] font-black">{x.label}</span>
            </button>
          );
        })}
      </div>

      {tab === 'coins' && <CoinsTab onPreview={(tg) => setPreview(tg)} />}
      {tab === 'skins' && <SkinsTab onPreview={(id) => setPreview({ kind: 'skin', id })} />}
      {tab === 'custom' && <CustomTab onPreview={setPreview} />}

      {/* preview modal (before purchase — required) */}
      <PreviewModal target={preview} onClose={() => setPreview(null)} onBuy={(tg) => { setPreview(null); setConfirm(tg); }} />
      {/* purchase confirmation (required by spec) */}
      <ConfirmModal target={confirm} onClose={() => setConfirm(null)} />
    </div>
  );
}

// ============ shared atoms ============
function RarityBadge({ rarity }: { rarity: Rarity }) {
  const { t } = useI18n();
  const m = RARITY_META[rarity];
  return (
    <span
      className="chip !py-0.5 !px-2 !text-[9px] !font-black !border-white/50"
      style={{ background: m.grad, color: m.ink, textShadow: '0 1px 0 rgba(255,255,255,.35)' }}
    >
      {t(`rarity_${rarity}` as 'rarity_common')}
    </span>
  );
}

function PriceTag({ price }: { price: number }) {
  const { fmt } = useI18n();
  return (
    <span className="flex items-center gap-1 text-[11px] font-black" style={{ color: '#b07700' }}>
      <CoinIcon className="w-4 h-4" /> {price === 0 ? 'FREE' : fmt(price)}
    </span>
  );
}

/** A shop card: 3D visual + name + rarity + price + owned/equipped state */
function ItemCard({
  rarity, name, visual, price, owned, equipped, onClick, legendaryGlow, vipOnly,
}: {
  rarity?: Rarity;
  name: string;
  visual: React.ReactNode;
  price: number;
  owned: boolean;
  equipped: boolean;
  onClick: () => void;
  legendaryGlow?: boolean;
  vipOnly?: boolean;
}) {
  const { t } = useI18n();
  const glow = legendaryGlow && !owned;
  return (
    <button
      onClick={onClick}
      className={`glass-panel p-2.5 flex flex-col items-center gap-1.5 text-center transition-transform active:scale-95 relative ${equipped ? 'ring-2' : ''}`}
      style={{
        boxShadow: glow
          ? `0 0 0 3px ${RARITY_META.legendary.glow}, 0 8px 18px rgba(31,20,60,.2)`
          : vipOnly && !owned
            ? '0 0 0 3px rgba(255,179,0,.55), 0 8px 18px rgba(31,20,60,.18)'
            : undefined,
        borderColor: equipped ? 'var(--green)' : undefined,
      }}
    >
      {rarity && <div className="absolute top-1.5 start-1.5 z-10"><RarityBadge rarity={rarity} /></div>}
      {vipOnly && (
        <div className="absolute bottom-1.5 start-1.5 z-10">
          <span className="chip !py-0 !px-1.5 !text-[8px] !font-black !border-white/50"
            style={{ background: 'linear-gradient(180deg,#ffe082,#ffb300)', color: '#5d4037' }}>
            👑 VIP
          </span>
        </div>
      )}
      {equipped && (
        <span className="absolute top-1.5 end-1.5 z-10 w-6 h-6 rounded-full grid place-items-center border-2 border-white"
          style={{ background: 'var(--green)' }}>
          <Check className="w-3.5 h-3.5 text-white" />
        </span>
      )}
      {!owned && !equipped && (
        <span className="absolute top-1.5 end-1.5 z-10 w-6 h-6 rounded-full grid place-items-center bg-black/35 border-2 border-white/70">
          <Lock className="w-3 h-3 text-white" />
        </span>
      )}
      <div className={`w-full aspect-square rounded-xl grid place-items-center overflow-hidden ${owned ? '' : 'opacity-90'}`}
        style={{ background: 'rgba(255,255,255,.45)' }}>
        {visual}
      </div>
      <p className="font-black text-[11px] leading-tight">{name}</p>
      {equipped ? (
        <span className="text-[9px] font-black" style={{ color: 'var(--green)' }}>✓</span>
      ) : owned ? (
        <span className="text-[9px] font-bold opacity-60">✓ ✓</span>
      ) : vipOnly ? (
        <span className="text-[9px] font-black" style={{ color: '#b07700' }}>{t('vipExclusive')}</span>
      ) : (
        <PriceTag price={price} />
      )}
    </button>
  );
}

const PACK_RARITY = (id: string): Rarity =>
  id === 'pack_vip' ? 'legendary' : id === 'pack_mega' ? 'epic' : id === 'pack_large' ? 'rare' : 'common';

// ============ COINS tab ============
function CoinsTab({ onPreview }: { onPreview: (t: PreviewTarget) => void }) {
  const { t, fmt } = useI18n();
  const { toast } = useToast();
  const freeGiftDay = useGame((s) => s.freeGiftDay);
  const claimFreeGift = useGame((s) => s.claimFreeGift);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const giftClaimed = freeGiftDay === todayStr;

  return (
    <div className="flex flex-col gap-3">
      {/* free gift — no strings attached */}
      <div className="glass-panel glossy p-3 flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl grid place-items-center shrink-0 border-2 border-white/60"
          style={{ background: 'linear-gradient(180deg,#7be3a3,#38c172)' }}>
          <Gift className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-sm">{t('freeGift')}</p>
          <p className="text-[10px] font-bold opacity-60">{t('freeGiftDesc')}</p>
        </div>
        <GameButton
          size="sm"
          variant="green"
          disabled={giftClaimed}
          onClick={(e) => {
            const got = claimFreeGift();
            if (got) {
              audio.sfx('coin');
              coinsFrom(e.currentTarget, 10);
              toast({ title: t('adDone', { n: fmt(got) }) });
            }
          }}
        >
          {giftClaimed ? <Check className="w-4 h-4" /> : `+${fmt(FREE_DAILY_GIFT)}`}
        </GameButton>
      </div>

      {/* VIP subscription (اشتراک VIP) */}
      <VipCard onPreview={(id) => onPreview({ kind: 'vip', id })} />

      {/* daily spin wheel (چرخ شانس روزانه — سقف جایزه ۵۰ سکه) */}
      <DailySpinCard />

      {/* bundles (بسته‌های پیشنهادی) */}
      <BundlesSection onPreview={(id) => onPreview({ kind: 'bundle', id })} />

      <SectionTitle icon={<CoinIcon className="w-5 h-5" />}>{t('shopCoins')}</SectionTitle>

      {/* 5 packs — Small / Medium / Large / Mega / VIP */}
      <div className="flex flex-col gap-2.5">
        {COIN_PACKS.map((pack) => {
          const total = packTotalCoins(pack);
          const m = RARITY_META[PACK_RARITY(pack.id)];
          return (
            <button
              key={pack.id}
              className="glass-panel p-3 flex items-center gap-3 text-start transition-transform active:scale-[.98] relative overflow-hidden"
              style={{ boxShadow: `0 0 0 2px ${m.glow}, 0 8px 18px rgba(31,20,60,.14)` }}
              onClick={() => { audio.sfx('pop'); onPreview({ kind: 'pack', id: pack.id }); }}
            >
              {pack.best && (
                <span className="absolute top-0 end-0 px-2 py-0.5 rounded-bl-2xl rtl:rounded-br-2xl text-[9px] font-black text-white"
                  style={{ background: 'linear-gradient(90deg,#ff7043,#f4511e)' }}>
                  ★ {t('bestValue')}
                </span>
              )}
              <div className="w-16 h-16 rounded-2xl shrink-0 border-2 border-white/70 relative overflow-hidden"
                style={{ background: m.grad }}>
                <div className="absolute inset-0 grid place-items-center">
                  <div className="pack-mini">
                    <CoinIcon className="w-9 h-9 pack-coin-face relative z-10" />
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm">{t(`pack_${pack.id.split('_')[1]}` as 'pack_small')}</p>
                <p className="text-[10px] font-bold opacity-60 leading-tight">{t(`packDesc_${pack.id.split('_')[1]}` as 'packDesc_small')}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-[12px] font-black" style={{ color: '#b07700' }}>
                    <CoinIcon className="w-4 h-4" /> {fmt(total)}
                  </span>
                  {pack.bonusPct > 0 && (
                    <span className="chip !py-0 !px-1.5 !text-[9px]" style={{ background: 'linear-gradient(180deg,#d9f5e3,#b9ecc9)', color: '#1f7a45', borderColor: '#38c172' }}>
                      {t('packBonus', { n: fmt(pack.bonusPct) })}
                    </span>
                  )}
                  <span className="chip !py-0 !px-1.5 !text-[9px]" style={{ background: 'linear-gradient(180deg,#e0f7fa,#b2ebf2)', color: '#0b7285', borderColor: '#26c6da' }}>
                    {fmt(pack.priceToman)} {t('tomanUnit')}
                  </span>
                </div>
              </div>
              <span className="btn3d btn3d-sm btn3d-gold shrink-0 !text-[10px] pointer-events-none">{t('preview')} 👁</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- VIP subscription card ----------
const VIP_BENEFITS: { icon: string; key: 'vipB1' | 'vipB2' | 'vipB3' | 'vipB4' | 'vipB5' }[] = [
  { icon: '🎁', key: 'vipB1' }, // جایزه روزانه بیشتر
  { icon: '💜', key: 'vipB2' }, // اسکین اختصاصی
  { icon: '🎯', key: 'vipB3' }, // مأموریت‌های ویژه
  { icon: '🎨', key: 'vipB4' }, // تم‌های خاص
  { icon: '🚫', key: 'vipB5' }, // حذف تبلیغات
];

function VipCard({ onPreview }: { onPreview: (id: string) => void }) {
  const { t, fmt, lang } = useI18n();
  const vipUntil = useGame((s) => s.vipUntil);
  const active = (vipUntil ?? 0) > Date.now();

  return (
    <button
      className="glass-panel glossy p-3 relative overflow-hidden text-start transition-transform active:scale-[.98]"
      style={{
        background: active
          ? 'linear-gradient(135deg, rgba(255,224,130,.5), rgba(255,179,0,.35))'
          : 'linear-gradient(135deg, rgba(156,109,255,.28), rgba(255,213,79,.28))',
        boxShadow: '0 0 0 2.5px rgba(255,179,0,.55), 0 10px 20px rgba(31,20,60,.18)',
      }}
      onClick={() => { audio.sfx('pop'); onPreview('vip'); }}
    >
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-2xl grid place-items-center shrink-0 border-2 border-white/70 relative"
          style={{ background: 'linear-gradient(180deg,#ffe082,#ffb300)' }}>
          <Crown className="w-7 h-7 text-white drop-shadow" />
          {active && <span className="absolute -top-1.5 -end-1.5 w-5 h-5 rounded-full bg-green-500 border-2 border-white grid place-items-center"><Check className="w-3 h-3 text-white" /></span>}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-sm flex items-center gap-1.5">
            {t('vipTitle')}
            <span className="chip !py-0 !px-1.5 !text-[8px]" style={{ background: 'linear-gradient(180deg,#ffe082,#ffb300)', color: '#5d4037' }}>
              {fmt(VIP_DAYS)} {lang === 'fa' ? 'روز' : 'days'}
            </span>
          </p>
          <p className="text-[10px] font-bold opacity-70 leading-tight mt-0.5">
            {active ? t('vipActiveUntil', { d: new Date(vipUntil!).toLocaleDateString(lang === 'fa' ? 'fa-IR' : 'en-US') }) : t('vipDesc')}
          </p>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {VIP_BENEFITS.map((b) => (
              <span key={b.key} className="chip !py-0 !px-1.5 !text-[9px] !font-bold">
                {b.icon} {t(b.key)}
              </span>
            ))}
          </div>
        </div>
        <span className={`btn3d btn3d-sm shrink-0 !text-[10px] pointer-events-none ${active ? 'btn3d-green' : 'btn3d-gold'}`}>
          {active ? `👑 ${t('vipActive')}` : `+${fmt(VIP_PRICE)} 🪙`}
        </span>
      </div>
    </button>
  );
}

// ---------- daily spin wheel (چرخ شانس روزانه — یک بار در روز، حداکثر ۵۰ سکه) ----------
const WHEEL_COLORS = ['#42a5f5', '#38c172', '#ab8cff', '#ffb300', '#ff7043', '#26c6da', '#ec407a', '#5c6bc0'];

function DailySpinCard() {
  const { t, fmt } = useI18n();
  const { toast } = useToast();
  const spinDay = useGame((s) => s.spinDay);
  const spinDailyWheel = useGame((s) => s.spinDailyWheel);
  const wheelRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [justWon, setJustWon] = useState<number | null>(null);

  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const spunToday = spinDay === todayKey;

  const seg = 360 / SPIN_SEGMENTS.length;
  const pt = (deg: number, r: number): [number, number] => {
    const rad = (deg * Math.PI) / 180;
    return [100 + r * Math.cos(rad), 100 + r * Math.sin(rad)];
  };

  const doSpin = () => {
    if (spinning || spunToday) return;
    audio.sfx('click');
    setSpinning(true);
    const got = spinDailyWheel(); // store decides the reward (≤ 50) once per day
    if (got == null) { setSpinning(false); return; }
    const idx = SPIN_SEGMENTS.indexOf(got);
    // 5 full turns, then land the winning segment's center under the top pointer
    setRotation(360 * 5 + (360 - (idx * seg + seg / 2)));
    setTimeout(() => {
      setSpinning(false);
      setJustWon(got);
      audio.sfx('coin');
      if (wheelRef.current) coinsFrom(wheelRef.current, 12);
      toast({ title: t('spinWon', { n: fmt(got) }) });
    }, 3500);
  };

  return (
    <div className="glass-panel glossy p-3 flex items-center gap-3">
      {/* wheel + pointer */}
      <div ref={wheelRef} className="relative shrink-0 w-[116px] h-[116px]">
        <div className="absolute top-[-5px] left-1/2 -translate-x-1/2 z-10 w-0 h-0"
          style={{
            borderLeft: '7px solid transparent', borderRight: '7px solid transparent',
            borderTop: '13px solid #ff7043', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.35))',
          }} />
        <svg viewBox="0 0 200 200" className="w-full h-full" style={{ filter: 'drop-shadow(0 3px 8px rgba(31,20,60,.25))' }}>
          <g style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: '100px 100px',
            transformBox: 'view-box',
            transition: 'transform 3.4s cubic-bezier(0.12, 0.8, 0.22, 1)',
          }}>
            {SPIN_SEGMENTS.map((v, i) => {
              const a0 = i * seg - 90;
              const [x0, y0] = pt(a0, 96);
              const [x1, y1] = pt(a0 + seg, 96);
              const [lx, ly] = pt(a0 + seg / 2, 62);
              return (
                <g key={i}>
                  <path
                    d={`M100 100 L${x0.toFixed(2)} ${y0.toFixed(2)} A96 96 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`}
                    fill={WHEEL_COLORS[i % WHEEL_COLORS.length]} stroke="#fff" strokeWidth="2.5" />
                  <text x={lx.toFixed(2)} y={ly.toFixed(2)} textAnchor="middle" dominantBaseline="central"
                    fontSize="15" fontWeight="900" fill="#fff"
                    stroke="rgba(0,0,0,.3)" strokeWidth="3.5" style={{ paintOrder: 'stroke' }}>
                    {fmt(v)}
                  </text>
                </g>
              );
            })}
          </g>
          {/* hub with star */}
          <circle cx="100" cy="100" r="21" fill="#fff" stroke="rgba(31,20,60,.2)" strokeWidth="2" />
          <polygon
            points="100,87 103.23,95.55 112.36,95.98 105.23,101.7 107.64,110.52 100,105.5 92.36,110.52 94.77,101.7 87.64,95.98 96.77,95.55"
            fill="#ffb300" stroke="#f57c00" strokeWidth="1" />
        </svg>
      </div>

      {/* text + action */}
      <div className="flex-1 min-w-0">
        <p className="font-black text-sm">{t('spinTitle')}</p>
        <p className="text-[10px] font-bold opacity-60 leading-tight">{t('spinDesc', { n: fmt(SPIN_MAX_REWARD) })}</p>
        {justWon != null && (
          <div className="mt-1.5 flex items-center gap-1 text-[13px] font-black" style={{ color: '#b07700' }}>
            <CoinIcon className="w-4 h-4" /> +{fmt(justWon)}
          </div>
        )}
        <GameButton
          size="sm"
          variant="gold"
          disabled={spinning || spunToday}
          className="mt-1.5 !py-1.5"
          onClick={doSpin}
        >
          {spinning ? t('spinSpinning') : spunToday ? t('spinComeBack') : t('spinCta')}
        </GameButton>
      </div>
    </div>
  );
}

// ---------- bundles (بسته‌های پیشنهادی) ----------
function BundlesSection({ onPreview }: { onPreview: (id: string) => void }) {
  const { t, fmt } = useI18n();
  const bundlesOwned = useGame((s) => s.bundlesOwned);

  return (
    <div className="flex flex-col gap-2">
      <SectionTitle icon={<Zap className="w-5 h-5" />}>{t('bundlesTitle')}</SectionTitle>
      {BUNDLES.map((b) => {
        const owned = bundlesOwned.includes(b.id);
        const save = Math.round(((b.value - b.price) / b.value) * 100);
        return (
          <button
            key={b.id}
            disabled={owned}
            className="glass-panel p-3 flex items-center gap-3 text-start transition-transform active:scale-[.98] relative overflow-hidden disabled:opacity-70"
            style={{ boxShadow: `0 0 0 2px ${b.tint.replace('linear-gradient(135deg,', '').split(',')[0]}55, 0 8px 18px rgba(31,20,60,.14)` }}
            onClick={() => { audio.sfx('pop'); onPreview(b.id); }}
          >
            <div className="w-16 h-16 rounded-2xl shrink-0 border-2 border-white/70 grid place-items-center relative overflow-hidden"
              style={{ background: b.tint }}>
              <Zap className="w-8 h-8 text-white drop-shadow" />
              {!owned && (
                <span className="absolute bottom-0 inset-x-0 text-center text-[9px] font-black text-white py-0.5"
                  style={{ background: 'rgba(0,0,0,.35)' }}>
                  −{fmt(save)}%
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm">{t(`bundle_${b.id.split('_')[1]}` as 'bundle_starter')}</p>
              <p className="text-[10px] font-bold opacity-60 leading-tight">
                {[
                  b.contents.coins ? `🪙 +${fmt(b.contents.coins)}` : '',
                  b.contents.hints ? `💡 ×${fmt(b.contents.hints)}` : '',
                  b.contents.skin ? `✨ ${t(`skin_${b.contents.skin}` as 'skin_classic')}` : '',
                  b.contents.char ? `🐱 ${t(`char_${b.contents.char}` as 'char_mascot')}` : '',
                ].filter(Boolean).join(' · ')}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex items-center gap-1 text-[12px] font-black" style={{ color: '#b07700' }}>
                  <CoinIcon className="w-4 h-4" /> {fmt(b.price)}
                </span>
                <span className="text-[10px] font-bold line-through opacity-45">{fmt(b.value)}</span>
                <span className="chip !py-0 !px-1.5 !text-[9px]" style={{ background: 'linear-gradient(180deg,#e0f7fa,#b2ebf2)', color: '#0b7285', borderColor: '#26c6da' }}>
                  {fmt(b.priceToman)} {t('tomanUnit')}
                </span>
              </div>
            </div>
            {owned ? (
              <span className="chip !py-1 !px-2 !text-[10px] shrink-0" style={{ background: 'linear-gradient(180deg,#d9f5e3,#b9ecc9)', color: '#1f7a45' }}>✓</span>
            ) : (
              <span className="btn3d btn3d-sm btn3d-gold shrink-0 !text-[10px] pointer-events-none">{t('preview')} 👁</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ============ SKINS tab ============
function SkinVisual({ id, size = 64 }: { id: string; size?: number }) {
  const sw = SKIN_SWATCH[id as keyof typeof SKIN_SWATCH] ?? SKIN_SWATCH.classic;
  return (
    <div style={{ perspective: 260 }}>
      <div
        className="skin-tile"
        style={{
          width: size, height: size,
          background: `linear-gradient(160deg, ${sw[0]}, ${sw[1]})`,
          color: sw[2],
          boxShadow: `inset 0 -${size / 10}px 0 ${sw[2]}55, 0 6px 10px rgba(31,20,60,.25)`,
        }}
      >
        <span style={{ fontSize: size * 0.42 }}>ب</span>
      </div>
    </div>
  );
}

function SkinsTab({ onPreview }: { onPreview: (id: string) => void }) {
  const { t } = useI18n();
  const owned = useGame((s) => s.owned.skin);
  const equipped = useGame((s) => s.equipped.skin);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] font-bold opacity-70 px-1">{t('shopSkins')} · {t('rarity_legendary')} → {t('rarity_common')}</p>
      <div className="grid grid-cols-3 gap-2.5">
        {SKINS.map((s) => (
          <ItemCard
            key={s.id}
            rarity={s.rarity}
            name={t(`skin_${s.id}` as 'skin_classic')}
            visual={<SkinVisual id={s.id} />}
            price={s.price}
            owned={owned.includes(s.id)}
            equipped={equipped === s.id}
            legendaryGlow={s.rarity === 'legendary'}
            vipOnly={s.vipOnly}
            onClick={() => { audio.sfx('pop'); onPreview(s.id); }}
          />
        ))}
      </div>
    </div>
  );
}

// ============ CUSTOMIZATION tab ============
const DECK_PREVIEW: Record<string, string[]> = {
  animals: ['owl', 'fox', 'panda'],
  fruits: ['apple', 'banana', 'cherry'],
  sweets: ['candy', 'donut', 'cupcake'],
  fantasy: ['mblue', 'unicorn', '🧙'],
  vehicles: ['🚗', '✈️', '⛵'],
  objects: ['🎒', '⌚', '💡'],
  emojis: ['😀', '😍', '🥳'],
  nature: ['🌸', '🌙', '🌋'],
  colorful: ['🌈', '🎈', '✨'],
};

function BoardVisual({ id, size = 64 }: { id: string; size?: number }) {
  const cell = size / 3 - 3;
  const styles: Record<string, { bg: string; tile: string; ink: string; gap: number; pad: number; radius: number }> = {
    boardClassic: { bg: 'rgba(255,255,255,.4)', tile: '#fff', ink: '#4a3b6b', gap: 3, pad: 6, radius: 10 },
    paper: { bg: 'repeating-linear-gradient(0deg,#fdf6e3,#fdf6e3 7px,#b3c6e7 8px),repeating-linear-gradient(90deg,#fdf6e3,#fdf6e3 7px,transparent 8px)', tile: '#fffdf5', ink: '#546e7a', gap: 3, pad: 6, radius: 4 },
    darkBoard: { bg: '#2f3b2f', tile: '#37453a', ink: '#f5f1e6', gap: 3, pad: 7, radius: 8 },
    wood: { bg: 'linear-gradient(180deg,#c89060,#a97142)', tile: 'linear-gradient(180deg,#e8b87d,#d19f63)', ink: '#5d3a1a', gap: 4, pad: 7, radius: 6 },
    neonGrid: { bg: '#0d1024', tile: '#151a38', ink: '#39ff88', gap: 3, pad: 8, radius: 12 },
  };
  const st = styles[id] ?? styles.boardClassic;
  return (
    <div style={{
      width: size, height: size, background: st.bg, borderRadius: st.radius,
      padding: st.pad, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: st.gap,
      boxShadow: '0 5px 10px rgba(31,20,60,.22), inset 0 0 0 2px rgba(255,255,255,.25)',
    }}>
      {Array.from({ length: 9 }).map((_, i) => (
        <span key={i} style={{
          background: st.tile, borderRadius: Math.max(2, st.radius - 5),
          display: 'grid', placeItems: 'center',
          fontSize: cell * 0.62, fontWeight: 900, color: st.ink,
          boxShadow: 'inset 0 -2px 0 rgba(0,0,0,.14)',
        }}>
          {'برینکو'[i % 6]}
        </span>
      ))}
    </div>
  );
}

function BgVisual({ id, size = 64 }: { id: string; size?: number }) {
  const grads: Record<string, string> = {
    bgDefault: 'linear-gradient(180deg,#7bd3f7,#d3f5c9)',
    sunset: 'linear-gradient(180deg,#ff9d5c,#ffd36e 55%,#e05a7a)',
    night: 'linear-gradient(180deg,#0f1b4d,#283a7a 60%,#7a5fb8)',
    meadowHills: 'linear-gradient(180deg,#8bd3a8,#5cb878 55%,#3a8a5f)',
    underwater: 'linear-gradient(180deg,#0a6ea8,#1ba8d8 60%,#7fe3e0)',
  };
  return (
    <div style={{
      width: size, height: size * 0.82, borderRadius: 10,
      background: grads[id] ?? grads.bgDefault,
      boxShadow: 'inset 0 0 0 2px rgba(255,255,255,.5), 0 5px 10px rgba(31,20,60,.2)',
      position: 'relative', overflow: 'hidden',
    }}>
      <span className="absolute rounded-full" style={{ width: 12, height: 12, top: 7, insetInlineEnd: 8, background: id === 'night' ? '#fff' : '#fff8b0', boxShadow: '0 0 6px #fff8' }} />
      {id === 'underwater' && <span className="absolute rounded-full" style={{ width: 8, height: 8, bottom: 8, insetInlineStart: 10, background: '#ffffffaa' }} />}
    </div>
  );
}

function FxVisual({ id, size = 64 }: { id: string; size?: number }) {
  const dots: Record<string, string[]> = {
    fxNone: [],
    fxSparkle: ['#fff', '#ffe082', '#ffd54f'],
    fxBubbles: ['#81d4fa', '#4fc3f7', '#b3e5fc'],
    fxHearts: ['#f48fb1', '#f06292', '#ff8a80'],
    fxStars: ['#ffd54f', '#fff176', '#ffb300'],
  };
  const colors = dots[id] ?? [];
  return (
    <div className="relative" style={{ width: size, height: size, background: 'linear-gradient(180deg,#20304e,#3b2a72)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 5px 10px rgba(31,20,60,.25)' }}>
      {colors.map((c, i) => (
        <span
          key={i}
          className="fx-demo"
          style={{
            color: c, background: id === 'fxBubbles' ? c : 'transparent',
            insetInlineStart: 8 + i * ((size - 20) / Math.max(colors.length - 1, 1)),
            animationDelay: `${i * 0.55}s`,
            borderRadius: '50%',
            width: id === 'fxBubbles' ? 8 : 10, height: id === 'fxBubbles' ? 8 : 10,
            fontSize: 11, lineHeight: '10px', textAlign: 'center',
          }}
        >
          {id === 'fxHearts' ? '♥' : id === 'fxStars' ? '★' : id === 'fxSparkle' ? '✦' : ''}
        </span>
      ))}
      {id === 'fxNone' && <span className="absolute inset-0 grid place-items-center text-white/70 font-black" style={{ fontSize: 10 }}>—</span>}
    </div>
  );
}

function CharVisual({ id, size = 64 }: { id: string; size?: number }) {
  return (
    <div className="mascot-wrap" style={{ width: size, height: size }}>
      <CharBuddy char={id} className="w-full h-full" />
    </div>
  );
}

/** mini theme preview — the 3 signature colors of each theme */
const THEME_SWATCH: Record<string, string[]> = {
  meadow: ['#7bd3f7', '#d3f5c9', '#ff8a3d'],
  ocean: ['#64c6f4', '#a8e9f0', '#0fb3c8'],
  candy: ['#ffb6d5', '#ffd9e8', '#f0568f'],
  forest: ['#6fce9a', '#c3e8b5', '#47a025'],
  galaxy: ['#2a1d5e', '#4a2f8f', '#a37bff'],
  royal: ['#3b2a72', '#c9a227', '#f6e7b2'],
  aurora: ['#0f3b3a', '#38d39f', '#9c6dff'],
};

function ThemeVisual({ id, size = 64 }: { id: string; size?: number }) {
  const sw = THEME_SWATCH[id] ?? THEME_SWATCH.meadow;
  return (
    <div style={{
      width: size, height: size * 0.82, borderRadius: 10, overflow: 'hidden', position: 'relative',
      background: `linear-gradient(180deg, ${sw[0]}, ${sw[1]})`,
      boxShadow: 'inset 0 0 0 2px rgba(255,255,255,.5), 0 5px 10px rgba(31,20,60,.2)',
    }}>
      <span className="absolute rounded-full" style={{ width: 14, height: 14, top: 6, insetInlineEnd: 8, background: sw[2], boxShadow: `0 0 8px ${sw[2]}` }} />
      <span className="absolute rounded-xl" style={{ width: size * 0.4, height: 8, bottom: 8, insetInlineStart: 8, background: 'rgba(255,255,255,.75)' }} />
    </div>
  );
}

function CustomTab({ onPreview }: { onPreview: (t: PreviewTarget) => void }) {
  const { t } = useI18n();
  const [sub, setSub] = useState<CustSub>('decks');
  const ownedAvatars = useGame((s) => s.ownedAvatars);
  const ownedThemes = useGame((s) => s.ownedThemes);
  const ownedDecks = useGame((s) => s.ownedDecks);
  const avatar = useGame((s) => s.avatar);
  const deck = useGame((s) => s.deck);
  const theme = useGame((s) => s.theme);
  const owned = useGame((s) => s.owned);
  const equipped = useGame((s) => s.equipped);

  const subs: { id: CustSub; label: string }[] = [
    { id: 'decks', label: t('custCards') },
    { id: 'board', label: t('custBoard') },
    { id: 'bg', label: t('custBg') },
    { id: 'fx', label: t('custFx') },
    { id: 'avatars', label: t('custAvatars') },
    { id: 'chars', label: t('custChars') },
    { id: 'themes', label: t('shopThemes') },
  ];

  return (
    <div className="flex flex-col gap-2.5">
      {/* sub-category chips */}
      <div className="flex gap-1.5 overflow-x-auto nice-scroll pb-1 -mx-1 px-1">
        {subs.map((x) => {
          const active = sub === x.id;
          return (
            <button
              key={x.id}
              onClick={() => { audio.sfx('tick'); setSub(x.id); }}
              className="chip shrink-0 !text-[11px] !font-black transition-transform"
              style={{
                background: active ? 'var(--accent)' : 'var(--panel-strong)',
                color: active ? '#fff' : 'var(--ink)',
                borderColor: active ? 'var(--accent-deep)' : 'var(--panel-border)',
              }}
            >
              {x.label}
            </button>
          );
        })}
      </div>

      {sub === 'decks' && (
        <div className="grid grid-cols-3 gap-2.5">
          {SHOP_DECKS.map((d) => (
            <ItemCard
              key={d.id}
              name={t(`deck_${d.id}` as 'deck_animals')}
              visual={
                <div className="flex -space-x-2 rtl:space-x-reverse items-center justify-center">
                  {(DECK_PREVIEW[d.id] ?? []).map((icon) => (
                    <span key={icon} className="w-7 h-7 rounded-lg border-2 border-white/80 bg-white/70 grid place-items-center">
                      <GameIcon name={icon} className="w-5 h-5" />
                    </span>
                  ))}
                </div>
              }
              price={d.price}
              owned={ownedDecks.includes(d.id)}
              equipped={deck === d.id}
              onClick={() => { audio.sfx('pop'); onPreview({ kind: 'deck', id: d.id }); }}
            />
          ))}
        </div>
      )}

      {sub === 'board' && (
        <div className="grid grid-cols-3 gap-2.5">
          {BOARDS.map((b) => (
            <ItemCard
              key={b.id}
              rarity={b.rarity}
              name={t(`board_${b.id}` as 'board_boardClassic')}
              visual={<BoardVisual id={b.id} />}
              price={b.price}
              owned={owned.board.includes(b.id)}
              equipped={equipped.board === b.id}
              legendaryGlow={b.rarity === 'legendary'}
              onClick={() => { audio.sfx('pop'); onPreview({ kind: 'board', id: b.id }); }}
            />
          ))}
        </div>
      )}

      {sub === 'bg' && (
        <div className="grid grid-cols-3 gap-2.5">
          {BGS.map((b) => (
            <ItemCard
              key={b.id}
              rarity={b.rarity}
              name={t(`bg_${b.id}` as 'bg_bgDefault')}
              visual={<BgVisual id={b.id} />}
              price={b.price}
              owned={owned.bg.includes(b.id)}
              equipped={equipped.bg === b.id}
              legendaryGlow={b.rarity === 'legendary'}
              onClick={() => { audio.sfx('pop'); onPreview({ kind: 'bg', id: b.id }); }}
            />
          ))}
        </div>
      )}

      {sub === 'fx' && (
        <div className="grid grid-cols-3 gap-2.5">
          {FXS.map((f) => (
            <ItemCard
              key={f.id}
              rarity={f.rarity}
              name={t(`fx_${f.id}` as 'fx_fxNone')}
              visual={<FxVisual id={f.id} />}
              price={f.price}
              owned={owned.fx.includes(f.id)}
              equipped={equipped.fx === f.id}
              legendaryGlow={f.rarity === 'legendary'}
              onClick={() => { audio.sfx('pop'); onPreview({ kind: 'fx', id: f.id }); }}
            />
          ))}
        </div>
      )}

      {sub === 'avatars' && (
        <div className="grid grid-cols-3 gap-2.5">
          {SHOP_AVATARS.map((a) => (
            <ItemCard
              key={a.id}
              name={t(`avatar_${a.id}` as 'avatar_owl')}
              visual={<GameIcon name={a.id} className="w-[70%] h-[70%]" />}
              price={a.price}
              owned={ownedAvatars.includes(a.id)}
              equipped={avatar === a.id}
              onClick={() => { audio.sfx('pop'); onPreview({ kind: 'avatar', id: a.id }); }}
            />
          ))}
        </div>
      )}

      {sub === 'chars' && (
        <div className="grid grid-cols-3 gap-2.5">
          {CHARS.map((c) => (
            <ItemCard
              key={c.id}
              rarity={c.rarity}
              name={t(`char_${c.id}` as 'char_mascot')}
              visual={<CharVisual id={c.id} />}
              price={c.price}
              owned={owned.char.includes(c.id)}
              equipped={equipped.char === c.id}
              legendaryGlow={c.rarity === 'legendary'}
              onClick={() => { audio.sfx('pop'); onPreview({ kind: 'char', id: c.id }); }}
            />
          ))}
        </div>
      )}

      {sub === 'themes' && (
        <div className="grid grid-cols-3 gap-2.5">
          {SHOP_THEMES.map((th) => (
            <ItemCard
              key={th.id}
              name={t(`theme_${th.id}` as 'theme_meadow')}
              visual={<ThemeVisual id={th.id} size={56} />}
              price={th.price}
              owned={ownedThemes.includes(th.id)}
              equipped={theme === th.id}
              vipOnly={th.vipOnly}
              onClick={() => { audio.sfx('pop'); onPreview({ kind: 'theme', id: th.id }); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============ Preview modal (before purchase) ============
function PreviewVisual({ target, big }: { target: PreviewTarget; big?: boolean }) {
  const size = big ? 110 : 64;
  switch (target.kind) {
    case 'skin': return <SkinVisual id={target.id} size={size} />;
    case 'board': return <BoardVisual id={target.id} size={size} />;
    case 'bg': return <BgVisual id={target.id} size={size} />;
    case 'fx': return <FxVisual id={target.id} size={size} />;
    case 'char': return <CharVisual id={target.id} size={size} />;
    case 'avatar': return <GameIcon name={target.id} className="w-24 h-24" />;
    case 'deck': return (
      <div className="flex -space-x-3 rtl:space-x-reverse">
        {(DECK_PREVIEW[target.id] ?? []).map((icon) => (
          <span key={icon} className="w-14 h-14 rounded-xl border-2 border-white/80 bg-white/70 grid place-items-center shadow-md">
            <GameIcon name={icon} className="w-10 h-10" />
          </span>
        ))}
      </div>
    );
    case 'pack': {
      const pack = COIN_PACKS.find((p) => p.id === target.id);
      const m = RARITY_META[PACK_RARITY(pack?.id ?? 'pack_small')];
      return (
        <div className="grid place-items-center gap-1">
          <div className="w-24 h-24 rounded-3xl grid place-items-center border-4 border-white shadow-xl pack-mini" style={{ background: m.grad }}>
            <CoinIcon className="w-16 h-16 pack-coin-face" />
          </div>
        </div>
      );
    }
    case 'vip': {
      return (
        <div className="grid place-items-center">
          <div className="w-24 h-24 rounded-3xl grid place-items-center border-4 border-white shadow-xl"
            style={{ background: 'linear-gradient(180deg,#ffe082,#ffb300)' }}>
            <Crown className="w-14 h-14 text-white drop-shadow" />
          </div>
        </div>
      );
    }
    case 'bundle': {
      const b = BUNDLES.find((x) => x.id === target.id);
      return (
        <div className="grid place-items-center">
          <div className="w-24 h-24 rounded-3xl grid place-items-center border-4 border-white shadow-xl relative overflow-hidden"
            style={{ background: b?.tint ?? 'linear-gradient(135deg,#9c6dff,#7a45e0)' }}>
            <Zap className="w-14 h-14 text-white drop-shadow" />
          </div>
        </div>
      );
    }
    default: return null;
  }
}

/** real-money price (Toman) for market products — null for in-game-only items */
function marketPriceOf(tgt: PreviewTarget): number | null {
  if (tgt.kind === 'pack') return COIN_PACKS.find((p) => p.id === tgt.id)?.priceToman ?? null;
  if (tgt.kind === 'bundle') return BUNDLES.find((b) => b.id === tgt.id)?.priceToman ?? null;
  if (tgt.kind === 'vip') return VIP_PRICE_TOMAN;
  return null;
}

function PreviewModal({
  target, onClose, onBuy,
}: {
  target: PreviewTarget | null;
  onClose: () => void;
  onBuy: (t: PreviewTarget) => void;
}) {
  const { t, fmt, lang } = useI18n();
  const coins = useGame((s) => s.coins);
  const ownedAvatars = useGame((s) => s.ownedAvatars);
  const ownedThemes = useGame((s) => s.ownedThemes);
  const ownedDecks = useGame((s) => s.ownedDecks);
  const owned = useGame((s) => s.owned);
  const equipped = useGame((s) => s.equipped);
  const avatar = useGame((s) => s.avatar);
  const deck = useGame((s) => s.deck);
  const theme = useGame((s) => s.theme);

  const info = useMemo(() => {
    if (!target) return null;
    if (target.kind === 'pack') {
      const pack = COIN_PACKS.find((p) => p.id === target.id)!;
      return {
        rarity: PACK_RARITY(pack.id) as Rarity, price: 0, owned: false, equipped: false,
        name: t(`pack_${pack.id.split('_')[1]}` as 'pack_small'),
        desc: t(`packDesc_${pack.id.split('_')[1]}` as 'packDesc_small'),
        catalog: null, pack,
      };
    }
    if (target.kind === 'vip') {
      return {
        rarity: 'legendary' as Rarity, price: VIP_PRICE, owned: false, equipped: false,
        name: t('vipTitle'),
        desc: t('vipDesc'),
        catalog: null, pack: null,
      };
    }
    if (target.kind === 'bundle') {
      const b = BUNDLES.find((x) => x.id === target.id)!;
      return {
        rarity: undefined, price: b.price, owned: false, equipped: false,
        name: t(`bundle_${b.id.split('_')[1]}` as 'bundle_starter'),
        desc: t('bundleDesc'),
        catalog: null, pack: null,
      };
    }
    if (target.kind === 'avatar') {
      const a = SHOP_AVATARS.find((x) => x.id === target.id)!;
      return {
        rarity: undefined, price: a.price, owned: ownedAvatars.includes(a.id), equipped: avatar === a.id,
        name: t(`avatar_${a.id}` as 'avatar_owl'),
        desc: lang === 'fa' ? 'رفیق پروفایل تو' : 'Your profile buddy',
        catalog: null,
      };
    }
    if (target.kind === 'deck') {
      const d = SHOP_DECKS.find((x) => x.id === target.id)!;
      return {
        rarity: undefined, price: d.price, owned: ownedDecks.includes(d.id), equipped: deck === d.id,
        name: t(`deck_${d.id}` as 'deck_animals'),
        desc: t('chooseDeck'),
        catalog: null,
      };
    }
    if (target.kind === 'theme') {
      const th = SHOP_THEMES.find((x) => x.id === target.id)!;
      return {
        rarity: undefined, price: th.price, owned: ownedThemes.includes(th.id), equipped: theme === th.id,
        name: t(`theme_${th.id}` as 'theme_meadow'),
        desc: lang === 'fa' ? 'تم رنگی کل بازی' : 'The color theme of the whole game',
        catalog: null,
      };
    }
    // cosmetic kinds
    const catalog: Record<string, { items: { id: string; price: number; rarity: Rarity }[] }> = {
      skin: { items: SKINS }, board: { items: BOARDS }, bg: { items: BGS }, fx: { items: FXS }, char: { items: CHARS },
    };
    const list = catalog[target.kind]?.items ?? [];
    const item = list.find((x) => x.id === target.id);
    if (!item) return null;
    return {
      rarity: item.rarity,
      price: item.price,
      owned: owned[target.kind as CosmeticKind]?.includes(item.id) ?? false,
      equipped: equipped[target.kind as CosmeticKind] === item.id,
      name: t(`${target.kind}_${item.id}` as 'skin_classic'),
      desc: t(`desc_${target.kind}_${item.id}` as 'desc_skin_classic'),
      catalog: target.kind as CosmeticKind,
    };
  }, [target, t, lang, ownedAvatars, ownedDecks, ownedThemes, owned, equipped, avatar, deck, theme]);

  if (!target || !info) return null;
  const affordable = coins >= info.price;
  const mpPrice = marketPriceOf(target);

  return (
    <GameModal open onClose={onClose}>
      <div className="text-center">
        <h3 className="font-black text-lg" style={{ color: 'var(--ink)' }}>{info.name}</h3>
        <div className="flex items-center justify-center gap-2 mt-1">
          {info.rarity && <RarityBadge rarity={info.rarity} />}
          {target.kind !== 'pack' && <PriceTag price={info.price} />}
        </div>

        {/* big animated 3D preview */}
        <div className="my-4 rounded-3xl p-5 grid place-items-center border-2 border-white/60 relative overflow-hidden"
          style={{ background: 'radial-gradient(circle at 50% 30%, rgba(255,255,255,.85), rgba(255,255,255,.35))', minHeight: 170 }}>
          <div className="float-anim"><PreviewVisual target={target} big /></div>
        </div>

        <p className="text-xs font-bold opacity-75 mb-4">{info.desc}</p>

        {target.kind === 'pack' && (() => {
          const pack = COIN_PACKS.find((p) => p.id === target.id)!;
          return (
            <div className="rounded-2xl p-3 mb-3 flex items-center justify-center gap-2" style={{ background: 'rgba(255,213,79,.25)' }}>
              <CoinIcon className="w-7 h-7" />
              <span className="font-black text-xl" style={{ color: '#b07700' }}>+{fmt(packTotalCoins(pack))}</span>
              {pack.bonusPct > 0 && <span className="chip !py-0.5 !text-[10px]" style={{ background: 'linear-gradient(180deg,#d9f5e3,#b9ecc9)', color: '#1f7a45' }}>{t('packBonus', { n: fmt(pack.bonusPct) })}</span>}
            </div>
          );
        })()}

        {/* real-money price for market products (قیمت واقعی در بازار) */}
        {mpPrice != null && (
          <div className="rounded-2xl px-3 py-2 mb-3 flex items-center justify-center gap-1.5 text-[11px] font-black"
            style={{ background: 'rgba(38,198,218,.14)', border: '1.5px dashed rgba(38,198,218,.55)', color: '#0b7285' }}>
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            {t('marketPrice', { n: fmt(mpPrice) })}
          </div>
        )}

        {info.equipped ? (
          <GameButton variant="green" className="w-full" disabled>{t('equipped')} ✓</GameButton>
        ) : info.owned ? (
          <UseButton target={target} onDone={onClose} />
        ) : (
          <GameButton
            variant={affordable ? 'gold' : 'orange'}
            className="w-full"
            disabled={!affordable}
            onClick={() => onBuy(target)}
          >
            {affordable
              ? <><ShoppingBag className="w-4 h-4" /> {t('buy')}</>
              : <><Lock className="w-4 h-4" /> {t('notEnoughCoins')}</>}
          </GameButton>
        )}
        {!info.owned && !info.equipped && !affordable && (
          <p className="text-[10px] font-bold opacity-60 mt-2">{t('goShop')} → {t('shopCoins')}</p>
        )}
      </div>
    </GameModal>
  );
}

/** Equip / use an already-owned item */
function UseButton({ target, onDone }: { target: PreviewTarget; onDone: () => void }) {
  const { toast } = useToast();
  const { t } = useI18n();
  const equipCosmetic = useGame((s) => s.equipCosmetic);
  const equipAvatar = useGame((s) => s.equipAvatar);
  const equipDeck = useGame((s) => s.equipDeck);
  const equipTheme = useGame((s) => s.equipTheme);

  const doEquip = (e: React.MouseEvent<HTMLButtonElement>) => {
    audio.sfx('pop');
    if (target.kind === 'avatar') equipAvatar(target.id as never);
    else if (target.kind === 'deck') equipDeck(target.id as never);
    else if (target.kind === 'theme') equipTheme(target.id as never);
    else equipCosmetic(target.kind as CosmeticKind, target.id);
    burstAt(e.currentTarget, 'coins');
    toast({ title: t('equipped') + ' ✓' });
    onDone();
  };

  return <GameButton variant="green" className="w-full" onClick={doEquip}>{t('useItem')}</GameButton>;
}

// ============ Purchase confirmation (spec: خرید باید با تأیید کاربر انجام شود) ============
function ConfirmModal({ target, onClose }: { target: PreviewTarget | null; onClose: () => void }) {
  const { t, fmt } = useI18n();
  const { toast } = useToast();
  const coins = useGame((s) => s.coins);
  const buyCosmetic = useGame((s) => s.buyCosmetic);
  const buyAvatar = useGame((s) => s.buyAvatar);
  const buyDeck = useGame((s) => s.buyDeck);
  const buyTheme = useGame((s) => s.buyTheme);
  const buyPack = useGame((s) => s.buyPack);
  const buyBundle = useGame((s) => s.buyBundle);
  const buyVip = useGame((s) => s.buyVip);
  const [busy, setBusy] = useState(false);

  const info = useMemo(() => {
    if (!target) return null;
    if (target.kind === 'pack') {
      const pack = COIN_PACKS.find((p) => p.id === target.id)!;
      return { price: 0, name: t(`pack_${pack.id.split('_')[1]}` as 'pack_small'), pack };
    }
    if (target.kind === 'vip') {
      return { price: VIP_PRICE, name: t('vipTitle'), pack: null };
    }
    if (target.kind === 'bundle') {
      const b = BUNDLES.find((x) => x.id === target.id)!;
      return { price: b.price, name: t(`bundle_${b.id.split('_')[1]}` as 'bundle_starter'), pack: null };
    }
    if (target.kind === 'avatar') {
      const a = SHOP_AVATARS.find((x) => x.id === target.id)!;
      return { price: a.price, name: t(`avatar_${a.id}` as 'avatar_owl'), pack: null };
    }
    if (target.kind === 'theme') {
      const th = SHOP_THEMES.find((x) => x.id === target.id)!;
      return { price: th.price, name: t(`theme_${th.id}` as 'theme_meadow'), pack: null };
    }
    if (target.kind === 'deck') {
      const d = SHOP_DECKS.find((x) => x.id === target.id)!;
      return { price: d.price, name: t(`deck_${d.id}` as 'deck_animals'), pack: null };
    }
    const catalog: Partial<Record<CosmeticKind, { id: string; price: number }[]>> = {
      skin: SKINS, board: BOARDS, bg: BGS, fx: FXS, char: CHARS,
    };
    const item = catalog[target.kind as CosmeticKind]?.find((x) => x.id === target.id);
    if (!item) return null;
    return { price: item.price, name: t(`${target.kind}_${item.id}` as 'skin_classic'), pack: null };
  }, [target, t]);

  if (!target || !info) return null;
  const affordable = target.kind === 'pack' || coins >= info.price;

  const doBuy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    setBusy(true);
    let ok = false;
    try {
      if (target.kind === 'pack') {
        const got = await buyPack(target.id);
        ok = got !== null;
        if (ok) toast({ title: t('adDone', { n: fmt(got!) }) });
      } else if (target.kind === 'vip') {
        ok = await buyVip();
        if (ok) toast({ title: t('vipActivated') });
      } else if (target.kind === 'bundle') {
        ok = await buyBundle(target.id);
        if (ok) toast({ title: t('bundleDone') });
      } else if (target.kind === 'avatar') {
        ok = buyAvatar(target.id as never);
      } else if (target.kind === 'deck') {
        ok = buyDeck(target.id as never);
      } else if (target.kind === 'theme') {
        ok = buyTheme(target.id as never);
      } else {
        ok = buyCosmetic(target.kind as CosmeticKind, target.id);
      }
      if (ok) {
        audio.sfx('coin');
        coinsFrom(e.currentTarget, 10);
      } else if (target.kind !== 'pack') {
        audio.sfx('wrong');
        toast({ title: t('notEnoughCoins'), description: t('goShop') });
      } else {
        audio.sfx('wrong');
        toast({ title: t('serverVerifyFail') });
      }
    } finally {
      setBusy(false);
      onClose();
    }
  };

  return (
    <GameModal open onClose={onClose}>
      <div className="text-center">
        <h3 className="font-black text-lg" style={{ color: 'var(--ink)' }}>{t('confirmBuy')}</h3>
        <div className="my-3 rounded-2xl p-3 flex items-center gap-3" style={{ background: 'rgba(255,255,255,.5)' }}>
          <div className="w-16 h-16 rounded-2xl grid place-items-center border-2 border-white/70 shrink-0" style={{ background: 'rgba(255,255,255,.6)' }}>
            <div className="scale-90"><PreviewVisual target={target} /></div>
          </div>
          <div className="text-start flex-1 min-w-0">
            <p className="font-black text-sm truncate">{info.name}</p>
            <p className="text-[11px] font-black" style={{ color: '#b07700' }}>
              {target.kind === 'pack' && info.pack
                ? <span className="flex items-center gap-1"><CoinIcon className="w-4 h-4" /> +{fmt(packTotalCoins(info.pack))}</span>
                : <PriceTag price={info.price} />}
            </p>
          </div>
        </div>
        {/* honest demo notice — no misleading claims */}
        <div className="rounded-2xl p-3 mb-4 flex items-start gap-2 text-start" style={{ background: 'rgba(79,172,254,.15)', border: '2px dashed rgba(79,172,254,.5)' }}>
          <ShieldCheck className="w-5 h-5 shrink-0" style={{ color: '#1d6cb8' }} />
          <p className="text-[11px] font-bold leading-snug" style={{ color: '#1d6cb8' }}>{t('demoBuyDesc')}</p>
        </div>
        <div className="flex gap-2">
          <GameButton variant="orange" className="flex-1" disabled={busy} onClick={onClose}>{t('cancel')}</GameButton>
          <GameButton variant="green" className="flex-1" disabled={!affordable || busy} onClick={doBuy}>
            {busy ? <span className="animate-pulse">…</span> : <><Check className="w-4 h-4" /> {t('confirm')}</>}
          </GameButton>
        </div>
      </div>
    </GameModal>
  );
}

