// ============ Missions & Rewards hub — Daily / Weekly / Achievements / Tournament + Chests ============
'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Target, RefreshCw, Trophy, Medal, Gift, ChevronDown, Zap } from 'lucide-react';
import { useI18n, TopBar, CoinPill, GameButton, GameModal } from './ui';
import { LevelUpModal } from './Overlays';
import { useGame } from '@/lib/game/store';
import { ALL_MISSIONS, WEEKLY_POOL, MISSION_LABELS, VIP_MISSION } from '@/lib/game/missions';
import { ACHIEVEMENTS, TIER_STYLE, achLabel } from '@/lib/game/achievements';
import { BOTS, botScores, rankOf, TOUR_MILESTONES } from '@/lib/game/tournament';
import { CHESTS, CHEST_STEP_LEVELS, type ChestKind } from '@/lib/game/shop';
import { audio } from '@/lib/game/audio';
import { coinsFrom, burstAt } from '@/lib/game/fx-bus';
import { CoinIcon, GameIcon } from '@/lib/game/art';
import { useToast } from '@/hooks/use-toast';
import type { LevelUpEvent } from '@/lib/game/store';

type HubTab = 'daily' | 'weekly' | 'ach' | 'tour';

export function Missions({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  const coins = useGame((s) => s.coins);
  const ensureMissions = useGame((s) => s.ensureMissions);
  const ensureWeekly = useGame((s) => s.ensureWeekly);
  const ensureTournament = useGame((s) => s.ensureTournament);
  const [tab, setTab] = useState<HubTab>('daily');
  const [levelUps, setLevelUps] = useState<LevelUpEvent[] | null>(null);

  useEffect(() => {
    ensureMissions();
    ensureWeekly();
    ensureTournament();
  }, [ensureMissions, ensureWeekly, ensureTournament]);

  const tabs: { id: HubTab; label: string; icon: React.ReactNode }[] = [
    { id: 'daily', label: t('tabDaily'), icon: <Target className="w-4 h-4" /> },
    { id: 'weekly', label: t('tabWeekly'), icon: <RefreshCw className="w-4 h-4" /> },
    { id: 'ach', label: t('tabAch'), icon: <Medal className="w-4 h-4" /> },
    { id: 'tour', label: t('tabTour'), icon: <Trophy className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col gap-3 pb-8">
      <TopBar title={t('hubTitle')} onBack={onBack} right={<CoinPill amount={coins} />} />

      {/* tabs */}
      <div className="grid grid-cols-4 gap-1.5">
        {tabs.map((x) => {
          const active = tab === x.id;
          return (
            <button
              key={x.id}
              className="rounded-2xl py-2 flex flex-col items-center gap-0.5 border-2 transition-all active:translate-y-0.5"
              style={{
                background: active ? 'linear-gradient(180deg,#b39dff,#9c6dff)' : 'var(--panel)',
                borderColor: active ? '#7a45e0' : 'var(--panel-border)',
                color: active ? '#fff' : 'var(--ink)',
                boxShadow: active ? '0 4px 0 #7a45e0' : '0 4px 0 rgba(31,20,60,.08)',
              }}
              onClick={() => { audio.sfx('tick'); setTab(x.id); }}
            >
              {x.icon}
              <span className="text-[10px] font-black">{x.label}</span>
            </button>
          );
        })}
      </div>

      <ChestCard />

      {tab === 'daily' && <DailyTab onLevelUps={setLevelUps} />}
      {tab === 'weekly' && <WeeklyTab onLevelUps={setLevelUps} />}
      {tab === 'ach' && <AchievementsTab onLevelUps={setLevelUps} />}
      {tab === 'tour' && <TournamentTab onLevelUps={setLevelUps} />}

      <LevelUpModal events={levelUps} onClose={() => setLevelUps(null)} />
    </div>
  );
}

// ============ shared mission card ============
function MissionRow({
  label, target, progress, coins, xp, claimed, onClaim,
}: {
  label: string; target: number; progress: number; coins: number; xp: number;
  claimed: boolean; onClaim: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const { t, fmt } = useI18n();
  const done = progress >= target;
  const pct = Math.min(100, Math.round((progress / target) * 100));
  return (
    <div className="glass-panel p-3">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl grid place-items-center shrink-0 border-2 border-white/60"
          style={{ background: done ? 'linear-gradient(180deg,#7be3a3,#38c172)' : 'linear-gradient(180deg,#b39dff,#9c6dff)' }}>
          <Target className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-[13px] leading-tight">{label}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="relative flex-1 h-3.5 rounded-full overflow-hidden border border-white/60 bg-black/15">
              <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#7bd3f7,#4facfe)' }} />
              <span className="absolute inset-0 grid place-items-center text-[9px] font-black text-white drop-shadow-[0_1px_1px_rgba(0,0,0,.5)]">
                {fmt(Math.min(progress, target))}/{fmt(target)}
              </span>
            </div>
          </div>
        </div>
        <div className="shrink-0 text-center">
          <span className="flex items-center gap-1 text-[11px] font-black" style={{ color: '#b07700' }}>
            <CoinIcon className="w-4 h-4" /> +{fmt(coins)}
          </span>
          <span className="text-[9px] font-black opacity-50">+{fmt(xp)} XP</span>
        </div>
        {claimed ? (
          <span className="chip !py-1 !text-[10px] shrink-0" style={{ background: 'linear-gradient(180deg,#d9f5e3,#b9ecc9)', color: '#1f7a45' }}>✓</span>
        ) : (
          <GameButton
            size="sm"
            variant={done ? 'gold' : 'orange'}
            className="!py-1.5 shrink-0"
            disabled={!done}
            onClick={onClaim}
          >
            {done ? t('claim') : t('locked')}
          </GameButton>
        )}
      </div>
    </div>
  );
}

// ============ Daily ============
function DailyTab({ onLevelUps }: { onLevelUps: (e: LevelUpEvent[]) => void }) {
  const { t, fmt, lang } = useI18n();
  const missionIds = useGame((s) => s.missionIds);
  const missionProgress = useGame((s) => s.missionProgress);
  const missionClaimed = useGame((s) => s.missionClaimed);
  const claimMission = useGame((s) => s.claimMission);

  const missions = useMemo(
    () => missionIds.map((id) => ALL_MISSIONS.find((m) => m.id === id)!).filter(Boolean),
    [missionIds],
  );

  return (
    <div className="flex flex-col gap-2.5">
      <div className="glass-panel p-3 flex items-center gap-2">
        <RefreshCw className="w-4 h-4 opacity-60" />
        <p className="text-xs font-bold opacity-70">{t('missionsReset')}</p>
      </div>
      {missions.map((m) => {
        const label = MISSION_LABELS[m.event][lang].replace('{n}', fmt(m.target));
        const isVipMission = m.id === VIP_MISSION.id;
        return (
          <div key={m.id} className="relative">
            {isVipMission && (
              <span className="absolute -top-1.5 start-3 z-10 chip !py-0 !px-1.5 !text-[8px] !font-black !border-white/60"
                style={{ background: 'linear-gradient(180deg,#ffe082,#ffb300)', color: '#5d4037' }}>
                👑 VIP
              </span>
            )}
            <MissionRow
              label={label}
              target={m.target}
              progress={missionProgress[m.id] ?? 0}
              coins={m.coins}
              xp={m.xp}
              claimed={missionClaimed.includes(m.id)}
              onClaim={(e) => {
                const events = claimMission(m.id, m.coins, m.xp);
                audio.sfx('coin');
                coinsFrom(e.currentTarget, 6);
                if (events.length) onLevelUps(events);
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

// ============ Weekly ============
function WeeklyTab({ onLevelUps }: { onLevelUps: (e: LevelUpEvent[]) => void }) {
  const { t, fmt, lang } = useI18n();
  const weeklyIds = useGame((s) => s.weeklyIds);
  const weeklyProgress = useGame((s) => s.weeklyProgress);
  const weeklyClaimed = useGame((s) => s.weeklyClaimed);
  const claimWeekly = useGame((s) => s.claimWeekly);

  const missions = useMemo(
    () => weeklyIds.map((id) => WEEKLY_POOL.find((m) => m.id === id)!).filter(Boolean),
    [weeklyIds],
  );

  return (
    <div className="flex flex-col gap-2.5">
      <div className="glass-panel p-3 flex items-center gap-2">
        <RefreshCw className="w-4 h-4 opacity-60" />
        <p className="text-xs font-bold opacity-70">{t('weeklyReset')}</p>
      </div>
      {missions.map((m) => {
        const label = MISSION_LABELS[m.event][lang].replace('{n}', fmt(m.target));
        return (
          <MissionRow
            key={m.id}
            label={label}
            target={m.target}
            progress={weeklyProgress[m.id] ?? 0}
            coins={m.coins}
            xp={m.xp}
            claimed={weeklyClaimed.includes(m.id)}
            onClaim={(e) => {
              const events = claimWeekly(m.id, m.coins, m.xp);
              audio.sfx('coin');
              coinsFrom(e.currentTarget, 6);
              if (events.length) onLevelUps(events);
            }}
          />
        );
      })}
    </div>
  );
}

// ============ Achievements ============
function AchievementsTab({ onLevelUps }: { onLevelUps: (e: LevelUpEvent[]) => void }) {
  const { t, fmt, lang } = useI18n();
  const achCtx = useGame((s) => s.achCtx);
  const achClaimed = useGame((s) => s.achClaimed);
  const claimAchievement = useGame((s) => s.claimAchievement);
  const ctx = achCtx();

  const doneCount = ACHIEVEMENTS.filter((a) => a.progress(ctx) >= a.target || achClaimed.includes(a.id)).length;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="glass-panel p-3 flex items-center gap-2">
        <Medal className="w-4 h-4 opacity-60" />
        <p className="text-xs font-bold opacity-70">
          {t('achCount', { done: fmt(doneCount), total: fmt(ACHIEVEMENTS.length) })}
        </p>
      </div>
      {ACHIEVEMENTS.map((a) => {
        const prog = Math.min(a.progress(ctx), a.target);
        const done = prog >= a.target;
        const claimed = achClaimed.includes(a.id);
        const pct = Math.round((prog / a.target) * 100);
        const tier = TIER_STYLE[a.tier];
        return (
          <div key={a.id} className="glass-panel p-3 flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl grid place-items-center shrink-0 border-2 border-white/70"
              style={{ background: tier.grad }}>
              <Medal className="w-5 h-5" style={{ color: tier.ink }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-[13px] leading-tight">{achLabel(a.id, lang, a.target)}</p>
              <div className="mt-1.5 relative h-3 rounded-full overflow-hidden border border-white/60 bg-black/15">
                <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 rounded-full transition-all duration-500"
                  style={{ width: `${claimed ? 100 : pct}%`, background: 'linear-gradient(90deg,#ffd54f,#ffb300)' }} />
                {!claimed && (
                  <span className="absolute inset-0 grid place-items-center text-[9px] font-black text-white drop-shadow-[0_1px_1px_rgba(0,0,0,.5)]">
                    {fmt(prog)}/{fmt(a.target)}
                  </span>
                )}
              </div>
            </div>
            <div className="shrink-0 text-center">
              <span className="flex items-center gap-1 text-[11px] font-black" style={{ color: '#b07700' }}>
                <CoinIcon className="w-4 h-4" /> +{fmt(a.coins)}
              </span>
              <span className="text-[9px] font-black opacity-50">+{fmt(a.xp)} XP</span>
              {a.bonus?.hints ? (
                <span className="text-[9px] font-black" style={{ color: '#c9930a' }}>💡 ×{fmt(a.bonus.hints)}</span>
              ) : a.bonus?.chest ? (
                <span className="text-[9px] font-black" style={{ color: '#c9930a' }}>
                  🎁 {t(({ wooden: 'chestWooden', silver: 'chestSilver', gold: 'chestGold' } as const)[a.bonus.chest])}
                </span>
              ) : null}
            </div>
            {claimed ? (
              <span className="chip !py-1 !text-[10px] shrink-0" style={{ background: 'linear-gradient(180deg,#d9f5e3,#b9ecc9)', color: '#1f7a45' }}>✓</span>
            ) : (
              <GameButton
                size="sm"
                variant={done ? 'gold' : 'orange'}
                className="!py-1.5 shrink-0"
                disabled={!done}
                onClick={(e) => {
                  const events = claimAchievement(a.id);
                  audio.sfx('coin');
                  coinsFrom(e.currentTarget, 6);
                  if (events && events.length) onLevelUps(events);
                }}
              >
                {done ? t('claim') : t('locked')}
              </GameButton>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============ Tournament ============
function TournamentTab({ onLevelUps }: { onLevelUps: (e: LevelUpEvent[]) => void }) {
  const { t, fmt, lang } = useI18n();
  const { toast } = useToast();
  const name = useGame((s) => s.name);
  const avatar = useGame((s) => s.avatar);
  const tourPoints = useGame((s) => s.tourPoints);
  const tourWeek = useGame((s) => s.tourWeek);
  const tourMilestonesClaimed = useGame((s) => s.tourMilestonesClaimed);
  const tourPrevWeek = useGame((s) => s.tourPrevWeek);
  const tourPrevRank = useGame((s) => s.tourPrevRank);
  const tourPrevCoins = useGame((s) => s.tourPrevCoins);
  const tourPrevClaimed = useGame((s) => s.tourPrevClaimed);
  const claimTourMilestone = useGame((s) => s.claimTourMilestone);
  const claimTourRollover = useGame((s) => s.claimTourRollover);

  const rows = useMemo(() => {
    const scores = botScores(tourWeek);
    const bots = BOTS.map((b, i) => ({
      id: b.id,
      name: lang === 'fa' ? b.fa : b.en,
      avatar: b.avatar,
      points: scores[i] ?? 0,
      you: false,
    }));
    const merged = [...bots, { id: 'you', name: name || t('tourYou'), avatar, points: tourPoints, you: true }];
    merged.sort((a, b) => b.points - a.points);
    return merged;
  }, [tourWeek, tourPoints, name, avatar, lang, t]);

  const myRank = rankOf(tourPoints, tourWeek);
  const daysLeft = useMemo(() => {
    const d = (6 - new Date().getDay() + 7) % 7;
    return d === 0 ? 7 : d;
  }, []);

  const nextMs = TOUR_MILESTONES[tourMilestonesClaimed];

  return (
    <div className="flex flex-col gap-2.5">
      {/* live rank card */}
      <div className="glass-panel glossy p-3 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(255,213,79,.35), rgba(156,109,255,.25))' }}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl grid place-items-center border-2 border-white/70 shrink-0"
            style={{ background: 'linear-gradient(180deg,#ffe082,#ffb300)' }}>
            <Trophy className="w-6 h-6 text-white drop-shadow" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-sm">{t('tourTitle')}</p>
            <p className="text-[10px] font-bold opacity-70 leading-tight">{t('tourSubtitle')}</p>
          </div>
          <div className="text-center shrink-0">
            <p className="text-[9px] font-black opacity-60">{t('tourLive')}</p>
            <p className="text-xl font-black" style={{ color: 'var(--accent-deep)' }}>#{fmt(myRank)}</p>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="chip !py-0.5 !text-[10px] font-black">
            <Zap className="w-3 h-3" style={{ color: '#f59e0b' }} /> {fmt(tourPoints)} pts
          </span>
          <span className="text-[10px] font-bold opacity-60">{t('tourDaysLeft', { n: fmt(daysLeft) })}</span>
        </div>
      </div>

      {/* last week's rollover reward */}
      {tourPrevWeek && !tourPrevClaimed && (
        <div className="glass-panel p-3 flex items-center gap-3 bounce-in"
          style={{ boxShadow: '0 0 0 3px rgba(255,160,0,.55), 0 8px 18px rgba(31,20,60,.18)' }}>
          <div className="w-11 h-11 rounded-2xl grid place-items-center shrink-0 border-2 border-white/70"
            style={{ background: 'linear-gradient(180deg,#ffe082,#ffa000)' }}>
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-[12px]">{t('tourPrevUnclaimed')}</p>
            <p className="text-[10px] font-bold opacity-60">{t('tourPrevTitle', { n: fmt(tourPrevRank) })} · +{fmt(tourPrevCoins)} 🪙</p>
          </div>
          <GameButton
            size="sm"
            variant="gold"
            className="!py-1.5 shrink-0"
            onClick={(e) => {
              const res = claimTourRollover();
              if (res) {
                audio.sfx('coin');
                coinsFrom(e.currentTarget, 8);
                toast({ title: t('adDone', { n: fmt(res.coins) }) });
              }
            }}
          >
            {t('claim')}
          </GameButton>
        </div>
      )}

      {/* point milestones */}
      <div className="glass-panel p-3">
        <p className="font-black text-[12px] mb-2">{t('tourMilestones')}</p>
        <div className="grid grid-cols-4 gap-1.5">
          {TOUR_MILESTONES.map((ms, i) => {
            const claimed = i < tourMilestonesClaimed;
            const ready = i === tourMilestonesClaimed && tourPoints >= ms.points;
            return (
              <button
                key={ms.points}
                disabled={!ready}
                onClick={(e) => {
                  if (claimTourMilestone(ms.points)) {
                    audio.sfx('coin');
                    coinsFrom(e.currentTarget, 6);
                    toast({ title: t('adDone', { n: fmt(ms.coins) }) });
                  }
                }}
                className="rounded-xl p-1.5 border-2 flex flex-col items-center gap-0.5 transition-all"
                style={{
                  background: claimed ? 'linear-gradient(180deg,#d9f5e3,#b9ecc9)' : ready ? 'linear-gradient(180deg,#fff3c4,#ffe082)' : 'rgba(0,0,0,.06)',
                  borderColor: claimed ? '#38c172' : ready ? '#ffb300' : 'rgba(255,255,255,.5)',
                  cursor: ready ? 'pointer' : 'default',
                  opacity: claimed ? .8 : ready ? 1 : .55,
                }}
              >
                <span className="text-[9px] font-black opacity-70">{fmt(ms.points)}</span>
                <span className="flex items-center gap-0.5 text-[10px] font-black" style={{ color: '#b07700' }}>
                  <CoinIcon className="w-3.5 h-3.5" /> {fmt(ms.coins)}
                </span>
                <span className="text-[9px]">{claimed ? '✓' : ready ? '🎁' : '🔒'}</span>
              </button>
            );
          })}
        </div>
        {nextMs ? (
          <p className="text-[10px] font-bold opacity-60 mt-2">{t('nextMilestone', { n: fmt(nextMs.points) })}</p>
        ) : (
          <p className="text-[10px] font-bold opacity-60 mt-2">✓ {t('tourClaimedAll')}</p>
        )}
      </div>

      {/* leaderboard */}
      <div className="glass-panel p-3">
        <p className="font-black text-[12px] mb-2 flex items-center gap-1.5">
          <Trophy className="w-4 h-4" style={{ color: '#f59e0b' }} /> {t('tourTitle')}
        </p>
        <div className="flex flex-col gap-1.5 max-h-[340px] overflow-y-auto nice-scroll pe-1">
          {rows.map((r, i) => {
            const rank = i + 1;
            const isMe = r.you;
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
            return (
              <div
                key={r.id}
                className="flex items-center gap-2 rounded-xl px-2 py-1.5 border-2"
                style={{
                  background: isMe ? 'linear-gradient(180deg,#fff3c4,#ffe082)' : 'rgba(255,255,255,.4)',
                  borderColor: isMe ? '#ffb300' : 'rgba(255,255,255,.5)',
                }}
              >
                <span className="w-8 text-center font-black text-[11px] shrink-0">{medal}</span>
                <span className="w-8 h-8 rounded-xl bg-white/70 border border-white grid place-items-center shrink-0">
                  <GameIcon name={r.avatar} className="w-6 h-6" />
                </span>
                <span className={`flex-1 min-w-0 truncate text-[12px] font-black ${isMe ? '' : 'opacity-80'}`}>
                  {r.name} {isMe && <span className="text-[9px] opacity-60">({t('tourYou')})</span>}
                </span>
                <span className="text-[11px] font-black shrink-0" style={{ color: isMe ? '#b07700' : 'var(--ink)' }}>
                  {fmt(r.points)}
                </span>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] font-bold opacity-60 mt-2 text-center">{t('tourNote')}</p>
      </div>
    </div>
  );
}

// ============ Prize Chests ============
function ChestCard() {
  const { t, fmt } = useI18n();
  const chestProgress = useGame((s) => s.chestProgress);
  const chestsPending = useGame((s) => s.chestsPending);
  const openChest = useGame((s) => s.openChest);
  const addCoins = useGame((s) => s.addCoins);
  const [opened, setOpened] = useState<{ kind: ChestKind; coins: number } | null>(null);

  const remaining = CHEST_STEP_LEVELS - chestProgress;
  const pct = Math.round((chestProgress / CHEST_STEP_LEVELS) * 100);

  return (
    <div className="glass-panel glossy p-3 relative overflow-hidden">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl grid place-items-center shrink-0 border-2 border-white/60 relative"
          style={{ background: 'linear-gradient(180deg,#ffd75e,#e59a00)' }}>
          <Gift className="w-6 h-6 text-white drop-shadow" />
          {chestsPending.length > 0 && (
            <span className="absolute -top-1.5 -end-1.5 min-w-5 h-5 px-1 rounded-full bg-red-500 border-2 border-white text-[10px] font-black grid place-items-center text-white">
              {fmt(chestsPending.length)}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-[13px]">{t('chestTitle')}</p>
          {chestsPending.length > 0 ? (
            <p className="text-[10px] font-black bounce-in" style={{ color: '#c47f00' }}>
              {t('chestReady', { n: fmt(chestsPending.length) })}
            </p>
          ) : (
            <div className="mt-1 relative h-3 rounded-full overflow-hidden border border-white/60 bg-black/15">
              <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#ffd54f,#ffb300)' }} />
              <span className="absolute inset-0 grid place-items-center text-[8px] font-black text-white drop-shadow-[0_1px_1px_rgba(0,0,0,.5)]">
                {t('chestMeter', { n: fmt(Math.max(remaining, 0)) })}
              </span>
            </div>
          )}
          <div className="flex gap-1 mt-1.5">
            {(['wooden', 'silver', 'gold'] as ChestKind[]).map((k) => (
              <span key={k} className="w-3.5 h-3.5 rounded-full border border-white/70" style={{ background: CHESTS[k].grad }} title={t(`chest_${k}` as 'chestWooden')} />
            ))}
          </div>
        </div>
        <GameButton
          size="sm"
          variant={chestsPending.length ? 'gold' : 'orange'}
          className="!py-1.5 shrink-0"
          disabled={!chestsPending.length}
          onClick={() => {
            const res = openChest();
            if (res) {
              addCoins(res.coins);
              setOpened(res);
            }
          }}
        >
          <ChevronDown className="w-4 h-4" /> {t('chestOpen')}
        </GameButton>
      </div>

      {/* chest opening modal */}
      <GameModal open={!!opened} onClose={() => setOpened(null)}>
        {opened && <ChestPrize kind={opened.kind} coins={opened.coins} onClose={() => setOpened(null)} />}
      </GameModal>
    </div>
  );
}

function ChestPrize({ kind, coins, onClose }: { kind: ChestKind; coins: number; onClose: () => void }) {
  const { t, fmt } = useI18n();
  const [anim, setAnim] = useState(false);
  const boxRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    audio.sfx('box');
    const id = setTimeout(() => {
      setAnim(true);
      burstAt(boxRef.current, 'coins');
    }, 1100);
    return () => clearTimeout(id);
  }, []);

  const c = CHESTS[kind];
  return (
    <div className="text-center py-2">
      <h2 className="text-xl font-black mb-1" style={{ color: 'var(--ink)' }}>{t(`chest_${kind}` as 'chestWooden')}</h2>
      <div ref={boxRef} className="prize-stage flex items-end justify-center h-44 my-2 relative">
        {anim && <div className="prize-glow" />}
        <div className={`prize-box ${anim ? 'open' : ''}`}>
          <div className="box-lid" style={{ background: c.grad, boxShadow: 'inset 0 4px 0 rgba(255,255,255,.5)' }} />
          <div className="box-body" style={{ background: c.grad, boxShadow: `inset 0 -10px 0 ${c.deep}, inset 0 6px 0 rgba(255,255,255,.4)` }}>
            <div className="box-ribbon-v" />
          </div>
        </div>
      </div>
      {anim && (
        <div className="bounce-in">
          <div className="flex items-center justify-center gap-2 text-3xl font-black" style={{ color: '#b07700' }}>
            <CoinIcon className="w-9 h-9" /> +{fmt(coins)}
          </div>
          <p className="font-bold opacity-70 mt-1 mb-3">{t('chestWon', { n: fmt(coins) })}</p>
          <GameButton variant="gold" onClick={onClose}>{t('claim')}</GameButton>
        </div>
      )}
    </div>
  );
}
