// ============ Main Lobby ============
'use client';
import React, { useMemo, useState } from 'react';
import { Gift, Plus, Settings, Store, Target, Sparkles, Trophy, Zap, Grid3X3, Brain, UserRound, Medal } from 'lucide-react';
import { useI18n, GameButton, CoinPill, XPBar, LevelBadge, SectionTitle } from './ui';
import { LevelMap } from './LevelMap';
import { DailyRewardModal } from './Overlays';
import { useGame } from '@/lib/game/store';
import { LogoMark, GameIcon, CharBuddy } from '@/lib/game/art';
import { getActiveEvents, levelProgress } from '@/lib/game/economy';
import type { EventId } from '@/lib/game/economy';
import type { DictKey } from '@/lib/game/i18n';

const EVENT_KEYS: Record<EventId, { title: DictKey; desc: DictKey }> = {
  doubleCoins: { title: 'eventDoubleCoins', desc: 'eventDoubleCoinsDesc' },
  wordMaster: { title: 'eventWordMaster', desc: 'eventWordMasterDesc' },
  memoryBoost: { title: 'eventMemoryBoost', desc: 'eventMemoryBoostDesc' },
  sunnySunday: { title: 'eventSunnySunday', desc: 'eventSunnySundayDesc' },
  brainDay: { title: 'eventBrainDay', desc: 'eventBrainDayDesc' },
  luckySaturday: { title: 'eventLuckySaturday', desc: 'eventLuckySaturdayDesc' },
};
import { ALL_CATEGORIES, DIFFICULTIES, type CategoryId, type Difficulty, type Screen } from '@/lib/game/types';
import { TOTAL_MM_LEVELS, TOTAL_WH_LEVELS } from '@/lib/game/memoryEngine';
import { ALL_MISSIONS, WEEKLY_POOL } from '@/lib/game/missions';
import { ACHIEVEMENTS } from '@/lib/game/achievements';
import { bankSize } from '@/lib/game/words';
import { audio } from '@/lib/game/audio';
import { coinsFrom } from '@/lib/game/fx-bus';

export interface Nav {
  go: (s: Screen) => void;
  whSel: { cat: CategoryId; diff: Difficulty };
  setWhSel: (v: { cat: CategoryId; diff: Difficulty }) => void;
  mmSel: { diff: Difficulty };
  setMmSel: (v: { diff: Difficulty }) => void;
  playWh: (cat: CategoryId, diff: Difficulty, level: number) => void;
  playMm: (diff: Difficulty, level: number) => void;
}

export function Lobby({ nav }: { nav: Nav }) {
  const { t, fmt, lang } = useI18n();
  const coins = useGame((s) => s.coins);
  const xp = useGame((s) => s.xp);
  const name = useGame((s) => s.name);
  const avatar = useGame((s) => s.avatar);
  const stats = useGame((s) => s.stats);
  const dailyLastClaim = useGame((s) => s.dailyLastClaim);
  const missionIds = useGame((s) => s.missionIds);
  const missionProgress = useGame((s) => s.missionProgress);
  const missionClaimed = useGame((s) => s.missionClaimed);
  const ensureMissions = useGame((s) => s.ensureMissions);
  const weeklyIds = useGame((s) => s.weeklyIds);
  const weeklyProgress = useGame((s) => s.weeklyProgress);
  const weeklyClaimed = useGame((s) => s.weeklyClaimed);
  const achCtx = useGame((s) => s.achCtx);
  const achClaimed = useGame((s) => s.achClaimed);
  const chestsPending = useGame((s) => s.chestsPending);
  const tourPrevClaimed = useGame((s) => s.tourPrevClaimed);
  const tourPrevWeek = useGame((s) => s.tourPrevWeek);
  const char = useGame((s) => s.equipped.char);
  const vipUntil = useGame((s) => s.vipUntil);
  const isVip = (vipUntil ?? 0) > Date.now();
  const whUnlockedLevel = useGame((s) => s.whUnlockedLevel);
  const whStarsFor = useGame((s) => s.whStarsFor);
  const mmUnlockedLevel = useGame((s) => s.mmUnlockedLevel);
  const mmStarsFor = useGame((s) => s.mmStarsFor);

  const [dailyOpen, setDailyOpen] = useState(false);
  const [mapTab, setMapTab] = useState<'wh' | 'mm'>('wh');

  const { level, pct } = useMemo(() => levelProgress(xp), [xp]);

  const events = useMemo(() => getActiveEvents(), []);
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const canClaimDaily = dailyLastClaim !== todayStr;
  const claimableMissions = useMemo(() => {
    ensureMissions();
    const ctx = achCtx();
    let n = 0;
    // daily missions
    n += missionIds.filter((id) => {
      const def = ALL_MISSIONS.find((m) => m.id === id);
      return def && !missionClaimed.includes(id) && (missionProgress[id] ?? 0) >= def.target;
    }).length;
    // weekly missions
    n += weeklyIds.filter((id) => {
      const def = WEEKLY_POOL.find((m) => m.id === id);
      return def && !weeklyClaimed.includes(id) && (weeklyProgress[id] ?? 0) >= def.target;
    }).length;
    // achievements ready to claim
    n += ACHIEVEMENTS.filter((a) => !achClaimed.includes(a.id) && a.progress(ctx) >= a.target).length;
    // chests + tournament rollover
    n += chestsPending.length;
    if (tourPrevWeek && !tourPrevClaimed) n += 1;
    return n;
  }, [missionIds, missionProgress, missionClaimed, weeklyIds, weeklyProgress, weeklyClaimed, achClaimed, chestsPending, tourPrevWeek, tourPrevClaimed, achCtx, ensureMissions]);

  const whDone = useMemo(() => {
    let done = 0;
    for (const c of ALL_CATEGORIES) for (const d of DIFFICULTIES) {
      for (let l = 1; l <= TOTAL_WH_LEVELS; l++) if (whStarsFor(c, d, l) > 0) done++;
    }
    return done;
  }, [whStarsFor]);
  const mmDone = useMemo(() => {
    let done = 0;
    for (const d of DIFFICULTIES) for (let l = 1; l <= TOTAL_MM_LEVELS; l++) if (mmStarsFor(d, l) > 0) done++;
    return done;
  }, [mmStarsFor]);

  return (
    <div className="flex flex-col gap-3 pb-8">
      {/* 1. Logo & name */}
      <header className="flex items-center gap-3 pt-4">
        <div className="w-14 h-14 drop-shadow-lg shrink-0 bounce-in"><LogoMark className="w-full h-full" /></div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-black leading-none tracking-tight" style={{ color: 'var(--ink)', textShadow: '0 2px 0 rgba(255,255,255,.5)' }}>
            Word Game <span style={{ color: 'var(--accent)' }}>3D</span>
          </h1>
          <p className="text-xs font-bold opacity-70">{t('tagline')}</p>
        </div>
        {/* 12. Settings */}
        <button
          onClick={() => { audio.sfx('click'); nav.go('settings'); }}
          className="btn3d btn3d-sm !px-3 !py-2.5"
          aria-label={t('settingsTitle')}
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* 2-6. Player card */}
      <section className="glass-panel glossy p-3 flex items-center gap-3">
        <button
          className="w-16 h-16 rounded-2xl shrink-0 border-4 border-white shadow-lg overflow-hidden transition-transform hover:scale-105"
          style={{ background: 'linear-gradient(180deg,#fff8e1,#ffe9b8)' }}
          onClick={() => { audio.sfx('pop'); nav.go('profile'); }}
          aria-label={t('profileTitle')}
        >
          <GameIcon name={avatar} className="w-full h-full" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-black text-lg truncate" style={{ color: 'var(--ink)' }}>{name}</span>
            {/* 3. Level */}
            <LevelBadge level={level} />
            {isVip && (
              <span className="chip !py-0.5 !px-2 !text-[9px] !font-black !border-white/60"
                style={{ background: 'linear-gradient(180deg,#ffe082,#ffb300)', color: '#5d4037' }}>
                👑 VIP
              </span>
            )}
          </div>
          {/* 4. XP bar */}
          <div className="mt-1.5 flex items-center gap-2">
            <XPBar pct={pct} level={level} />
            <span className="text-[10px] font-black opacity-60 shrink-0">XP</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {/* 5. Coins + 6. Buy */}
          <div className="flex items-center gap-1">
            <CoinPill amount={coins} />
            <button
              className="btn3d btn3d-gold btn3d-sm !p-0 w-8 h-8 !rounded-full"
              onClick={(e) => { audio.sfx('coin'); nav.go('shop'); }}
              aria-label={t('buyCoins')}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* 10-12. Quick actions */}
      <section className="grid grid-cols-3 gap-2">
        <QuickAction
          icon={<Target className="w-6 h-6" />}
          label={t('hubTitle')}
          badge={claimableMissions}
          onClick={() => nav.go('missions')}
          bg="linear-gradient(180deg,#7bd3f7,#4facfe)"
          shadow="#1d6cb8"
        />
        <QuickAction
          icon={<Store className="w-6 h-6" />}
          label={t('shopTitle')}
          onClick={() => nav.go('shop')}
          bg="linear-gradient(180deg,#b39dff,#9c6dff)"
          shadow="#7a45e0"
        />
        <QuickAction
          icon={<Gift className="w-6 h-6" />}
          label={t('dailyReward')}
          highlight={canClaimDaily}
          onClick={() => { audio.sfx('pop'); setDailyOpen(true); }}
          bg="linear-gradient(180deg,#ffd75e,#ffb300)"
          shadow="#e59a00"
        />
      </section>

      {/* leaderboard + profile quick actions (بخش ۱۲ و ۱۳) */}
      <section className="grid grid-cols-2 gap-2">
        <QuickAction
          icon={<Medal className="w-6 h-6" />}
          label={t('lbTitle')}
          onClick={() => nav.go('leaderboard')}
          bg="linear-gradient(180deg,#ffd75e,#ff9800)"
          shadow="#c66a00"
        />
        <QuickAction
          icon={<UserRound className="w-6 h-6" />}
          label={t('profileTitle')}
          onClick={() => nav.go('profile')}
          bg="linear-gradient(180deg,#4dd0c4,#009688)"
          shadow="#00695c"
        />
      </section>

      {/* 13. Special events */}
      <section>
        <SectionTitle icon={<Sparkles className="w-5 h-5" style={{ color: 'var(--accent)' }} />}>{t('specialEvents')}</SectionTitle>
        <div className="flex gap-2 overflow-x-auto nice-scroll pb-1 -mx-1 px-1">
          {events.map((ev) => {
            const keys = EVENT_KEYS[ev.id];
            return (
            <div
              key={ev.id}
              className="glossy rounded-2xl p-3 min-w-[220px] shrink-0 border-2"
              style={{
                background: 'linear-gradient(135deg, rgba(255,213,79,.95), rgba(255,138,61,.92))',
                borderColor: '#fff',
                boxShadow: '0 6px 0 rgba(214,116,26,.5), 0 12px 20px rgba(31,20,60,.22)',
              }}
            >
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-white" fill="white" />
                <span className="font-black text-white text-sm">{t(keys.title)}</span>
                <span className="ml-auto chip !py-0.5 !px-2 !bg-white/30 !border-white/40 text-white !text-[10px]">{t('eventEndsSoon')}</span>
              </div>
              <p className="text-white/95 text-xs font-bold mt-1">{t(keys.desc)}</p>
            </div>
            );
          })}
        </div>
      </section>

      {/* 7-8. Two game worlds */}
      <section className="grid grid-cols-2 gap-3">
        <WorldCard
          title={t('worldWhTitle')}
          desc={t('worldWhDesc')}
          progress={fmt(whDone)}
          total={fmt(TOTAL_WH_LEVELS * 4)}
          gradient="linear-gradient(160deg,#ff9d5c,#f4511e)"
          shadow="#c1440e"
          onClick={() => nav.go('word-select')}
          art={
            <div className="flex gap-1 rotate-[-6deg]">
              {['B', 'R', 'A', 'I', 'N'].map((l, i) => (
                <span key={i} className="w-6 h-6 grid place-items-center rounded-md bg-white/95 text-[#e05a1a] font-black text-xs shadow-md">{l}</span>
              ))}
            </div>
          }
        />
        <WorldCard
          title={t('worldMmTitle')}
          desc={t('worldMmDesc')}
          progress={fmt(mmDone)}
          total={fmt(TOTAL_MM_LEVELS * 4)}
          gradient="linear-gradient(160deg,#b39dff,#7e3ff2)"
          shadow="#5a28b8"
          onClick={() => nav.go('memory-select')}
          art={
            <div className="relative w-12 h-12 rotate-[8deg]">
              <div className="absolute inset-0 rounded-lg bg-white/90 shadow-md grid place-items-center"><Brain className="w-6 h-6 text-[#7e3ff2]" /></div>
              <div className="absolute inset-0 -translate-x-3 translate-y-2 rounded-lg border-4 border-white/80 bg-[#9c6dff]" />
            </div>
          }
        />
        {/* حدس کلمه — جای خالی وسط کلمه را پر کن */}
        <div className="col-span-2">
          <WorldCard
            title={t('worldGuessTitle')}
            desc={t('worldGuessDesc')}
            progress={fmt(bankSize('general', lang))}
            total="∞"
            gradient="linear-gradient(160deg,#63d4c2,#2aa895)"
            shadow="#1c7a6c"
            onClick={() => nav.go('guess')}
            art={
              <div className="flex gap-1 rotate-[-4deg]">
                {['ک', '?', 'ل', 'م', '?'].map((l, i) => (
                  <span
                    key={i}
                    className="w-6 h-7 grid place-items-center rounded-md font-black text-xs shadow-md"
                    style={{
                      background: l === '?' ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.95)',
                      border: l === '?' ? '2px dashed rgba(255,255,255,.8)' : 'none',
                      color: l === '?' ? '#fff' : '#157a6b',
                    }}
                  >
                    {l}
                  </span>
                ))}
              </div>
            }
          />
        </div>
      </section>

      {/* 14. Level map */}
      <section>
        <SectionTitle
          icon={<Grid3X3 className="w-5 h-5" style={{ color: 'var(--accent)' }} />}
          action={
            <div className="flex rounded-full overflow-hidden border-2 border-white/70 text-[11px] font-black shadow-inner">
              <button
                className={`px-3 py-1 transition-colors ${mapTab === 'wh' ? 'text-white' : 'opacity-70'}`}
                style={{ background: mapTab === 'wh' ? 'var(--accent)' : 'rgba(255,255,255,.4)' }}
                onClick={() => { audio.sfx('tick'); setMapTab('wh'); }}
              >
                {t('worldWhTitle')}
              </button>
              <button
                className={`px-3 py-1 transition-colors ${mapTab === 'mm' ? 'text-white' : 'opacity-70'}`}
                style={{ background: mapTab === 'mm' ? 'var(--accent)' : 'rgba(255,255,255,.4)' }}
                onClick={() => { audio.sfx('tick'); setMapTab('mm'); }}
              >
                {t('worldMmTitle')}
              </button>
            </div>
          }
        >
          {t('levelMap')}
        </SectionTitle>

        <div className="glass-panel p-3">
          {mapTab === 'wh' ? (
            <>
              <div className="flex gap-1.5 overflow-x-auto nice-scroll pb-2 mb-1">
                {ALL_CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => { audio.sfx('tick'); nav.setWhSel({ ...nav.whSel, cat: c }); }}
                    className="chip shrink-0 !text-[11px] transition-transform"
                    style={{
                      background: nav.whSel.cat === c ? 'var(--accent)' : 'var(--panel-strong)',
                      color: nav.whSel.cat === c ? '#fff' : 'var(--ink)',
                      borderColor: nav.whSel.cat === c ? 'var(--accent-deep)' : 'var(--panel-border)',
                    }}
                  >
                    {t(`cat_${c}` as 'cat_animals')}
                  </button>
                ))}
              </div>
              <div className="flex gap-1.5 mb-3">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    onClick={() => { audio.sfx('tick'); nav.setWhSel({ ...nav.whSel, diff: d }); }}
                    className="flex-1 rounded-xl py-1.5 text-[11px] font-black border-2 transition-transform"
                    style={{
                      background: nav.whSel.diff === d ? 'linear-gradient(180deg,#7be3a3,#38c172)' : 'rgba(255,255,255,.5)',
                      borderColor: nav.whSel.diff === d ? '#1f9d55' : 'rgba(255,255,255,.7)',
                      color: nav.whSel.diff === d ? '#fff' : 'var(--ink)',
                    }}
                  >
                    {t(`diff_${d}` as 'diff_easy')}
                  </button>
                ))}
              </div>
              <LevelMap
                totalLevels={TOTAL_WH_LEVELS}
                unlocked={whUnlockedLevel(nav.whSel.cat, nav.whSel.diff)}
                starsFor={(l) => whStarsFor(nav.whSel.cat, nav.whSel.diff, l)}
                onPlay={(l) => nav.playWh(nav.whSel.cat, nav.whSel.diff, l)}
                compact
              />
            </>
          ) : (
            <>
              <div className="flex gap-1.5 mb-3">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    onClick={() => { audio.sfx('tick'); nav.setMmSel({ diff: d }); }}
                    className="flex-1 rounded-xl py-1.5 text-[11px] font-black border-2 transition-transform"
                    style={{
                      background: nav.mmSel.diff === d ? 'linear-gradient(180deg,#7be3a3,#38c172)' : 'rgba(255,255,255,.5)',
                      borderColor: nav.mmSel.diff === d ? '#1f9d55' : 'rgba(255,255,255,.7)',
                      color: nav.mmSel.diff === d ? '#fff' : 'var(--ink)',
                    }}
                  >
                    {t(`diff_${d}` as 'diff_easy')}
                  </button>
                ))}
              </div>
              <LevelMap
                totalLevels={TOTAL_MM_LEVELS}
                unlocked={mmUnlockedLevel(nav.mmSel.diff)}
                starsFor={(l) => mmStarsFor(nav.mmSel.diff, l)}
                onPlay={(l) => nav.playMm(nav.mmSel.diff, l)}
                compact
              />
            </>
          )}
        </div>
      </section>

      {/* Mascot tip + stats */}
      <section className="glass-panel p-3 flex items-center gap-3">
        <div className="mascot-wrap w-16 shrink-0"><CharBuddy char={char} /></div>
        <div className="flex-1 text-xs font-bold opacity-80 leading-relaxed">{t('swipeToFind')}</div>
      </section>

      <section className="grid grid-cols-4 gap-2">
        <StatMini icon="🔍" label={t('statsWords')} value={fmt(stats.wordsFound)} />
        <StatMini icon="🏁" label={t('statsLevels')} value={fmt(stats.whLevels + stats.mmLevels)} />
        <StatMini icon="✨" label={t('statsPerfect')} value={fmt(stats.whPerfects + stats.mmPerfects)} />
        <StatMini icon="🔥" label={t('statsBestCombo')} value={`×${fmt(stats.bestCombo)}`} />
      </section>

      <DailyRewardModal
        open={dailyOpen}
        onClose={() => setDailyOpen(false)}
        onClaimed={(r) => {
          const el = document.querySelector('[data-coin-target]');
          if (r.reward.kind === 'coins') {
            coinsFrom(el as HTMLElement, 8);
            audio.sfx('coin');
          } else if (r.reward.kind === 'chest') {
            audio.sfx('box');
          } else {
            audio.sfx('levelup');
          }
        }}
      />
    </div>
  );
}

function QuickAction({
  icon, label, onClick, bg, shadow, badge, highlight,
}: {
  icon: React.ReactNode; label: string; onClick: () => void; bg: string; shadow: string; badge?: number; highlight?: boolean;
}) {
  return (
    <button
      onClick={() => { audio.sfx('click'); onClick(); }}
      className={`relative rounded-2xl p-2.5 flex flex-col items-center gap-1 text-white border-2 border-white/70 transition-transform active:translate-y-1 ${highlight ? 'pulse-ring' : ''}`}
      style={{ background: bg, boxShadow: `0 5px 0 ${shadow}, 0 10px 16px rgba(31,20,60,.2)` }}
    >
      {badge ? (
        <span className="absolute -top-1.5 -end-1.5 min-w-5 h-5 px-1 rounded-full bg-red-500 border-2 border-white text-[10px] font-black grid place-items-center">
          {badge}
        </span>
      ) : null}
      {icon}
      <span className="text-[10px] font-black leading-tight text-center line-clamp-2">{label}</span>
    </button>
  );
}

function WorldCard({
  title, desc, progress, total, gradient, shadow, onClick, art,
}: {
  title: string; desc: string; progress: string; total: string; gradient: string; shadow: string; onClick: () => void; art: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <button
      onClick={() => { audio.sfx('pop'); onClick(); }}
      className="glossy rounded-3xl p-3 text-start border-2 border-white/60 flex flex-col gap-2 min-h-[170px] transition-transform hover:scale-[1.02] active:scale-95"
      style={{ background: gradient, boxShadow: `0 8px 0 ${shadow}, 0 16px 26px rgba(31,20,60,.28)` }}
    >
      <div className="h-12 grid place-items-center">{art}</div>
      <div>
        <h3 className="font-black text-white text-sm leading-tight" style={{ textShadow: '0 2px 0 rgba(0,0,0,.2)' }}>{title}</h3>
        <p className="text-white/90 text-[10px] font-bold leading-snug mt-0.5">{desc}</p>
      </div>
      <div className="mt-auto flex items-center justify-between gap-1">
        <span className="chip !py-0.5 !px-2 !text-[9px] !bg-white/25 !border-white/40 text-white">{progress}/{total}</span>
        <span className="btn3d btn3d-sm btn3d-gold !py-1 !px-3 !text-[10px] pointer-events-none">{t('play')} ▸</span>
      </div>
    </button>
  );
}

function StatMini({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="glass-panel p-2 text-center">
      <div className="text-lg leading-none">{icon}</div>
      <div className="font-black text-sm" style={{ color: 'var(--ink)' }}>{value}</div>
      <div className="text-[9px] font-bold opacity-60 leading-tight">{label}</div>
    </div>
  );
}
