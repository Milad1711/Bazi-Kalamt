// ============ Game Shell — root of Word Game 3D ============
'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '@/lib/game/store';
import { useI18n } from './ui';
import { audio } from '@/lib/game/audio';
import { LogoMark } from '@/lib/game/art';
import { Onboarding } from './Onboarding';
import { Lobby, type Nav } from './Lobby';
import { WordHunter } from './WordHunter';
import { MemoryMatch } from './MemoryMatch';
import { WordGuess } from './WordGuess';
import { Shop } from './Shop';
import { Missions } from './Missions';
import { SettingsScreen } from './SettingsScreen';
import { Profile } from './Profile';
import { Leaderboard } from './Leaderboard';
import { ErrorBoundary, OfflineBanner } from './Resilience';
import { ParticlesCanvas, FlyingCoins } from './Fx';
import { loadCustomWords } from '@/lib/game/words';
import type { CategoryId, Difficulty, Screen } from '@/lib/game/types';

export default function GameShell() {
  const hydrated = useGame((s) => s.hydrated);
  const onboarded = useGame((s) => s.onboarded);
  const theme = useGame((s) => s.theme);
  const lang = useGame((s) => s.lang);
  const equipped = useGame((s) => s.equipped);

  const [screen, setScreen] = useState<Screen>('lobby');
  const quality = useGame((s) => s.quality);
  const [whInitial, setWhInitial] = useState<{ cat: CategoryId; diff: Difficulty; level: number } | null>(null);
  const [mmInitial, setMmInitial] = useState<{ diff: Difficulty; level: number } | null>(null);
  const [whSel, setWhSel] = useState<{ cat: CategoryId; diff: Difficulty }>({ cat: 'animals', diff: 'easy' });
  const [mmSel, setMmSel] = useState<{ diff: Difficulty }>({ diff: 'normal' });
  const audioInited = useRef(false);

  // direction & language on <html>
  useEffect(() => {
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // pull admin-panel custom words into the runtime word banks (بخش ۱۷)
  useEffect(() => {
    loadCustomWords('fa');
    loadCustomWords('en');
  }, []);

  // init audio on first user gesture (browser autoplay policy)
  useEffect(() => {
    const init = () => {
      if (audioInited.current) return;
      audioInited.current = true;
      audio.init();
      if (useGame.getState().music) audio.playMusic(screen === 'lobby' ? 'lobby' : 'game');
      window.removeEventListener('pointerdown', init);
      window.removeEventListener('keydown', init);
    };
    window.addEventListener('pointerdown', init, { once: false });
    window.addEventListener('keydown', init, { once: false });
    return () => {
      window.removeEventListener('pointerdown', init);
      window.removeEventListener('keydown', init);
    };
  }, []);  

  // pause music when tab hidden
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) audio.stopMusic();
      else if (audioInited.current && useGame.getState().music) {
        audio.playMusic(screen === 'lobby' || screen === 'shop' || screen === 'missions' || screen === 'settings' ? 'lobby' : 'game');
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [screen]);

  const go = useCallback((s: Screen) => {
    setScreen(s);
    if (s === 'word-game' || s === 'memory-game' || s === 'guess') audio.playMusic('game');
    else audio.playMusic('lobby');
  }, []);

  const nav: Nav = useMemo(
    () => ({
      go,
      whSel,
      setWhSel,
      mmSel,
      setMmSel,
      playWh: (cat, diff, level) => {
        setWhInitial({ cat, diff, level });
        setWhSel({ cat, diff });
        go('word-game');
      },
      playMm: (diff, level) => {
        setMmInitial({ diff, level });
        setMmSel({ diff });
        go('memory-game');
      },
    }),
    [go, whSel, mmSel],
  );

  if (!hydrated) {
    return (
      <div className="game-root" data-theme="meadow" dir="rtl">
        <div className="min-h-screen grid place-items-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 mascot-wrap"><LogoMark className="w-full h-full" /></div>
            <div className="w-40 h-3 rounded-full overflow-hidden bg-black/15 border border-white/50">
              <div className="h-full w-1/2 rounded-full" style={{ background: 'linear-gradient(90deg,#7be3a3,#38c172)', animation: 'load-slide 1s ease-in-out infinite alternate' }} />
            </div>
          </div>
        </div>
        <style>{`@keyframes load-slide { from { transform: translateX(-60%);} to { transform: translateX(120%);} }`}</style>
      </div>
    );
  }

  if (!onboarded) return <Onboarding />;

  return (
    <div
      className="game-root"
      data-theme={theme}
      data-skin={equipped.skin}
      data-board={equipped.board}
      data-bg={equipped.bg}
      data-quality={quality}
    >
      <ErrorBoundary>
        <OfflineBanner />
        <div className="ambience">
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
          {quality !== 'low' && THEME_SPARKLES.map((s, i) => (
            <span key={i} className="twinkle" style={s} />
          ))}
        </div>
        <ParticlesCanvas />
        <FlyingCoins />

        <div className="relative z-10 mx-auto w-full max-w-[560px] min-h-screen flex flex-col px-3">
          {screen === 'lobby' && <Lobby nav={nav} />}
          {screen === 'word-select' && <WordHunter nav={nav} initial={null} />}
          {screen === 'word-game' && (
            <WordHunter
              key={`wh-${whInitial?.cat}-${whInitial?.diff}-${whInitial?.level}`}
              nav={nav}
              initial={whInitial}
            />
          )}
          {screen === 'memory-select' && <MemoryMatch nav={nav} initial={null} />}
          {screen === 'memory-game' && (
            <MemoryMatch
              key={`mm-${mmInitial?.diff}-${mmInitial?.level}`}
              nav={nav}
              initial={mmInitial}
            />
          )}
          {screen === 'guess' && <WordGuess onBack={() => go('lobby')} />}
          {screen === 'shop' && <Shop onBack={() => go('lobby')} />}
          {screen === 'missions' && <Missions onBack={() => go('lobby')} />}
          {screen === 'settings' && <SettingsScreen onBack={() => go('lobby')} />}
          {screen === 'profile' && <Profile onBack={() => go('lobby')} goMissions={() => go('missions')} />}
          {screen === 'leaderboard' && <Leaderboard onBack={() => go('lobby')} />}
        </div>
      </ErrorBoundary>
    </div>
  );
}

const THEME_SPARKLES = [
  { top: '12%', left: '8%' }, { top: '22%', left: '82%' }, { top: '60%', left: '90%' },
  { top: '75%', left: '6%' }, { top: '40%', left: '50%' }, { top: '88%', left: '60%' },
  { top: '8%', left: '45%' }, { top: '50%', left: '12%' },
].map((p) => ({ ...p, animationDelay: `${Math.random() * 3}s` }));
