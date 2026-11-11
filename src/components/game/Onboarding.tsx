// ============ Onboarding (first launch) ============
'use client';
import React, { useState } from 'react';
import { useI18n, GameButton } from './ui';
import { useGame } from '@/lib/game/store';
import { LogoMark, Mascot, GameIcon } from '@/lib/game/art';
import { audio } from '@/lib/game/audio';
import type { AvatarId } from '@/lib/game/types';

const STARTER_AVATARS: AvatarId[] = ['owl', 'fox', 'panda', 'cat'];

export function Onboarding() {
  const { t, lang } = useI18n();
  const setLang = useGame((s) => s.setLang);
  const completeOnboarding = useGame((s) => s.completeOnboarding);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<AvatarId>('owl');

  return (
    <div className="game-root" data-theme="meadow" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
      <div className="ambience">
        <div className="blob blob-1" /><div className="blob blob-2" /><div className="blob blob-3" />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-[560px] min-h-screen flex flex-col items-center justify-center gap-5 px-5 py-8">
        {/* language switch */}
        <div className="flex rounded-full overflow-hidden border-2 border-white/70 text-xs font-black shadow-md self-end">
          <button
            className="px-4 py-1.5"
            style={{ background: lang === 'fa' ? 'var(--accent)' : 'rgba(255,255,255,.45)', color: lang === 'fa' ? '#fff' : 'var(--ink)' }}
            onClick={() => { audio.sfx('tick'); setLang('fa'); }}
          >فارسی</button>
          <button
            className="px-4 py-1.5"
            style={{ background: lang === 'en' ? 'var(--accent)' : 'rgba(255,255,255,.45)', color: lang === 'en' ? '#fff' : 'var(--ink)' }}
            onClick={() => { audio.sfx('tick'); setLang('en'); }}
          >English</button>
        </div>

        <div className="w-24 h-24 bounce-in"><LogoMark className="w-full h-full" /></div>
        <h1 className="text-3xl font-black text-center" style={{ color: 'var(--ink)', textShadow: '0 2px 0 rgba(255,255,255,.5)' }}>
          {t('welcomeTitle')}
        </h1>
        <p className="text-sm font-bold opacity-75 text-center -mt-3">{t('welcomeDesc')}</p>

        <div className="mascot-wrap w-28"><Mascot /></div>

        <div className="glass-panel p-4 w-full max-w-xs flex flex-col gap-3">
          <label className="text-xs font-black opacity-70" htmlFor="player-name">{t('yourName')}</label>
          <input
            id="player-name"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 18))}
            placeholder={lang === 'fa' ? 'قهرمان ما…' : 'Our hero…'}
            className="w-full rounded-xl px-4 py-2.5 font-black text-center outline-none border-2 focus:border-[var(--accent)] transition-colors"
            style={{ background: 'rgba(255,255,255,.75)', color: 'var(--ink)', borderColor: 'var(--panel-border)' }}
          />

          <p className="text-xs font-black opacity-70 pt-1">{t('chooseAvatar')}</p>
          <div className="grid grid-cols-4 gap-2">
            {STARTER_AVATARS.map((a) => (
              <button
                key={a}
                onClick={() => { audio.sfx('pop'); setAvatar(a); }}
                className="rounded-2xl p-1.5 border-2 transition-all active:translate-y-0.5"
                style={{
                  borderColor: avatar === a ? 'var(--accent)' : 'rgba(255,255,255,.7)',
                  background: avatar === a ? 'rgba(255,138,61,.18)' : 'rgba(255,255,255,.5)',
                  transform: avatar === a ? 'scale(1.06)' : undefined,
                  boxShadow: avatar === a ? '0 4px 0 var(--accent-deep)' : '0 3px 0 rgba(31,20,60,.08)',
                }}
                aria-label={t(`avatar_${a}` as 'avatar_owl')}
              >
                <GameIcon name={a} className="w-full h-full" />
              </button>
            ))}
          </div>
        </div>

        <GameButton
          variant="green"
          size="xl"
          onClick={() => {
            audio.init();
            audio.sfx('victory');
            completeOnboarding(name, avatar);
          }}
        >
          {t('letsPlay')} 🚀
        </GameButton>
        <p className="text-[10px] font-bold opacity-50">{t('autoplayNote')}</p>
      </div>
    </div>
  );
}
