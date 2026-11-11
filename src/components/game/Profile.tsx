// ============ Player Profile (بخش ۱۲ — پروفایل بازیکن) ============
// Includes: username, avatar, level, XP, total coins, completed levels,
// best records, collected skins, achievements, game history + guest play /
// account login / cross-device cloud sync.
'use client';
import React, { useEffect, useMemo, useState } from 'react';
import {
  UserRound, Pencil, Check, Trophy, CloudUpload, CloudDownload,
  LogOut, Coins, Flag, Layers, Flame, Swords, ShieldCheck, Clock3,
} from 'lucide-react';
import { useI18n, TopBar, GameButton, CoinPill, LevelBadge, XPBar, SectionTitle, GameModal } from './ui';
import { useGame } from '@/lib/game/store';
import { levelProgress } from '@/lib/game/economy';
import { SKINS } from '@/lib/game/shop';
import { ACHIEVEMENTS } from '@/lib/game/achievements';
import { GameIcon, CharBuddy } from '@/lib/game/art';
import { audio } from '@/lib/game/audio';
import { coinsFrom } from '@/lib/game/fx-bus';
import type { Difficulty, HistoryEntry } from '@/lib/game/types';

const DIFF_COLOR: Record<Difficulty, string> = {
  easy: '#38c172', normal: '#4facfe', hard: '#f4511e', expert: '#9c6dff',
};

export function Profile({ onBack, goMissions }: { onBack: () => void; goMissions: () => void }) {
  const { t, fmt, lang } = useI18n();
  const coins = useGame((s) => s.coins);
  const xp = useGame((s) => s.xp);
  const name = useGame((s) => s.name);
  const avatar = useGame((s) => s.avatar);
  const stats = useGame((s) => s.stats);
  const records = useGame((s) => s.records);
  const history = useGame((s) => s.history);
  const account = useGame((s) => s.account);
  const ownedSkins = useGame((s) => s.owned.skin);
  const achClaimed = useGame((s) => s.achClaimed);
  const vipUntil = useGame((s) => s.vipUntil);
  const tourBestRank = useGame((s) => s.tourBestRank);
  const setName = useGame((s) => s.setName);

  const [editOpen, setEditOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState(name);
  const isVip = (vipUntil ?? 0) > Date.now();
  const { level, pct } = useMemo(() => levelProgress(xp), [xp]);
  const skinsTotal = SKINS.length;
  const achReady = useMemo(() => {
    // count achievements that are ready but unclaimed — nudges toward the hub
    return 0; // precise count lives in the Missions hub badge; keep profile lean
  }, []);

  const doneLevels = stats.whLevels + stats.mmLevels;

  return (
    <div className="flex flex-col gap-3 pb-8">
      <TopBar title={t('profileTitle')} onBack={onBack} right={<CoinPill amount={coins} />} />

      {/* identity card */}
      <section className="glass-panel glossy p-4">
        <div className="flex items-center gap-3">
          <div className="w-20 h-20 rounded-3xl border-4 border-white shadow-lg overflow-hidden shrink-0 bounce-in"
            style={{ background: 'linear-gradient(180deg,#fff8e1,#ffe9b8)' }}>
            <GameIcon name={avatar} className="w-full h-full" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-lg truncate" style={{ color: 'var(--ink)' }}>{name}</span>
              <button
                className="w-7 h-7 rounded-full grid place-items-center bg-black/10 hover:bg-black/20 transition-colors"
                onClick={() => { audio.sfx('click'); setNameDraft(name); setEditOpen(true); }}
                aria-label={t('editName')}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <LevelBadge level={level} />
              {isVip && (
                <span className="chip !py-0.5 !px-2 !text-[9px] !font-black !border-white/60"
                  style={{ background: 'linear-gradient(180deg,#ffe082,#ffb300)', color: '#5d4037' }}>
                  👑 VIP
                </span>
              )}
            </div>
            <p className="text-[11px] font-bold opacity-60 mt-0.5">
              {account.status === 'member' ? `✓ ${t('profileMember')}` : t('profileGuest')}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <XPBar pct={pct} level={level} />
              <span className="text-[10px] font-black opacity-60 shrink-0">{fmt(xp)} XP</span>
            </div>
          </div>
        </div>
      </section>

      {/* stats grid */}
      <section className="grid grid-cols-3 gap-2">
        <ProfileStat icon={<Coins className="w-4 h-4" />} label={t('statTotalCoins')} value={fmt(coins)} />
        <ProfileStat icon={<Layers className="w-4 h-4" />} label={t('statLevelsDone')} value={fmt(doneLevels)} />
        <ProfileStat icon={<Trophy className="w-4 h-4" />} label={t('profileAch')} value={`${fmt(achClaimed.length)}/${fmt(ACHIEVEMENTS.length)}`} />
        <ProfileStat icon={<Flag className="w-4 h-4" />} label={t('statsWords')} value={fmt(stats.wordsFound)} />
        <ProfileStat icon={<Flame className="w-4 h-4" />} label={t('recBestStreak')} value={`${fmt(records.bestStreak)} ${t('days')}`} />
        <ProfileStat icon={<Swords className="w-4 h-4" />} label={t('statsBestCombo')} value={`×${fmt(stats.bestCombo)}`} />
      </section>

      {/* best records */}
      <section>
        <SectionTitle icon={<Trophy className="w-5 h-5" style={{ color: 'var(--accent)' }} />}>{t('statBestRecords')}</SectionTitle>
        <div className="glass-panel p-3 flex flex-col gap-2">
          <RecordRow
            icon="🔍"
            label={t('recFastestWh')}
            value={records.fastestWhSec === null ? '—' : t('secondsShort', { n: fmt(records.fastestWhSec) })}
          />
          <RecordRow
            icon="🧠"
            label={t('recFewestMoves')}
            value={records.fewestMmMoves === null ? '—' : fmt(records.fewestMmMoves)}
          />
          <RecordRow
            icon="🏅"
            label={t('recBestTour')}
            value={tourBestRank >= 99 ? '—' : `#${fmt(tourBestRank)}`}
          />
        </div>
      </section>

      {/* skins */}
      <section>
        <SectionTitle
          icon={<Star />}
          action={<span className="chip !text-[10px]">{fmt(ownedSkins.length)}/{fmt(skinsTotal)}</span>}
        >
          {t('profileSkins')}
        </SectionTitle>
        <div className="glass-panel p-3 flex flex-wrap gap-1.5">
          {ownedSkins.length === 0 && <span className="text-xs font-bold opacity-60">—</span>}
          {ownedSkins.map((s) => (
            <span key={s} className="chip !text-[10px] !py-1">{t(`skin_${s}` as never)}</span>
          ))}
        </div>
      </section>

      {/* game history */}
      <section>
        <SectionTitle icon={<Clock3 className="w-5 h-5" style={{ color: 'var(--accent)' }} />}>{t('profileHistory')}</SectionTitle>
        <div className="flex flex-col gap-2">
          {history.length === 0 && (
            <div className="glass-panel p-4 text-center text-xs font-bold opacity-60">{t('historyEmpty')}</div>
          )}
          {history.slice(0, 10).map((h) => (
            <HistoryRow key={h.tx} h={h} />
          ))}
        </div>
      </section>

      {/* account & sync */}
      <AccountCard />

      <div className="flex justify-center py-1">
        <div className="mascot-wrap w-16 opacity-80"><CharBuddy char="mascot" /></div>
      </div>

      {/* rename modal */}
      <GameModal open={editOpen} onClose={() => setEditOpen(false)}>
        <div className="flex items-center gap-2 mb-3">
          <UserRound className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          <h3 className="font-black">{t('editName')}</h3>
        </div>
        <input
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          maxLength={20}
          className="w-full rounded-xl border-2 border-white/70 bg-white/60 px-3 py-2.5 font-black text-sm outline-none focus:border-[var(--accent)] mb-3"
          style={{ color: 'var(--ink)' }}
        />
        <GameButton
          variant="green"
          className="w-full"
          onClick={() => {
            if (nameDraft.trim()) {
              setName(nameDraft);
              audio.sfx('pop');
            }
            setEditOpen(false);
          }}
        >
          <Check className="w-4 h-4" /> {t('save')}
        </GameButton>
      </GameModal>
    </div>
  );
}

function ProfileStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass-panel p-2.5 text-center">
      <div className="grid place-items-center mb-1" style={{ color: 'var(--accent)' }}>{icon}</div>
      <div className="font-black text-sm leading-tight" style={{ color: 'var(--ink)' }}>{value}</div>
      <div className="text-[9px] font-bold opacity-60 leading-tight mt-0.5">{label}</div>
    </div>
  );
}

function RecordRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-8 h-8 rounded-xl bg-black/5 grid place-items-center text-base shrink-0">{icon}</span>
      <span className="text-xs font-bold opacity-75 flex-1">{label}</span>
      <span className="font-black text-sm" style={{ color: 'var(--ink)' }}>{value}</span>
    </div>
  );
}

function Star() {
  return <span className="text-base leading-none">🧩</span>;
}

function HistoryRow({ h }: { h: HistoryEntry }) {
  const { t, fmt, lang } = useI18n();
  const rel = useMemo(() => {
    const days = Math.floor((Date.now() - h.at) / 86_400_000);
    if (days <= 0) return t('histToday');
    if (days === 1) return t('histYesterday');
    return t('histDaysAgo', { n: fmt(days) });
  }, [h.at, t, fmt]);
  const isWh = h.game === 'wh';
  return (
    <div className="glass-panel p-2.5 flex items-center gap-2.5">
      <div
        className="w-10 h-10 rounded-2xl grid place-items-center text-white text-base shrink-0"
        style={{ background: isWh ? 'linear-gradient(160deg,#ff9d5c,#f4511e)' : 'linear-gradient(160deg,#b39dff,#7e3ff2)' }}
      >
        {isWh ? '🔍' : '🧠'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-black" style={{ color: 'var(--ink)' }}>
            {t(isWh ? 'worldWhTitle' : 'worldMmTitle')}
          </span>
          <span className="chip !text-[9px] !py-0 !px-1.5" style={{ background: `${DIFF_COLOR[h.diff]}22`, borderColor: DIFF_COLOR[h.diff], color: DIFF_COLOR[h.diff] }}>
            {t(`diff_${h.diff}` as never)} · {fmt(h.level)}
          </span>
        </div>
        <div className="text-[10px] font-bold opacity-55 mt-0.5">{rel}</div>
      </div>
      <div className="flex flex-col items-end gap-0.5 shrink-0">
        <div className="flex items-center gap-1">
          <span className="text-[10px]">{'⭐'.repeat(h.stars) || '—'}</span>
          <span className="text-[11px] font-black" style={{ color: '#b07a00' }}>+{fmt(h.coins)}</span>
        </div>
        <VerifyBadge h={h} lang={lang} />
      </div>
    </div>
  );
}

function VerifyBadge({ h, lang }: { h: HistoryEntry; lang: string }) {
  const { t } = useI18n();
  const label = h.verified ? t('historyVerified') : t('historyPending');
  const color = h.verified ? '#1f9d55' : '#8a8a8a';
  return (
    <span className="flex items-center gap-1 text-[9px] font-black" style={{ color }} dir={lang === 'fa' ? 'rtl' : 'ltr'}>
      <ShieldCheck className="w-3 h-3" />{label}
    </span>
  );
}

// ---------------- account & cloud sync ----------------
function AccountCard() {
  const { t, lang } = useI18n();
  const account = useGame((s) => s.account);
  const registerAccount = useGame((s) => s.registerAccount);
  const loginAccount = useGame((s) => s.loginAccount);
  const logoutAccount = useGame((s) => s.logoutAccount);
  const pushCloud = useGame((s) => s.pushCloud);
  const pullCloud = useGame((s) => s.pullCloud);

  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setOkMsg(null);
    const err = mode === 'register'
      ? await registerAccount(username.trim(), password)
      : await loginAccount(username.trim(), password);
    setBusy(false);
    if (err) setError(t(err as never));
    else {
      audio.sfx('levelup');
      setOkMsg(t('syncOk'));
      setPassword('');
    }
  };

  const sync = async (dir: 'push' | 'pull') => {
    setBusy(true);
    setError(null);
    setOkMsg(null);
    const err = dir === 'push' ? await pushCloud() : await pullCloud();
    setBusy(false);
    if (err) setError(t(err as never));
    else {
      audio.sfx('coin');
      setOkMsg(t('syncOk'));
      if (dir === 'push') coinsFrom(document.querySelector('[data-coin-target]') as HTMLElement, 5);
    }
  };

  const syncTime = account.lastSync
    ? new Date(account.lastSync).toLocaleString(lang === 'fa' ? 'fa-IR' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })
    : null;

  return (
    <section className="glass-panel p-4">
      <div className="flex items-center gap-2 mb-2">
        <UserRound className="w-5 h-5" style={{ color: 'var(--accent)' }} />
        <h3 className="font-black text-sm">{t('accountTitle')}</h3>
        {account.status === 'member' && (
          <span className="chip !text-[9px] !py-0.5 !px-2 ms-auto" style={{ background: '#e2f7e9', borderColor: '#1f9d55', color: '#1f7a44' }}>
            {account.username}
          </span>
        )}
      </div>

      {account.status === 'guest' ? (
        <>
          <p className="text-[11px] font-bold opacity-65 leading-relaxed mb-3">{t('accountGuestDesc')}</p>
          {/* mode tabs */}
          <div className="flex rounded-full overflow-hidden border-2 border-white/70 text-[11px] font-black shadow-inner mb-3">
            <button
              className="flex-1 py-1.5 transition-colors"
              style={{ background: mode === 'register' ? 'var(--accent)' : 'rgba(255,255,255,.4)', color: mode === 'register' ? '#fff' : 'var(--ink)' }}
              onClick={() => { audio.sfx('tick'); setMode('register'); setError(null); }}
            >
              {t('register')}
            </button>
            <button
              className="flex-1 py-1.5 transition-colors"
              style={{ background: mode === 'login' ? 'var(--accent)' : 'rgba(255,255,255,.4)', color: mode === 'login' ? '#fff' : 'var(--ink)' }}
              onClick={() => { audio.sfx('tick'); setMode('login'); setError(null); }}
            >
              {t('login')}
            </button>
          </div>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t('username')}
            maxLength={20}
            autoComplete="username"
            className="w-full rounded-xl border-2 border-white/70 bg-white/60 px-3 py-2.5 font-bold text-sm outline-none focus:border-[var(--accent)] mb-2"
            style={{ color: 'var(--ink)' }}
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('password')}
            type="password"
            maxLength={72}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            className="w-full rounded-xl border-2 border-white/70 bg-white/60 px-3 py-2.5 font-bold text-sm outline-none focus:border-[var(--accent)] mb-2"
            style={{ color: 'var(--ink)' }}
          />
          {error && <p className="text-[11px] font-black text-red-600 mb-2">⚠ {error}</p>}
          {okMsg && <p className="text-[11px] font-black text-green-700 mb-2">✓ {okMsg}</p>}
          <GameButton variant="green" className="w-full" disabled={busy || !username.trim() || !password} onClick={submit}>
            {mode === 'register' ? t('register') : t('login')}
          </GameButton>
        </>
      ) : (
        <>
          <p className="text-[11px] font-bold opacity-65 leading-relaxed mb-1">{t('syncPolicy')}</p>
          <p className="text-[10px] font-bold opacity-50 mb-3">
            {syncTime ? t('lastSync', { t: syncTime }) : t('neverSynced')}
          </p>
          {error && <p className="text-[11px] font-black text-red-600 mb-2">⚠ {error}</p>}
          {okMsg && <p className="text-[11px] font-black text-green-700 mb-2">✓ {okMsg}</p>}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <GameButton variant="blue" disabled={busy} onClick={() => sync('push')}>
              <CloudUpload className="w-4 h-4" /> {t('pushCloud')}
            </GameButton>
            <GameButton variant="orange" disabled={busy} onClick={() => sync('pull')}>
              <CloudDownload className="w-4 h-4" /> {t('pullCloud')}
            </GameButton>
          </div>
          <GameButton variant="red" disabled={busy} onClick={() => { audio.sfx('click'); logoutAccount(); }}>
            <LogOut className="w-4 h-4" /> {t('logout')}
          </GameButton>
        </>
      )}
    </section>
  );
}
