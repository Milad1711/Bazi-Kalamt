// ============ Memory Match 3D — select + gameplay ============
'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Eye, Shuffle, Lock, Layers } from 'lucide-react';
import { useI18n, TopBar, CoinPill, TimerChip, GameButton, GameModal } from './ui';
import { LevelMap } from './LevelMap';
import { VictoryModal, DefeatModal, LevelUpModal } from './Overlays';
import { useGame, SHOP_DECKS } from '@/lib/game/store';
import { buildMemoryCards, memoryLevelConfig, TOTAL_MM_LEVELS, type MemoryCard } from '@/lib/game/memoryEngine';
import { computeMMRewards } from '@/lib/game/economy';
import { audio } from '@/lib/game/audio';
import { burstAt, coinsFrom } from '@/lib/game/fx-bus';
import { GameIcon } from '@/lib/game/art';
import type { Difficulty, LevelRewards } from '@/lib/game/types';
import type { LevelUpEvent } from '@/lib/game/store';
import type { Nav } from './Lobby';
import { DIFFICULTIES } from '@/lib/game/types';

const PEEK_COST = 60;
const SHUFFLE_COST = 40;

export function MemoryMatch({ nav, initial }: { nav: Nav; initial?: { diff: Difficulty; level: number } | null }) {
  const [game, setGame] = useState<{ diff: Difficulty; level: number } | null>(initial ?? null);
  if (game) {
    return <MemoryGame key={`${game.diff}:${game.level}`} nav={nav} config={game} onExit={() => setGame(null)} />;
  }
  return <MemorySelect nav={nav} onPlay={(diff, level) => setGame({ diff, level })} />;
}

// ================= SELECT =================
function MemorySelect({ nav, onPlay }: { nav: Nav; onPlay: (diff: Difficulty, level: number) => void }) {
  const { t, fmt } = useI18n();
  const deck = useGame((s) => s.deck);
  const ownedDecks = useGame((s) => s.ownedDecks);
  const equipDeck = useGame((s) => s.equipDeck);
  const mmUnlockedLevel = useGame((s) => s.mmUnlockedLevel);
  const mmStarsFor = useGame((s) => s.mmStarsFor);
  const [diff, setDiff] = useState<Difficulty>(nav.mmSel.diff);

  useEffect(() => { nav.setMmSel({ diff }); }, [diff]);  

  return (
    <div className="flex flex-col gap-3 pb-8">
      <TopBar title={t('worldMmTitle')} subtitle={t('chooseDeck')} onBack={() => nav.go('lobby')} />

      {/* decks */}
      <section>
        <p className="text-xs font-black opacity-70 mb-1.5">{t('chooseDeck')}</p>
        <div className="grid grid-cols-5 gap-2">
          {SHOP_DECKS.map((d) => {
            const owned = ownedDecks.includes(d.id);
            const active = deck === d.id;
            return (
              <button
                key={d.id}
                disabled={!owned}
                onClick={() => { audio.sfx('tick'); equipDeck(d.id); }}
                className="rounded-2xl p-1.5 border-2 flex flex-col items-center gap-0.5 transition-all active:translate-y-0.5 relative"
                style={{
                  background: active ? 'linear-gradient(180deg,#b39dff,#9c6dff)' : 'var(--panel)',
                  borderColor: active ? '#7a45e0' : 'var(--panel-border)',
                  boxShadow: active ? '0 4px 0 #7a45e0' : '0 4px 0 rgba(31,20,60,.08)',
                  opacity: owned ? 1 : 0.55,
                }}
              >
                {!owned && (
                  <span className="absolute -top-1.5 -end-1.5 w-5 h-5 rounded-full bg-black/40 border-2 border-white grid place-items-center">
                    <Lock className="w-3 h-3 text-white" />
                  </span>
                )}
                <GameIcon name={deckPreviewIcon(d.id)} className="w-8 h-8" />
                <span className="text-[8px] font-black text-center leading-tight" style={{ color: active ? '#fff' : 'var(--ink)' }}>
                  {t(`deck_${d.id}` as 'deck_animals')}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <p className="text-xs font-black opacity-70 mb-1.5">{t('chooseDifficulty')}</p>
        <div className="grid grid-cols-2 gap-2">
          {DIFFICULTIES.map((d) => {
            const active = diff === d;
            const cfg = memoryLevelConfig(d, 1);
            return (
              <button
                key={d}
                onClick={() => { audio.sfx('tick'); setDiff(d); }}
                className="rounded-2xl p-2.5 text-start border-2 transition-all active:translate-y-0.5"
                style={{
                  background: active ? 'linear-gradient(180deg,#7be3a3,#38c172)' : 'var(--panel)',
                  borderColor: active ? '#1f9d55' : 'var(--panel-border)',
                  boxShadow: active ? '0 4px 0 #1f9d55' : '0 4px 0 rgba(31,20,60,.08)',
                  color: active ? '#fff' : 'var(--ink)',
                }}
              >
                <span className="font-black text-sm block">{t(`diff_${d}` as 'diff_easy')}</span>
                <span className={`text-[9px] font-bold ${active ? 'text-white/85' : 'opacity-60'}`}>
                  {fmt(cfg.pairs)} {t('pairsUnit')} · {fmt(cfg.pairs * 2)} {t('cardsUnit')}
                  {cfg.timeLimit ? ' · ⏱' : ''}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="glass-panel p-3">
        <LevelMap
          totalLevels={TOTAL_MM_LEVELS}
          unlocked={mmUnlockedLevel(diff)}
          starsFor={(l) => mmStarsFor(diff, l)}
          onPlay={(l) => onPlay(diff, l)}
        />
      </section>
    </div>
  );
}

function deckPreviewIcon(deck: string): string {
  switch (deck) {
    case 'animals': return 'owl';
    case 'fruits': return 'apple';
    case 'sweets': return 'candy';
    case 'fantasy': return 'mblue';
    case 'vehicles': return '🚗';
    case 'objects': return '🎒';
    case 'emojis': return '😀';
    case 'nature': return '🌸';
    case 'colorful': return '🌈';
    default: return 'owl';
  }
}

// ================= GAME =================
function MemoryGame({ nav, config, onExit }: { nav: Nav; config: { diff: Difficulty; level: number }; onExit: () => void }) {
  const { t, fmt } = useI18n();
  const coins = useGame((s) => s.coins);
  const spendCoins = useGame((s) => s.spendCoins);
  const recordMMResult = useGame((s) => s.recordMMResult);
  const trackMission = useGame((s) => s.trackMission);
  const deck = useGame((s) => s.deck);

  const levelConfig = useMemo(() => memoryLevelConfig(config.diff, config.level), [config]);
  const [cards, setCards] = useState<MemoryCard[]>(() => buildMemoryCards(deck, levelConfig.pairs));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const [peeking, setPeeking] = useState(false);
  const [preview, setPreview] = useState(() => levelConfig.previewSec ?? 0);
  const [elapsed, setElapsed] = useState(0);
  const [wrongPair, setWrongPair] = useState<number[]>([]);
  const [finished, setFinished] = useState<'win' | 'lose' | null>(null);
  const [rewards, setRewards] = useState<LevelRewards | null>(null);
  const [levelUps, setLevelUps] = useState<LevelUpEvent[] | null>(null);
  const [levelUpOpen, setLevelUpOpen] = useState(false);
  const [exitConfirm, setExitConfirm] = useState(false);
  const [comboFlash, setComboFlash] = useState(0);

  const lockRef = useRef(false);
  const lastMatchRef = useRef(0);
  const busyRef = useRef(false);
  const usedPowerupRef = useRef(false);
  const previewActive = preview > 0;

  useEffect(() => {
    audio.playMusic('game');
    return () => audio.playMusic('lobby');
  }, []);

  // initial "memorize" phase countdown (3–5 s on some levels)
  useEffect(() => {
    if (preview <= 0 || finished) return;
    const id = setTimeout(() => setPreview((p) => p - 1), 1000);
    return () => clearTimeout(id);
  }, [preview, finished]);

  // countdown timer — paused during the preview phase
  useEffect(() => {
    if (finished || previewActive) return;
    const id = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1;
        if (levelConfig.timeLimit && next >= levelConfig.timeLimit) {
          setFinished('lose');
          audio.sfx('defeat');
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [finished, levelConfig, previewActive]);

  const finishWin = useCallback(() => {
    const r = computeMMRewards(config.diff, levelConfig.pairs, moves, bestCombo, mistakes, undefined, levelConfig.boss);
    const events = recordMMResult(config.diff, config.level, r, levelConfig.pairs, bestCombo, mistakes, usedPowerupRef.current, moves, Math.round(elapsed));
    setRewards(r);
    setLevelUps(events.length ? events : null);
    setFinished('win');
    audio.sfx('victory');
  }, [config, levelConfig, moves, bestCombo, mistakes, recordMMResult]);

  const onCardClick = (card: MemoryCard) => {
    if (lockRef.current || peeking || previewActive || finished || card.matched) return;
    if (flipped.includes(card.id)) return;
    audio.sfx('flip');
    audio.vibrate(10);

    const next = [...flipped, card.id];
    setFlipped(next);

    if (next.length === 2) {
      const nextMoves = moves + 1;
      setMoves(nextMoves);
      const [a, b] = next.map((id) => cards.find((c) => c.id === id)!);
      if (a.icon === b.icon) {
        // match!
        const now = Date.now();
        const newCombo = now - lastMatchRef.current < 5000 ? combo + 1 : 1;
        lastMatchRef.current = now;
        setCombo(newCombo);
        setBestCombo((bc) => Math.max(bc, newCombo));
        if (newCombo >= 2) {
          setComboFlash(newCombo);
          setTimeout(() => setComboFlash(0), 1200);
        }
        lockRef.current = true;
        setTimeout(() => {
          setCards((cs) => cs.map((c) => (c.id === a.id || c.id === b.id ? { ...c, matched: true } : c)));
          setFlipped([]);
          const nm = matchedCount + 1;
          setMatchedCount(nm);
          if (nm === levelConfig.pairs) {
            setTimeout(finishWin, 650);
          } else if (levelConfig.moveLimit && nextMoves >= levelConfig.moveLimit) {
            // boss: out of moves with pairs still hidden
            setFinished('lose');
            audio.sfx('defeat');
          }
          audio.sfx('match');
          trackMission('pairs_matched', 1);
          trackMission('combo_reached', newCombo);
          lockRef.current = false;
        }, 420);
      } else {
        // mismatch
        setCombo(0);
        setMistakes((m) => m + 1);
        lockRef.current = true;
        setWrongPair(next);
        setTimeout(() => {
          setFlipped([]);
          setWrongPair([]);
          lockRef.current = false;
          if (levelConfig.moveLimit && nextMoves >= levelConfig.moveLimit) {
            setFinished('lose');
            audio.sfx('defeat');
          }
        }, 900);
        audio.sfx('mismatch');
      }
    }
  };

  const doPeek = () => {
    if (peeking || finished || coins < PEEK_COST) { if (coins < PEEK_COST) audio.sfx('wrong'); return; }
    if (!spendCoins(PEEK_COST)) return;
    usedPowerupRef.current = true;
    setPeeking(true);
    audio.sfx('hint');
    setTimeout(() => setPeeking(false), 1800);
  };

  const doShuffle = () => {
    if (finished || busyRef.current || coins < SHUFFLE_COST) { if (coins < SHUFFLE_COST) audio.sfx('wrong'); return; }
    if (!spendCoins(SHUFFLE_COST)) return;
    usedPowerupRef.current = true;
    const unmatched = cards.filter((c) => !c.matched);
    const matched = cards.filter((c) => c.matched);
    for (let i = unmatched.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [unmatched[i], unmatched[j]] = [unmatched[j], unmatched[i]];
    }
    setCards([...matched, ...unmatched]);
    setFlipped([]);
    setCombo(0);
    audio.sfx('pop');
  };

  const retry = () => {
    setCards(buildMemoryCards(deck, levelConfig.pairs));
    setFlipped([]);
    setMoves(0); setCombo(0); setBestCombo(0); setMistakes(0); setMatchedCount(0);
    setElapsed(0); setFinished(null); setRewards(null); setLevelUps(null);
    setPreview(levelConfig.previewSec ?? 0);
    usedPowerupRef.current = false;
    lockRef.current = false;
  };

  const boardStyle = { gridTemplateColumns: `repeat(${levelConfig.cols}, 1fr)` };
  const boardMax = levelConfig.cols >= 8 ? 'min(96vw, 560px)' : 'min(94vw, 470px)';
  const movesLeft = levelConfig.moveLimit ? Math.max(0, levelConfig.moveLimit - moves) : null;

  return (
    <div className="flex flex-col gap-2 pb-6">
      <TopBar
        title={
          <span className="flex items-center gap-1.5 justify-center flex-wrap">
            {t(`deck_${deck}` as 'deck_animals')}
            <span className="opacity-50">·</span>
            <span>{t(`diff_${config.diff}` as 'diff_easy')}</span>
            <span className="opacity-50">·</span>
            <span>{t('levelN', { n: config.level })}</span>
            {levelConfig.boss && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black text-white"
                style={{ background: 'linear-gradient(180deg,#ff8a65,#e64a19)', border: '1.5px solid #fff' }}>
                👑 {t('bossBadge')}
              </span>
            )}
          </span>
        }
        onBack={() => { if (matchedCount > 0 && !finished) setExitConfirm(true); else { onExit(); nav.go('memory-select'); } }}
        right={<CoinPill amount={coins} />}
      />

      <div className="flex items-center gap-2 flex-wrap">
        <TimerChip seconds={levelConfig.timeLimit ? Math.max(0, levelConfig.timeLimit - elapsed) : elapsed} warning={!!levelConfig.timeLimit && levelConfig.timeLimit - elapsed <= 20} />
        <span className="chip" style={{ background: 'var(--panel-strong)' }}>
          <Layers className="w-4 h-4" />
          <span className="font-black">{fmt(matchedCount)}/{fmt(levelConfig.pairs)}</span>
        </span>
        <span
          className="chip"
          style={movesLeft !== null ? { background: movesLeft <= 3 ? '#ffdcdc' : 'var(--panel-strong)' } : { background: 'var(--panel-strong)' }}
          title={movesLeft !== null ? t('moveLimit') : undefined}
        >
          <span className="font-black text-[11px]">
            {t('moves')}: {fmt(moves)}{movesLeft !== null ? `/${fmt(levelConfig.moveLimit!)}` : ''}
          </span>
        </span>
        <div className="flex-1" />
        <GameButton size="sm" variant="gold" onClick={doPeek} disabled={finished !== null} title={t('peekCost', { n: PEEK_COST })}>
          <Eye className="w-4 h-4" /> {fmt(PEEK_COST)}
        </GameButton>
        <GameButton size="sm" variant="blue" onClick={doShuffle} disabled={finished !== null} title={t('shuffleCost', { n: SHUFFLE_COST })}>
          <Shuffle className="w-4 h-4" /> {fmt(SHUFFLE_COST)}
        </GameButton>
      </div>

      {previewActive ? (
        <div className="preview-badge self-center px-4 py-1.5 rounded-full font-black text-white text-sm"
          style={{ background: 'linear-gradient(90deg,#7c4dff,#b388ff)', boxShadow: '0 4px 0 rgba(0,0,0,.18)' }}>
          👀 {t('previewBanner')} · {fmt(preview)}s
        </div>
      ) : comboFlash >= 2 && (
        <div className="combo-badge self-center px-4 py-1 rounded-full font-black text-white text-lg"
          style={{ background: 'linear-gradient(90deg,#ff6d3f,#ffb300)', boxShadow: '0 4px 0 rgba(0,0,0,.18)' }}>
          {t('combo', { n: comboFlash })} 🔥
        </div>
      )}

      <div className="mm-board flex justify-center">
        <div className="grid gap-1.5 w-full" style={{ ...boardStyle, maxWidth: boardMax }}>
          {cards.map((card) => {
            const isUp = flipped.includes(card.id) || card.matched || peeking || previewActive;
            const isWrong = wrongPair.includes(card.id);
            return (
              <button
                key={card.id}
                className={`mm-card ${isUp ? (card.matched ? 'matched' : 'flipped') : ''} ${isWrong ? 'wrong' : ''}`}
                onClick={() => onCardClick(card)}
                disabled={card.matched || finished !== null}
                aria-label={isUp ? 'card face' : 'hidden card'}
              >
                <div className="mm-face mm-back"><div className="mm-pattern" /></div>
                <div className="mm-face mm-front">
                  <GameIcon name={card.icon} className="w-[72%] h-[72%]" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <DefeatModal
        open={finished === 'lose'}
        onRetry={retry}
        onBack={() => { onExit(); nav.go('memory-select'); }}
      />
      {finished === 'win' && rewards && (
        <VictoryModal
          open
          rewards={rewards}
          isMemory
          canNext={config.level < TOTAL_MM_LEVELS}
          onBack={() => { onExit(); nav.go('memory-select'); }}
          onReplay={retry}
          onNext={() => { onExit(); nav.playMm(config.diff, config.level + 1); }}
          onClose={() => { if (levelUps) setLevelUpOpen(true); }}
        />
      )}
      <LevelUpModal events={levelUpOpen ? levelUps : null} onClose={() => setLevelUpOpen(false)} />

      <GameModal open={exitConfirm} onClose={() => setExitConfirm(false)}>
        <div className="text-center">
          <h3 className="text-lg font-black mb-1">{t('exitLevel')}</h3>
          <p className="text-xs font-bold opacity-60 mb-3">{t('exitWarn')}</p>
          <div className="flex gap-2 justify-center">
            <GameButton variant="blue" onClick={() => setExitConfirm(false)}>{t('cancel')}</GameButton>
            <GameButton variant="red" onClick={() => { setExitConfirm(false); onExit(); nav.go('memory-select'); }}>{t('confirm')}</GameButton>
          </div>
        </div>
      </GameModal>
    </div>
  );
}
