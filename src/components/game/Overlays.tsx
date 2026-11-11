// ============ Victory / Defeat / Prize Box / Daily Reward modals ============
'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useGame } from '@/lib/game/store';
import { GameModal, GameButton, StarRow, useI18n, CoinPill } from './ui';
import { CoinIcon, Mascot, GameIcon } from '@/lib/game/art';
import { audio } from '@/lib/game/audio';
import { burstAt, coinsFrom } from '@/lib/game/fx-bus';
import type { DailyReward, LevelRewards } from '@/lib/game/types';
import { DAILY_REWARDS, dailyRewardFor } from '@/lib/game/economy';
import { useGame as useStore } from '@/lib/game/store';
import { translate, type DictKey } from '@/lib/game/i18n';

// ---------- Victory ----------
export function VictoryModal({
  open, rewards, isMemory, onNext, onReplay, onBack, canNext, onClose,
}: {
  open: boolean;
  rewards: LevelRewards;
  isMemory?: boolean;
  onNext?: () => void;
  onReplay?: () => void;
  onBack: () => void;
  canNext: boolean;
  onClose?: () => void;
}) {
  const { t, fmt } = useI18n();
  const panelRef = useRef<HTMLDivElement>(null);
  const coinRef = useRef<HTMLSpanElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [boxOpened, setBoxOpened] = useState(false);

  useEffect(() => {
    if (!open) return;
    audio.sfx('victory');
    const a = setTimeout(() => burstAt(panelRef.current, 'confetti'), 250);
    const b = setTimeout(() => coinsFrom(coinRef.current, 8), 600);
    let c: ReturnType<typeof setTimeout> | undefined;
    if (rewards.perfect && rewards.boxCoins > 0) {
      c = setTimeout(() => {
        setBoxOpened(true);
        audio.sfx('box');
        burstAt(boxRef.current, 'coins');
      }, 1100);
    }
    return () => { clearTimeout(a); clearTimeout(b); if (c) clearTimeout(c); };
  }, []);  

  if (!open) return null;

  return (
    <GameModal open={open} onClose={onClose}>
      <div ref={panelRef} className="text-center relative">
        {rewards.perfect && (
          <div className="slide-badge inline-block px-4 py-1 rounded-full font-black text-white mb-1"
            style={{ background: 'linear-gradient(90deg,#ff6d3f,#ffb300)', boxShadow: '0 4px 0 rgba(0,0,0,.15)' }}>
            {t('perfectTitle')}
          </div>
        )}
        <h2 className="text-3xl font-black" style={{ color: 'var(--ink)' }}>
          {rewards.perfect ? t('perfectSubtitle') : t('victoryTitle')}
        </h2>
        <p className="font-bold opacity-70 mb-2">{t('victorySubtitle')}</p>

        <div className="flex justify-center mb-3">
          <StarRow stars={rewards.stars} size={40} animate />
        </div>

        {rewards.perfect && rewards.boxCoins > 0 ? (
          <div ref={boxRef} className="prize-stage flex items-end justify-center h-40 my-1 relative">
            {boxOpened && <div className="prize-glow" />}
            <div className={`prize-box ${boxOpened ? 'open' : ''}`}>
              <div className="box-lid" />
              <div className="box-body">
                <div className="box-ribbon-v" />
              </div>
            </div>
          </div>
        ) : (
          <div className="mascot-wrap w-20 mx-auto mb-2">
            <Mascot />
          </div>
        )}

        <div className="space-y-1.5 mb-4 text-sm font-bold">
          <RewardRow label={t('rewardBase')} value={`+${fmt(rewards.baseCoins)}`} />
          {rewards.noHintBonus > 0 && <RewardRow label={isMemory ? 'Combo ✦' : t('rewardNoHint')} value={`+${fmt(rewards.noHintBonus)}`} gold />}
          {rewards.speedBonus > 0 && <RewardRow label={t('rewardSpeed')} value={`+${fmt(rewards.speedBonus)}`} gold />}
          {rewards.boxCoins > 0 && <RewardRow label={t('rewardBox')} value={`+${fmt(rewards.boxCoins)}`} gold />}
          {rewards.eventMultipliers.map((m, i) => (
            <RewardRow key={i} label={t('eventBonus')} value={m} gold />
          ))}
          <div className="pt-2 mt-1 border-t-2 border-dashed border-black/10">
            <RewardRow label={t('totalXp')} value={`+${fmt(rewards.xp)} XP`} big />
            <span ref={coinRef} className="inline-flex items-center gap-1.5 font-black text-lg" style={{ color: '#b07700' }}>
              <CoinIcon className="w-6 h-6" /> +{fmt(rewards.coins)}
            </span>
          </div>
        </div>

        <div className="flex gap-2 justify-center flex-wrap">
          <GameButton variant="green" onClick={onBack}>{t('back')}</GameButton>
          {onReplay && <GameButton variant="gold" onClick={onReplay}>{t('replay')}</GameButton>}
          {canNext && onNext && <GameButton variant="blue" onClick={onNext}>{t('nextLevel')}</GameButton>}
        </div>
      </div>
    </GameModal>
  );
}

function RewardRow({ label, value, gold, big }: { label: string; value: string; gold?: boolean; big?: boolean }) {
  return (
    <div className={`flex items-center justify-between px-4 py-1.5 rounded-xl ${big ? 'text-base' : ''}`}
      style={{ background: gold ? 'rgba(255, 213, 79, .25)' : 'rgba(255,255,255,.5)' }}>
      <span style={{ color: 'var(--ink)' }}>{label}</span>
      <span className="font-black" style={{ color: gold ? '#b07700' : 'var(--ink)' }}>{value}</span>
    </div>
  );
}

// ---------- Defeat ----------
export function DefeatModal({
  open, onRetry, onBack,
}: { open: boolean; onRetry: () => void; onBack: () => void }) {
  const { t } = useI18n();
  useEffect(() => { if (open) audio.sfx('defeat'); }, [open]);
  if (!open) return null;
  return (
    <GameModal open={open}>
      <div className="text-center">
        <div className="w-24 mx-auto mb-2 opacity-90 grayscale-[35%] mascot-wrap"><Mascot /></div>
        <h2 className="text-2xl font-black" style={{ color: 'var(--ink)' }}>{t('defeatTitle')}</h2>
        <p className="font-bold opacity-70 mb-4">{t('defeatSubtitle')}</p>
        <div className="flex gap-2 justify-center">
          <GameButton variant="blue" onClick={onBack}>{t('back')}</GameButton>
          <GameButton variant="orange" onClick={onRetry}>{t('retry')}</GameButton>
        </div>
      </div>
    </GameModal>
  );
}

// ---------- Prize Box ----------
export function PrizeBoxModal({
  coins, onClose,
}: { coins: number; onClose: () => void }) {
  const { t, fmt } = useI18n();
  const [opened, setOpened] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setTimeout(() => {
      setOpened(true);
      audio.sfx('box');
      burstAt(boxRef.current, 'coins');
    }, 1300);
    return () => clearTimeout(id);
  }, []);

  return (
    <GameModal open onClose={onClose}>
      <div className="text-center py-2">
        <h2 className="text-2xl font-black mb-1" style={{ color: 'var(--ink)' }}>{t('rewardBox')}</h2>
        <div ref={boxRef} className="prize-stage flex items-end justify-center h-44 my-2 relative">
          {opened && <div className="prize-glow" />}
          <div className={`prize-box ${opened ? 'open' : ''}`}>
            <div className="box-lid" />
            <div className="box-body">
              <div className="box-ribbon-v" />
            </div>
          </div>
        </div>
        {opened && (
          <div className="bounce-in">
            <div className="flex items-center justify-center gap-2 text-3xl font-black" style={{ color: '#b07700' }}>
              <CoinIcon className="w-9 h-9" /> +{fmt(coins)}
            </div>
            <p className="font-bold opacity-70 mt-1 mb-3">{t('adDone', { n: fmt(coins) })}</p>
            <GameButton variant="gold" onClick={onClose}>{t('claim')}</GameButton>
          </div>
        )}
      </div>
    </GameModal>
  );
}

// ---------- Daily Reward (section 10 — structured ladder + VIP bonus) ----------
export function DailyRewardModal({
  open, onClose, onClaimed,
}: { open: boolean; onClose: () => void; onClaimed: (r: { day: number; reward: DailyReward; big: boolean }) => void }) {
  const { t, fmt } = useI18n();
  const dailyLastClaim = useStore((s) => s.dailyLastClaim);
  const dailyStreak = useStore((s) => s.dailyStreak);
  const claimDaily = useStore((s) => s.claimDaily);
  const vip = useStore((s) => (s.vipUntil ?? 0) > Date.now());
  const claimedToday = dailyLastClaim === todayLocal();

  const nextDay = claimedToday ? ((dailyStreak - 1) % 7) + 1 : (dailyStreakDayIsYesterday() ? (dailyStreak % 7) + 1 : 1);

  const DayVisual = ({ r }: { r: DailyReward }) => {
    if (r.kind === 'chest') {
      return (
        <svg viewBox="0 0 100 100" className="w-10 h-10">
          <rect x="20" y="46" width="60" height="40" rx="8" fill="#ffb300" />
          <rect x="14" y="36" width="72" height="18" rx="6" fill="#ffd75e" />
          <rect x="44" y="36" width="12" height="50" fill="#f4511e" />
          <rect x="14" y="60" width="12" height="26" fill="#f4511e" />
        </svg>
      );
    }
    if (r.kind === 'hint') {
      return (
        <span className="w-7 h-7 rounded-full grid place-items-center text-base"
          style={{ background: 'linear-gradient(180deg,#fff59d,#ffd54f)' }}>💡</span>
      );
    }
    return <CoinIcon className="w-7 h-7" />;
  };

  return (
    <GameModal open={open} onClose={onClose}>
      <div className="text-center">
        <h2 className="text-2xl font-black" style={{ color: 'var(--ink)' }}>{t('dailyTitle')}</h2>
        <p className="text-xs font-bold opacity-70 mb-2">{t('dailyDesc')}</p>
        {vip && (
          <div className="inline-flex items-center gap-1 chip !py-0.5 !px-2 !text-[10px] mb-2"
            style={{ background: 'linear-gradient(180deg,#ffe082,#ffb300)', color: '#5d4037' }}>
            👑 {t('vipDailyDoubled')}
          </div>
        )}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {DAILY_REWARDS.map((_, i) => {
            const day = i + 1;
            const r = dailyRewardFor(day, vip);
            const isNext = day === nextDay && !claimedToday;
            const past = claimedToday ? day <= ((dailyStreak - 1) % 7) + 1 : false;
            return (
              <div
                key={day}
                className={`rounded-2xl p-2 border-2 flex flex-col items-center gap-0.5 transition-transform ${isNext ? 'scale-105 -translate-y-1' : ''}`}
                style={{
                  background: past ? 'linear-gradient(180deg,#d9f5e3,#b9ecc9)' : isNext ? 'linear-gradient(180deg,#fff3c4,#ffe082)' : 'rgba(255,255,255,.55)',
                  borderColor: past ? '#38c172' : isNext ? '#ffb300' : 'rgba(255,255,255,.7)',
                  boxShadow: isNext ? '0 6px 0 #e59a00' : '0 4px 0 rgba(31,20,60,.08)',
                  gridRow: day === 7 ? 'span 2' : undefined,
                }}
              >
                <span className="text-[10px] font-black opacity-60">{t('dayN', { n: day })}</span>
                <DayVisual r={r} />
                <span className="text-xs font-black" style={{ color: '#7a5200' }}>
                  {r.kind === 'coins' ? fmt(r.coins) : r.kind === 'hint' ? `×${fmt(r.n)}` : t('dailyChestDay')}
                </span>
              </div>
            );
          })}
        </div>
        {claimedToday ? (
          <p className="font-black text-sm mb-2" style={{ color: 'var(--green)' }}>✓ {t('dailyClaimed')}</p>
        ) : null}
        <p className="text-xs font-bold opacity-60 mb-3">{t('dailyStreak', { n: fmt(dailyStreak) })}</p>
        <GameButton
          variant="gold"
          disabled={claimedToday}
          className="w-full"
          onClick={() => {
            const r = claimDaily();
            if (r) onClaimed(r);
          }}
        >
          {claimedToday ? t('claimed') : t('dailyClaimBtn')}
        </GameButton>
      </div>
    </GameModal>
  );
}

function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function dailyStreakDayIsYesterday() {
  const s = useStore.getState();
  if (!s.dailyStreakDay) return false;
  const y = new Date(Date.now() - 86400000);
  const ys = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
  return s.dailyStreakDay === ys;
}

// ---------- Level-up celebration ----------
export function LevelUpModal({
  events, onClose,
}: { events: { level: number; coins: number; unlockedAvatar?: string }[] | null; onClose: () => void }) {
  const { t, fmt, lang } = useI18n();
  useEffect(() => { if (events) audio.sfx('levelup'); }, [events]);
  if (!events || events.length === 0) return null;
  const main = events[events.length - 1];
  const avatarUnlock = events.find((e) => e.unlockedAvatar)?.unlockedAvatar;
  const totalCoins = events.reduce((s, e) => s + e.coins, 0);
  return (
    <GameModal open onClose={onClose}>
      <div className="text-center">
        <div className="mascot-wrap w-24 mx-auto"><Mascot /></div>
        <h2 className="text-3xl font-black slide-badge" style={{ color: 'var(--accent)' }}>{t('levelUp')}</h2>
        <p className="font-black text-lg mt-1" style={{ color: 'var(--ink)' }}>{t('reachedLevel', { n: fmt(main.level) })}</p>
        <div className="my-3 flex items-center justify-center gap-2 text-xl font-black" style={{ color: '#b07700' }}>
          <CoinIcon className="w-7 h-7" /> {t('levelUpReward', { n: fmt(totalCoins) })}
        </div>
        {avatarUnlock && (
          <div className="rounded-2xl p-3 mb-3" style={{ background: 'rgba(255,213,79,.25)' }}>
            <div className="w-16 h-16 mx-auto bounce-in"><GameIcon name={avatarUnlock} className="w-full h-full" /></div>
            <p className="font-bold text-sm mt-1">
              {t('unlockedAvatar', { name: translate(lang, `avatar_${avatarUnlock}` as DictKey) })}
            </p>
          </div>
        )}
        <GameButton variant="green" className="w-full" onClick={onClose}>{t('tapToContinue')}</GameButton>
      </div>
    </GameModal>
  );
}
