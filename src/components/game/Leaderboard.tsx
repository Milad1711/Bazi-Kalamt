// ============ Leaderboard screen (بخش ۱۳ — رتبه‌بندی) ============
// Weekly / monthly / friends boards + limited-time competition + top rewards.
// All data flows through the independent leaderboard module — when the online
// provider goes live this screen needs zero changes.
'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Crown, Medal, Timer, Users, Info } from 'lucide-react';
import { useI18n, TopBar, GameButton, SectionTitle } from './ui';
import { useGame } from '@/lib/game/store';
import { leaderboard, activeComp, monthlyReward, weekKey, monthKey, type BoardScope, type LeaderRow } from '@/lib/game/leaderboard';
import { tournamentReward } from '@/lib/game/tournament';
import { BOTS } from '@/lib/game/tournament';
import { GameIcon } from '@/lib/game/art';
import { audio } from '@/lib/game/audio';

type Tab = BoardScope;

export function Leaderboard({ onBack }: { onBack: () => void }) {
  const { t, fmt, dir, lang } = useI18n();
  const xp = useGame((s) => s.xp);
  const name = useGame((s) => s.name);
  const avatar = useGame((s) => s.avatar);
  const friendIds = useGame((s) => s.friendIds);
  const toggleFriend = useGame((s) => s.toggleFriend);
  const tourPoints = useGame((s) => s.tourPoints);
  const ensureTournament = useGame((s) => s.ensureTournament);

  const [tab, setTab] = useState<Tab>('weekly');
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);

  ensureTournament();

  const comp = useMemo(() => activeComp(), []);
  const periodKey = tab === 'monthly' ? monthKey() : weekKey();
  // monthly score = tournament points of this week ×4 as an honest local proxy
  const playerScore = tab === 'monthly' ? tourPoints * 4 : tourPoints;

  useEffect(() => {
    let alive = true;
    setLoading(true);
    leaderboard.getBoard({
      scope: tab,
      periodKey,
      playerScore,
      playerName: name,
      playerAvatar: avatar,
      friendIds,
      lang: useGame.getState().lang,
    }).then((r) => {
      if (alive) {
        setRows(r);
        setLoading(false);
      }
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, periodKey, playerScore, name, avatar, friendIds]);

  // competition countdown (client-only — starts after mount)
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const endsIn = useMemo(() => {
    if (now === null || !comp.active) return '';
    const s = Math.max(0, Math.floor((comp.endsAt - now) / 1000));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    return `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  }, [now, comp]);

  const myRank = rows.findIndex((r) => r.isPlayer) + 1;

  return (
    <div className="flex flex-col gap-3 pb-8">
      <TopBar title={t('lbTitle')} onBack={onBack} />

      {/* limited-time competition banner */}
      <section
        className="glossy rounded-2xl p-3 border-2"
        style={{
          background: comp.active
            ? 'linear-gradient(135deg, rgba(255,213,79,.95), rgba(255,138,61,.92))'
            : 'rgba(255,255,255,.45)',
          borderColor: '#fff',
          boxShadow: comp.active
            ? '0 6px 0 rgba(214,116,26,.5), 0 12px 20px rgba(31,20,60,.22)'
            : '0 4px 10px rgba(31,20,60,.12)',
        }}
      >
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5" style={{ color: comp.active ? '#fff' : '#b07a00' }} fill={comp.active ? '#fff' : 'none'} />
          <span className="font-black text-sm" style={{ color: comp.active ? '#fff' : 'var(--ink)' }}>
            {t('lbCompTitle')}
          </span>
          {comp.active && endsIn && (
            <span className="chip !py-0.5 !px-2 !text-[10px] ms-auto" style={{ background: 'rgba(0,0,0,.25)', borderColor: 'transparent', color: '#fff' }} dir={dir}>
              <Timer className="w-3.5 h-3.5" />
              {t('lbCompEnds', { t: endsIn })}
            </span>
          )}
        </div>
        <p className="text-xs font-bold mt-1" style={{ color: comp.active ? 'rgba(255,255,255,.95)' : 'var(--ink)', opacity: comp.active ? 1 : 0.65 }}>
          {comp.active ? t('lbCompDesc') : t('lbCompInactive')}
        </p>
      </section>

      {/* tabs */}
      <div className="flex rounded-full overflow-hidden border-2 border-white/70 text-xs font-black shadow-inner">
        {(['weekly', 'monthly', 'friends'] as Tab[]).map((s) => (
          <button
            key={s}
            className="flex-1 py-2 transition-colors"
            style={{ background: tab === s ? 'var(--accent)' : 'rgba(255,255,255,.4)', color: tab === s ? '#fff' : 'var(--ink)' }}
            onClick={() => { audio.sfx('tick'); setTab(s); }}
          >
            {s === 'weekly' ? t('lbWeekly') : s === 'monthly' ? t('lbMonthly') : t('lbFriends')}
          </button>
        ))}
      </div>

      {/* my rank summary */}
      <section className="glass-panel p-3 flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl border-2 border-white shadow overflow-hidden shrink-0"
          style={{ background: 'linear-gradient(180deg,#fff8e1,#ffe9b8)' }}>
          <GameIcon name={avatar} className="w-full h-full" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-black text-sm truncate" style={{ color: 'var(--ink)' }}>{name}</div>
          <div className="text-[11px] font-bold opacity-60">
            {myRank > 0 ? `#${fmt(myRank)}` : t('lbTitle')} · {t(tab === 'monthly' ? 'lbMonthly' : 'lbWeekly')}
          </div>
        </div>
        <span className="chip" style={{ background: 'linear-gradient(180deg,#fff6d8,#ffe9a8)', borderColor: '#ffd75e' }}>
          <Medal className="w-4 h-4 text-[#b07a00]" />
          <span className="font-black text-[#7a5200]">{fmt(playerScore)} {t('lbPoints')}</span>
        </span>
      </section>

      {/* board */}
      <section className="glass-panel p-2 flex flex-col gap-1 min-h-[220px]">
        {loading && <div className="p-6 text-center text-xs font-bold opacity-50">…</div>}
        {!loading && tab === 'friends' && rows.length <= 1 && (
          <div className="p-3 text-center text-[11px] font-bold opacity-60">{t('lbAddFriends')}</div>
        )}
        {!loading && rows.map((r, i) => (
          <BoardRow key={r.id} row={r} rank={i + 1} />
        ))}
        {!loading && tab === 'friends' && (
          <div className="flex flex-wrap gap-1.5 p-2 pt-3 mt-1 border-t-2 border-black/5">
            {BOTS.map((b) => {
              const on = friendIds.includes(b.id);
              return (
                <button
                  key={b.id}
                  onClick={() => { audio.sfx('pop'); toggleFriend(b.id); }}
                  className="chip !text-[10px] !py-1 transition-transform active:scale-95"
                  style={{
                    background: on ? 'var(--accent)' : 'var(--panel-strong)',
                    color: on ? '#fff' : 'var(--ink)',
                    borderColor: on ? 'var(--accent-deep)' : 'var(--panel-border)',
                  }}
                >
                  <Users className="w-3 h-3" />
                  {lang === 'fa' ? b.fa : b.en}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* how points work */}
      <section className="glass-panel p-3 flex items-start gap-2">
        <Info className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} />
        <p className="text-[11px] font-bold opacity-70 leading-relaxed">{t('lbHowPoints')}</p>
      </section>

      {/* top-rank rewards */}
      <section>
        <SectionTitle icon={<Crown className="w-5 h-5" style={{ color: '#f9a825' }} />}>{t('lbTopRewards')}</SectionTitle>
        <div className="glass-panel p-3 flex flex-col gap-2">
          {(tab === 'monthly'
            ? [[1, 1200, 'gold'], [3, 800, 'silver'], [10, 400, null], [25, 200, null], [0, 75, null]]
            : [[1, 600, 'gold'], [3, 400, 'silver'], [6, 220, null], [0, 100, null]]
          ).map(([rank, coins, chest], i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-black/5 grid place-items-center text-sm font-black shrink-0" style={{ color: 'var(--ink)' }}>
                {rank ? `#${fmt(rank as number)}` : '∞'}
              </span>
              <span className="text-[11px] font-bold opacity-75 flex-1">
                {rank ? t('lbRewardRank', { n: fmt(rank as number) }) : t('lbRewardAll')}
              </span>
              <span className="text-xs font-black" style={{ color: '#b07a00' }}>🪙 {fmt(coins as number)}</span>
              {chest === 'gold' && <span className="text-[10px] font-black text-[#b07a00]">{t('lbChestGold')}</span>}
              {chest === 'silver' && <span className="text-[10px] font-black opacity-70">{t('lbChestSilver')}</span>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function BoardRow({ row, rank }: { row: LeaderRow; rank: number }) {
  const { fmt, t } = useI18n();
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;
  return (
    <div
      className="flex items-center gap-2.5 rounded-2xl px-2.5 py-2 border-2"
      style={{
        background: row.isPlayer ? 'linear-gradient(90deg, rgba(255,213,79,.35), rgba(255,255,255,.1))' : 'transparent',
        borderColor: row.isPlayer ? '#ffd75e' : 'transparent',
      }}
    >
      <span className="w-7 text-center font-black text-xs shrink-0" style={{ color: 'var(--ink)' }}>
        {medal ?? fmt(rank)}
      </span>
      <div
        className="w-9 h-9 rounded-xl border-2 border-white shadow-sm overflow-hidden shrink-0"
        style={{ background: 'linear-gradient(180deg,#fff8e1,#ffe9b8)' }}
      >
        <GameIcon name={row.avatar} className="w-full h-full" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black truncate" style={{ color: 'var(--ink)' }}>
            {row.name}{row.isPlayer ? ` (${t('lbYou')})` : ''}
          </span>
          {row.isFriend && <span className="text-[10px]">💚</span>}
        </div>
      </div>
      <span className="font-black text-sm shrink-0" style={{ color: '#7a5200' }}>{fmt(row.score)}</span>
    </div>
  );
}
