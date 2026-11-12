// ============ Word Hunter — select + gameplay ============
'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  PawPrint, Apple, Utensils, Globe2, Building2, TreePine, Cpu, Trophy,
  FlaskConical, Clapperboard, BookOpen, Languages, CaseUpper, Lightbulb, Check,
} from 'lucide-react';
import { useI18n, TopBar, CoinPill, TimerChip, GameButton, GameModal } from './ui';
import { LevelMap } from './LevelMap';
import { VictoryModal, DefeatModal, LevelUpModal } from './Overlays';
import { useGame } from '@/lib/game/store';
import { generateWordSearch, buildPath, pathWord, WORD_LINE_COLORS } from '@/lib/game/wordEngine';
import { computeWHRewards } from '@/lib/game/economy';
import { audio } from '@/lib/game/audio';
import { burstAt } from '@/lib/game/fx-bus';
import type { CellPos, CategoryId, Difficulty, WordSearchPuzzle, LevelRewards } from '@/lib/game/types';
import { isBossLevel } from '@/lib/game/types';
import type { LevelUpEvent } from '@/lib/game/store';
import type { Nav } from './Lobby';
import { ALL_CATEGORIES, DIFFICULTIES } from '@/lib/game/types';
import { TOTAL_WH_LEVELS } from '@/lib/game/memoryEngine';
import { bankSize } from '@/lib/game/words';
import { Mascot } from '@/lib/game/art';

export const CATEGORY_ICONS: Record<CategoryId, React.ComponentType<{ className?: string }>> = {
  animals: PawPrint, fruits: Apple, food: Utensils, countries: Globe2, cities: Building2,
  nature: TreePine, technology: Cpu, sports: Trophy, science: FlaskConical,
  movies: Clapperboard, general: BookOpen, persianWords: Languages, englishWords: CaseUpper,
};

const HINT_COST = 25;

export function WordHunter({ nav, initial }: { nav: Nav; initial?: { cat: CategoryId; diff: Difficulty; level: number } | null }) {
  const [game, setGame] = useState<{ cat: CategoryId; diff: Difficulty; level: number } | null>(initial ?? null);
  if (game) {
    return <WordGame key={`${game.cat}:${game.diff}:${game.level}`} nav={nav} config={game} onExit={() => setGame(null)} />;
  }
  return <WordSelect nav={nav} onPlay={(cat, diff, level) => setGame({ cat, diff, level })} />;
}

// ================= SELECT =================
function WordSelect({ nav, onPlay }: { nav: Nav; onPlay: (cat: CategoryId, diff: Difficulty, level: number) => void }) {
  const { t, fmt, lang } = useI18n();
  const whUnlockedLevel = useGame((s) => s.whUnlockedLevel);
  const whStarsFor = useGame((s) => s.whStarsFor);
  const [cat, setCat] = useState<CategoryId>(nav.whSel.cat);
  const [diff, setDiff] = useState<Difficulty>(nav.whSel.diff);

  useEffect(() => { nav.setWhSel({ cat, diff }); }, [cat, diff]);  

  return (
    <div className="flex flex-col gap-3 pb-8">
      <TopBar title={t('worldWhTitle')} subtitle={t('chooseCategory')} onBack={() => nav.go('lobby')} />

      <section className="grid grid-cols-3 gap-2">
        {ALL_CATEGORIES.map((c) => {
          const Icon = CATEGORY_ICONS[c];
          const active = cat === c;
          return (
            <button
              key={c}
              onClick={() => { audio.sfx('tick'); setCat(c); }}
              className="rounded-2xl p-2 flex flex-col items-center gap-1 border-2 transition-all active:translate-y-0.5"
              style={{
                background: active ? 'linear-gradient(180deg, color-mix(in srgb, var(--accent) 85%, #fff 15%), var(--accent))' : 'var(--panel)',
                borderColor: active ? 'var(--accent-deep)' : 'var(--panel-border)',
                boxShadow: active ? '0 4px 0 var(--accent-deep)' : '0 4px 0 rgba(31,20,60,.08)',
                color: active ? '#fff' : 'var(--ink)',
              }}
            >
              <Icon className="w-6 h-6" />
              <span className="text-[10px] font-black text-center leading-tight">{t(`cat_${c}` as 'cat_animals')}</span>
              <span className={`text-[8px] font-bold ${active ? 'text-white/80' : 'opacity-50'}`}>
                {t('cat_wordsCount', { n: fmt(bankSize(c, lang)) })}
              </span>
            </button>
          );
        })}
      </section>

      <section>
        <p className="text-xs font-black opacity-70 mb-1.5">{t('chooseDifficulty')}</p>
        <div className="grid grid-cols-2 gap-2">
          {DIFFICULTIES.map((d) => {
            const active = diff === d;
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
                <span className={`text-[9px] font-bold ${active ? 'text-white/85' : 'opacity-60'}`}>{t(`diffDesc_${d}` as 'diffDesc_easy')}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="glass-panel p-3">
        <LevelMap
          totalLevels={TOTAL_WH_LEVELS}
          unlocked={whUnlockedLevel(cat, diff)}
          starsFor={(l) => whStarsFor(cat, diff, l)}
          onPlay={(l) => onPlay(cat, diff, l)}
        />
      </section>
    </div>
  );
}

// ================= GAME =================
interface WordGameProps {
  nav: Nav;
  config: { cat: CategoryId; diff: Difficulty; level: number };
  onExit: () => void;
}

function WordGame({ nav, config, onExit }: WordGameProps) {
  const { t, fmt, lang } = useI18n();
  const coins = useGame((s) => s.coins);
  const hintTokens = useGame((s) => s.hintTokens);
  const spendCoins = useGame((s) => s.spendCoins);
  const recordWHResult = useGame((s) => s.recordWHResult);
  const trackMission = useGame((s) => s.trackMission);
  const whUsedWords = useGame((s) => s.whUsedWords);
  const gridScale = useGame((s) => s.gridScale);
  const letterScale = useGame((s) => s.letterScale);

  // puzzle is generated lazily ONCE per mount (stable seed shared by puzzle + usedWords)
  const [gen] = useState(() => {
    const recent = useGame.getState().whUsedWords[`${lang}:${config.cat}`] ?? [];
    return generateWordSearch(config.cat, config.diff, config.level, lang, recent);
  });
  const [puzzle, setPuzzle] = useState<WordSearchPuzzle | null>(gen.puzzle);
  const [usedWords, setUsedWords] = useState<string[]>(gen.usedWords);
  const [path, setPath] = useState<CellPos[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [hintCell, setHintCell] = useState<CellPos | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState<'win' | 'lose' | null>(null);
  const [rewards, setRewards] = useState<LevelRewards | null>(null);
  const [levelUps, setLevelUps] = useState<LevelUpEvent[] | null>(null);
  const [levelUpOpen, setLevelUpOpen] = useState(false);
  const [exitConfirm, setExitConfirm] = useState(false);
  const [shake, setShake] = useState(false);

  const gridRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const draggingRef = useRef<{ start: CellPos | null }>({ start: null });
  const hintsUsedRef = useRef(0);
  const foundCountRef = useRef(0);
  const elapsedRef = useRef(0);
  const usedWordsRef = useRef<string[]>(gen.usedWords);
  const puzzleRef = useRef<WordSearchPuzzle | null>(gen.puzzle);

  // keep refs in sync with state (external-system style)
  useEffect(() => {
    puzzleRef.current = puzzle;
    usedWordsRef.current = usedWords;
  }, [puzzle, usedWords]);

  // game music
  useEffect(() => {
    audio.playMusic('game');
    return () => audio.playMusic('lobby');
  }, []);

  // timer
  useEffect(() => {
    if (finished || !puzzle) return;
    const id = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1;
        elapsedRef.current = next;
        if (puzzle.timeLimit && next >= puzzle.timeLimit) {
          setFinished('lose');
          audio.sfx('defeat');
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [finished, puzzle]);

  // finish the level (refs keep time/hints fresh)
  const finishLevel = useCallback((foundList: string[]) => {
    const wordLengths = foundList.map((w) => w.length);
    const r = computeWHRewards(config.diff, wordLengths, elapsedRef.current, hintsUsedRef.current, puzzleRef.current?.parTime ?? 999, undefined, isBossLevel(config.level));
    const events = recordWHResult(config.cat, config.diff, config.level, r, foundList.length, hintsUsedRef.current, usedWordsRef.current, Math.round(elapsedRef.current));
    setRewards(r);
    setLevelUps(events.length ? events : null);
    setFinished('win');
  }, [config, recordWHResult]);

  // word found handler
  const handleFound = useCallback((word: string, cells: CellPos[]) => {
    setFoundWords((prev) => [...prev, word]);
    foundCountRef.current += 1;
    const total = puzzleRef.current?.placements.length ?? -1;
    if (foundCountRef.current === total) {
      const list = puzzleRef.current!.placements.map((p) => p.word);
      setTimeout(() => finishLevel(list), 420);
    }
    // pop animation on cells
    cells.forEach(({ r, c }) => {
      const el = cellRefs.current.get(`${r},${c}`);
      el?.classList.remove('found-pop');
      void el?.offsetWidth;
      el?.classList.add('found-pop');
    });
    const last = cells[cells.length - 1];
    const el = cellRefs.current.get(`${last.r},${last.c}`);
    burstAt(el ?? null, 'sparkle');
    trackMission('word_found', 1);
    setHintCell((h) => (h && cells.some((p) => p.r === h.r && p.c === h.c) ? null : h));
  }, [trackMission, finishLevel]);

  // ---------- pointer logic ----------
  const cellFromPoint = (clientX: number, clientY: number): CellPos | null => {
    if (!gridRef.current || !puzzle) return null;
    const rect = gridRef.current.getBoundingClientRect();
    const size = puzzle.size;
    const cw = rect.width / size;
    const ch = rect.height / size;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    if (x < -cw * 0.35 || y < -ch * 0.35 || x > rect.width + cw * 0.35 || y > rect.height + ch * 0.35) return null;
    const visualC = Math.max(0, Math.min(size - 1, Math.floor(x / cw)));
    const c = lang === 'fa' ? size - 1 - visualC : visualC; // RTL mirrors columns
    const r = Math.max(0, Math.min(size - 1, Math.floor(y / ch)));
    return { r, c };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (finished || !puzzle) return;
    if (!e.isPrimary) return;
    const cell = cellFromPoint(e.clientX, e.clientY);
    if (!cell) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    draggingRef.current.start = cell;
    setPath([cell]);
    audio.sfx('letter', 0);
    audio.vibrate(8);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (finished || !puzzle || !draggingRef.current.start) return;
    if (!e.isPrimary) return;
    const cell = cellFromPoint(e.clientX, e.clientY);
    if (!cell) return;
    const p = buildPath(draggingRef.current.start, cell, puzzle.size);
    setPath((prev) => {
      if (p.length !== prev.length || p[p.length - 1].r !== prev[prev.length - 1]?.r || p[p.length - 1].c !== prev[prev.length - 1]?.c) {
        audio.sfx('letter', p.length);
      }
      return p;
    });
  };

  const endDrag = () => {
    if (!puzzle) return;
    const start = draggingRef.current.start;
    draggingRef.current.start = null;
    if (!start) return;
    if (path.length >= 2) {
      const word = pathWord(puzzle.grid, path);
      const reversed = [...word].reverse().join('');
      const hit = puzzle.placements.find((p) => !p.found && (p.word === word || p.word === reversed));
      if (hit) {
        hit.found = true;
        handleFound(hit.word, hit.cells);
      } else {
        setShake(true);
        setTimeout(() => setShake(false), 380);
        audio.sfx('wrong');
        audio.vibrate([30, 40, 30]);
      }
    }
    setPath([]);
  };

  // ---------- hint (free token first, then coins) ----------
  const useHint = () => {
    if (!puzzle || finished) return;
    const remaining = puzzle.placements.filter((p) => !p.found);
    if (!remaining.length) return;
    const store = useGame.getState();
    if (store.hintTokens > 0) {
      store.useHintToken();
    } else {
      if (coins < HINT_COST) {
        audio.sfx('wrong');
        return;
      }
      if (!spendCoins(HINT_COST)) return;
    }
    hintsUsedRef.current++;
    const target = remaining[Math.floor(Math.random() * remaining.length)];
    setHintCell(target.cells[0]);
    audio.sfx('hint');
    setTimeout(() => setHintCell((h) => (h === target.cells[0] ? null : h)), 7000);
  };

  const retry = () => {
    const recent = whUsedWords[`${lang}:${config.cat}`] ?? [];
    const { puzzle: p, usedWords: uw } = generateWordSearch(config.cat, config.diff, config.level, lang, recent);
    setPuzzle(p);
    setUsedWords(uw);
    usedWordsRef.current = uw;
    puzzleRef.current = p;
    setFoundWords([]);
    foundCountRef.current = 0;
    hintsUsedRef.current = 0;
    setElapsed(0);
    elapsedRef.current = 0;
    setFinished(null);
    setRewards(null);
    setLevelUps(null);
  };

  // ---------- rendering helpers (pure math, RTL-aware) ----------
  // The SVG overlay stretches exactly over the uniform grid, so cell centers in
  // percent are pure math. In RTL the grid flips columns (logical col 0 sits on
  // the right), so visual x is mirrored.
  const isRtl = lang === 'fa';
  const toPoints = (cells: CellPos[]) =>
    cells
      .map(({ r, c }) => {
        const visualC = isRtl ? puzzle!.size - 1 - c : c;
        return `${((visualC + 0.5) / puzzle!.size) * 100},${((r + 0.5) / puzzle!.size) * 100}`;
      })
      .join(' ');

  if (!puzzle) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="mascot-wrap w-24"><Mascot /></div>
        <p className="font-black opacity-60">…</p>
      </div>
    );
  }

  const remaining = puzzle.placements.length - foundWords.length;
  const foundSet = new Set(foundWords);
  const pathSet = new Set(path.map((p) => `${p.r},${p.c}`));
  // player-adjustable display scale (تنظیمات: اندازه جدول و فونت — کوچک/متوسط/بزرگ)
  const gridSizeStyle = {
    gridTemplateColumns: `repeat(${puzzle.size}, 1fr)`,
    maxWidth: `min(94vw, ${Math.round(470 * gridScale)}px)`,
  };
  // letter size — ۵۲٪ اندازه سلول در حالت پیش‌فرض: حروف کاملاً داخل خانه می‌مانند
  // و لمس دقیق‌تر می‌شود؛ ضریب با تنظیم فونت بازیکن (کوچک/متوسط/بزرگ) تغییر می‌کند
  const fontSize = `calc(${(100 / puzzle.size).toFixed(4)}cqw * ${(0.52 * letterScale).toFixed(3)})`;

  return (
    <div className="flex flex-col gap-2 pb-6">
      <TopBar
        title={
          <span className="flex items-center gap-1.5 justify-center flex-wrap">
            {t(`cat_${config.cat}` as 'cat_animals')}
            <span className="opacity-50">·</span>
            <span>{t(`diff_${config.diff}` as 'diff_easy')}</span>
            <span className="opacity-50">·</span>
            <span>{t('levelN', { n: config.level })}</span>
            {isBossLevel(config.level) && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black text-white"
                style={{ background: 'linear-gradient(180deg,#ff8a65,#e64a19)', border: '1.5px solid #fff' }}>
                👑 {t('bossBadge')}
              </span>
            )}
          </span>
        }
        onBack={() => { if (foundWords.length > 0 && !finished) setExitConfirm(true); else { onExit(); nav.go('word-select'); } }}
        right={<CoinPill amount={coins} />}
      />

      {/* status row */}
      <div className="flex items-center gap-2 flex-wrap">
        <TimerChip seconds={puzzle.timeLimit ? Math.max(0, puzzle.timeLimit - elapsed) : elapsed} warning={!!puzzle.timeLimit && puzzle.timeLimit - elapsed <= 30} />
        <span className="chip" style={{ background: 'var(--panel-strong)' }}>
          <Check className="w-4 h-4" style={{ color: 'var(--green)' }} />
          <span className="font-black">{fmt(foundWords.length)}/{fmt(puzzle.placements.length)}</span>
        </span>
        <div className="flex-1" />
        <GameButton size="sm" variant="gold" onClick={useHint} disabled={finished !== null} title={hintTokens > 0 ? t('hintFree', { n: fmt(hintTokens) }) : t('hintCost', { n: HINT_COST })}>
          <Lightbulb className="w-4 h-4" /> {hintTokens > 0 ? `💡 ×${fmt(hintTokens)}` : `${t('hint')} · ${fmt(HINT_COST)}`}
        </GameButton>
      </div>

      {/* word list */}
      <div className="glass-panel p-2.5">
        <p className="text-[10px] font-black opacity-60 mb-1.5">{t('wordsToFind')} — {t('wordsLeft', { n: remaining })}</p>
        <div className="flex flex-wrap gap-1.5">
          {puzzle.placements.map((p, i) => {
            const found = foundSet.has(p.word);
            return (
              <span
                key={p.word}
                className={`rounded-xl px-2.5 py-1 text-xs font-black border-2 transition-all ${found ? 'found-pop' : ''}`}
                style={{
                  background: found ? `linear-gradient(180deg, ${WORD_LINE_COLORS[i % WORD_LINE_COLORS.length]}33, ${WORD_LINE_COLORS[i % WORD_LINE_COLORS.length]}66)` : 'rgba(255,255,255,.55)',
                  borderColor: found ? WORD_LINE_COLORS[i % WORD_LINE_COLORS.length] : 'transparent',
                  color: found ? 'var(--ink)' : 'var(--ink-soft)',
                  textDecoration: found ? 'line-through' : 'none',
                  opacity: found ? 0.85 : 1,
                }}
              >
                {p.word}
              </span>
            );
          })}
        </div>
      </div>

      {/* grid */}
      <div className={`flex justify-center ${shake ? 'ws-shake' : ''}`}>
        <div
          ref={gridRef}
          className="ws-grid w-full"
          style={gridSizeStyle}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={() => { /* keep dragging until pointerup */ }}
        >
          {puzzle.grid.map((row, r) =>
            row.map((ch, c) => {
              const key = `${r},${c}`;
              const selected = pathSet.has(key);
              const hinted = hintCell?.r === r && hintCell?.c === c;
              return (
                <div
                  key={key}
                  ref={(el) => { if (el) cellRefs.current.set(key, el); else cellRefs.current.delete(key); }}
                  className={`ws-cell ${selected ? 'selected' : ''} ${hinted ? 'hinted' : ''}`}
                  style={{ fontSize }}
                >
                  {ch}
                </div>
              );
            }),
          )}
          <svg className="ws-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
            {puzzle.placements.map((p, i) => {
              if (!foundSet.has(p.word)) return null;
              return (
                <polyline
                  key={p.word}
                  points={toPoints(p.cells)}
                  fill="none"
                  stroke={WORD_LINE_COLORS[i % WORD_LINE_COLORS.length]}
                  strokeWidth={100 / puzzle.size / 2.2}
                  className="ws-line ws-line-anim"
                />
              );
            })}
            {path.length >= 1 && (
              <polyline
                points={toPoints(path)}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={100 / puzzle.size / 2.4}
                className="ws-line"
                style={{ opacity: 0.65 }}
              />
            )}
          </svg>
        </div>
      </div>

      <p className="text-center text-[10px] font-bold opacity-50">{t('swipeToFind')}</p>

      {/* modals */}
      <DefeatModal
        open={finished === 'lose'}
        onRetry={() => { retry(); }}
        onBack={() => { onExit(); nav.go('word-select'); }}
      />
      {finished === 'win' && rewards && (
        <VictoryModal
          open
          rewards={rewards}
          canNext={config.level < TOTAL_WH_LEVELS}
          onBack={() => { onExit(); nav.go('word-select'); }}
          onReplay={() => retry()}
          onNext={() => {
            onExit();
            nav.playWh(config.cat, config.diff, config.level + 1);
          }}
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
            <GameButton variant="red" onClick={() => { setExitConfirm(false); onExit(); nav.go('word-select'); }}>{t('confirm')}</GameButton>
          </div>
        </div>
      </GameModal>
    </div>
  );
}
