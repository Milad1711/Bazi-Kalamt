// ============ Word Guess — حدس کلمه (حرف اول و آخر معلوم، وسط خالی) ============
'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Lightbulb, Check, Eraser, Sparkles } from 'lucide-react';
import { useI18n, TopBar, CoinPill, GameButton } from './ui';
import { LevelUpModal } from './Overlays';
import { useGame } from '@/lib/game/store';
import { getWordsFor } from '@/lib/game/words';
import { audio } from '@/lib/game/audio';
import { burstAt, coinsFrom } from '@/lib/game/fx-bus';
import { ALL_CATEGORIES, type CategoryId, type Lang } from '@/lib/game/types';
import { CATEGORY_ICONS } from './WordHunter';
import type { LevelUpEvent } from '@/lib/game/store';

const HINT_COST = 25;
const FA_ALPHABET = 'اآبپتثجچحخدذرزژسشصضطظعغفقکگلمنوهی'.split('');
const EN_ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// pool for a category: words of a guessable length (۳ تا ۱۰ حرف)
function buildPool(cat: CategoryId, lang: Lang): string[] {
  const ok = (w: string) => w.length >= 3 && w.length <= 10;
  let pool = getWordsFor(cat, lang).filter(ok);
  if (pool.length < 4) pool = getWordsFor('general', lang).filter(ok);
  return shuffle(pool);
}

type Slot = { ch: string; bankIdx: number } | null;

export function WordGuess({ onBack }: { onBack: () => void }) {
  const { t, fmt, lang } = useI18n();
  const coins = useGame((s) => s.coins);
  const hintTokens = useGame((s) => s.hintTokens);
  const spendCoins = useGame((s) => s.spendCoins);
  const addCoins = useGame((s) => s.addCoins);
  const addXp = useGame((s) => s.addXp);
  const trackMission = useGame((s) => s.trackMission);

  const [cat, setCat] = useState<CategoryId>('general');
  const [pool, setPool] = useState<string[]>(() => buildPool('general', lang));
  const [idx, setIdx] = useState(0);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bank, setBank] = useState<{ ch: string; used: boolean }[]>([]);
  const [solved, setSolved] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [earned, setEarned] = useState(0);
  const [result, setResult] = useState<'none' | 'ok' | 'bad'>('none');
  const [lastReward, setLastReward] = useState(0);
  const [shake, setShake] = useState(false);
  const [levelUps, setLevelUps] = useState<LevelUpEvent[] | null>(null);
  const [levelUpOpen, setLevelUpOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const word = pool[idx] ?? '';
  const letters = Array.from(word);

  // rebuild slots + letter bank whenever the target word changes
  useEffect(() => {
    if (!word) return;
    const mid = letters.slice(1, -1); // وسط کلمه خالی می‌ماند — اول و آخر معلوم است
    const distractors = mid.length >= 4 ? 4 : 3;
    const alphabet = lang === 'fa' ? FA_ALPHABET : EN_ALPHABET;
    const extra: string[] = [];
    for (let i = 0; i < distractors; i++) extra.push(alphabet[Math.floor(Math.random() * alphabet.length)]);
    setBank(shuffle([...mid, ...extra]).map((ch) => ({ ch, used: false })));
    setSlots(mid.map(() => null));
    setResult('none');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word]);

  // switching category (or language) builds a fresh pool
  useEffect(() => {
    setPool(buildPool(cat, lang));
    setIdx(0);
  }, [cat, lang]);

  const full = slots.length > 0 && slots.every((s) => s !== null);

  const placeLetter = (bankIdx: number) => {
    if (result === 'ok') return;
    const slotIdx = slots.findIndex((s) => s === null);
    if (slotIdx === -1) return;
    audio.sfx('letter', slotIdx + 1);
    setBank((b) => b.map((x, i) => (i === bankIdx ? { ...x, used: true } : x)));
    setSlots((s) => s.map((x, i) => (i === slotIdx ? { ch: bank[bankIdx].ch, bankIdx } : x)));
    setResult('none');
  };

  const removeSlot = (slotIdx: number) => {
    if (result === 'ok') return;
    const s = slots[slotIdx];
    if (!s) return;
    audio.sfx('click');
    setBank((b) => b.map((x, i) => (i === s.bankIdx ? { ...x, used: false } : x)));
    setSlots((arr) => arr.map((x, i) => (i === slotIdx ? null : x)));
    setResult('none');
  };

  const clearSlots = () => {
    audio.sfx('click');
    setBank((b) => b.map((x) => ({ ...x, used: false })));
    setSlots((s) => s.map(() => null));
    setResult('none');
  };

  const nextWord = useCallback(() => {
    const n = idx + 1;
    if (n < pool.length) {
      setIdx(n);
    } else {
      // pool exhausted → reshuffle (بدون تکرار کلمه آخر)
      const fresh = shuffle(pool.filter((w) => w !== word));
      setPool(fresh.length ? fresh : pool);
      setIdx(0);
    }
  }, [idx, pool, word]);

  const check = () => {
    if (!word || !full) return;
    const guess = letters[0] + slots.map((s) => s!.ch).join('') + letters[letters.length - 1];
    if (guess === word) {
      const newStreak = streak + 1;
      const mult = newStreak >= 5 ? 2 : newStreak >= 3 ? 1.5 : 1;
      const reward = Math.round((4 + word.length * 2) * mult);
      addCoins(reward, 'guess');
      setEarned((e) => e + reward);
      setLastReward(reward);
      setSolved((s) => s + 1);
      setStreak(newStreak);
      setBestStreak((b) => Math.max(b, newStreak));
      const events = addXp(6 + word.length * 2);
      if (events.length) {
        setLevelUps(events);
        setLevelUpOpen(true);
      }
      trackMission('word_found', 1);
      audio.sfx('word');
      audio.sfx('coin');
      audio.vibrate([20, 30, 20]);
      burstAt(cardRef.current, 'sparkle');
      coinsFrom(cardRef.current, 5);
      setResult('ok');
      setTimeout(nextWord, 1500);
    } else {
      audio.sfx('wrong');
      audio.vibrate([30, 40, 30]);
      setResult('bad');
      setStreak(0);
      setShake(true);
      setTimeout(() => setShake(false), 420);
    }
  };

  // hint: reveal the first empty slot — free token first, then coins
  const useHint = () => {
    if (!word || result === 'ok') return;
    const slotIdx = slots.findIndex((s) => s === null);
    if (slotIdx === -1) return;
    const store = useGame.getState();
    if (store.hintTokens > 0) store.useHintToken();
    else {
      if (coins < HINT_COST) {
        audio.sfx('wrong');
        return;
      }
      if (!spendCoins(HINT_COST)) return;
    }
    audio.sfx('hint');
    const correct = letters[slotIdx + 1];
    const bankIdx = bank.findIndex((b, i) => !b.used && b.ch === correct);
    if (bankIdx === -1) return;
    setBank((b) => b.map((x, i) => (i === bankIdx ? { ...x, used: true } : x)));
    setSlots((s) => s.map((x, i) => (i === slotIdx ? { ch: correct, bankIdx } : x)));
    setResult('none');
  };

  if (!word) {
    return (
      <div className="flex flex-col gap-3 pb-8">
        <TopBar title={t('worldGuessTitle')} onBack={onBack} />
        <div className="glass-panel p-6 text-center font-black opacity-60">…</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 pb-8">
      <TopBar
        title={t('worldGuessTitle')}
        subtitle={t('guessHowTo')}
        onBack={onBack}
        right={<CoinPill amount={coins} />}
      />

      {/* category chips (انتخاب دسته) */}
      <div className="flex flex-wrap gap-1.5">
        {ALL_CATEGORIES.map((c) => {
          const Icon = CATEGORY_ICONS[c];
          const active = cat === c;
          return (
            <button
              key={c}
              onClick={() => { audio.sfx('tick'); setCat(c); }}
              className="rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 border-2 text-[11px] font-black transition-all active:translate-y-0.5"
              style={{
                background: active ? 'linear-gradient(180deg, color-mix(in srgb, var(--accent) 85%, #fff 15%), var(--accent))' : 'var(--panel)',
                borderColor: active ? 'var(--accent-deep)' : 'var(--panel-border)',
                color: active ? '#fff' : 'var(--ink)',
                boxShadow: active ? '0 3px 0 var(--accent-deep)' : '0 3px 0 rgba(31,20,60,.08)',
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {t(`cat_${c}` as 'cat_animals')}
            </button>
          );
        })}
      </div>

      {/* session stats (آمار این جلسه) */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="chip" style={{ background: 'var(--panel-strong)' }}>
          <Check className="w-4 h-4" style={{ color: 'var(--green)' }} />
          <span className="font-black">{t('guessSolved')}: {fmt(solved)}</span>
        </span>
        <span className="chip" style={{ background: 'var(--panel-strong)' }}>
          <Sparkles className="w-4 h-4" style={{ color: '#f4a825' }} />
          <span className="font-black">{t('guessStreak')}: {fmt(streak)}{bestStreak > 0 ? ` · ${fmt(bestStreak)}★` : ''}</span>
        </span>
        <span className="chip" style={{ background: 'var(--panel-strong)' }}>
          <span className="font-black" style={{ color: '#c98a12' }}>+{fmt(earned)} 🪙</span>
        </span>
        <div className="flex-1" />
        <GameButton size="sm" variant="gold" onClick={useHint} disabled={result === 'ok'} title={hintTokens > 0 ? t('hintFree', { n: fmt(hintTokens) }) : t('hintCost', { n: HINT_COST })}>
          <Lightbulb className="w-4 h-4" /> {hintTokens > 0 ? `💡 ×${fmt(hintTokens)}` : `${t('hint')} · ${fmt(HINT_COST)}`}
        </GameButton>
      </div>

      {/* puzzle card (کارت حدس) */}
      <div ref={cardRef} className={`glass-panel p-4 ${shake ? 'ws-shake' : ''}`}>
        {/* word slots — حرف اول و آخر معلوم، وسط‌ها جای خالی */}
        <div className="flex flex-wrap justify-center gap-1.5 mb-3" dir="auto">
          {letters.map((ch, i) => {
            if (i === 0 || i === letters.length - 1) {
              return (
                <span
                  key={i}
                  className="w-9 h-12 rounded-xl border-2 grid place-items-center text-lg font-black"
                  style={{
                    background: 'rgba(255,255,255,.6)',
                    borderColor: 'var(--accent-deep)',
                    color: 'var(--ink)',
                    boxShadow: '0 3px 0 rgba(31,20,60,.12)',
                  }}
                >
                  {ch}
                </span>
              );
            }
            const s = slots[i - 1];
            return (
              <button
                key={i}
                onClick={() => removeSlot(i - 1)}
                aria-label={s ? s.ch : 'blank'}
                className="w-9 h-12 rounded-xl border-2 grid place-items-center text-lg font-black transition-all active:translate-y-0.5"
                style={{
                  background: s ? 'linear-gradient(180deg, color-mix(in srgb, var(--accent) 75%, #fff 25%), var(--accent))' : 'rgba(255,255,255,.35)',
                  borderColor: s ? 'var(--accent-deep)' : 'var(--panel-border)',
                  borderStyle: s ? 'solid' : 'dashed',
                  color: s ? '#fff' : 'var(--ink-soft)',
                  boxShadow: s ? '0 3px 0 var(--accent-deep)' : 'none',
                }}
              >
                {s ? s.ch : '•'}
              </button>
            );
          })}
        </div>

        {/* feedback (پیام نتیجه) */}
        <p
          className="text-center text-xs font-black mb-3 min-h-[18px]"
          style={{ color: result === 'ok' ? 'var(--green)' : result === 'bad' ? 'var(--danger)' : 'var(--ink-soft)' }}
        >
          {result === 'ok' ? `${t('guessCorrect')} +${fmt(lastReward)} 🪙` : result === 'bad' ? t('guessWrong') : t('guessPickLetter')}
        </p>

        {/* letter bank (بانک حروف) */}
        <div className="flex flex-wrap justify-center gap-1.5 mb-3">
          {bank.map((b, i) => (
            <button
              key={i}
              onClick={() => placeLetter(i)}
              disabled={b.used || result === 'ok'}
              aria-label={b.ch}
              className="w-9 h-9 rounded-lg border-2 grid place-items-center text-base font-black transition-all active:translate-y-0.5 disabled:opacity-25 disabled:scale-90"
              style={{
                background: 'rgba(255,255,255,.7)',
                borderColor: 'var(--panel-border)',
                color: 'var(--ink)',
                boxShadow: '0 2px 0 rgba(31,20,60,.1)',
              }}
            >
              {b.ch}
            </button>
          ))}
        </div>

        {/* actions (دکمه‌ها) */}
        <div className="flex gap-2 justify-center">
          <GameButton size="sm" variant="blue" onClick={clearSlots} disabled={result === 'ok' || slots.every((s) => s === null)}>
            <Eraser className="w-4 h-4" /> {t('guessClear')}
          </GameButton>
          <GameButton size="sm" variant="green" onClick={check} disabled={!full || result === 'ok'}>
            <Check className="w-4 h-4" /> {t('guessCheck')}
          </GameButton>
        </div>
      </div>

      <p className="text-center text-[10px] font-bold opacity-50 leading-relaxed px-2">{t('guessHowToDetail')}</p>

      <LevelUpModal events={levelUpOpen ? levelUps : null} onClose={() => setLevelUpOpen(false)} />
    </div>
  );
}
