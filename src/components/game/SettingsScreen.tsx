// ============ Settings ============
'use client';
import React, { useState } from 'react';
import { Music, Volume2, Vibrate, Languages, Trash2, Info, Gauge, Save, Type, Fingerprint, Copy, Check } from 'lucide-react';
import { useI18n, TopBar, GameButton, GameModal } from './ui';
import { useGame } from '@/lib/game/store';
import { installId } from '@/lib/game/server-economy';
import { audio } from '@/lib/game/audio';
import { LogoMark, Mascot } from '@/lib/game/art';

export function SettingsScreen({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  const lang = useGame((s) => s.lang);
  const setLang = useGame((s) => s.setLang);
  const music = useGame((s) => s.music);
  const setMusic = useGame((s) => s.setMusic);
  const sfx = useGame((s) => s.sfx);
  const setSfx = useGame((s) => s.setSfx);
  const haptics = useGame((s) => s.haptics);
  const setHaptics = useGame((s) => s.setHaptics);
  const quality = useGame((s) => s.quality);
  const setQuality = useGame((s) => s.setQuality);
  const gridScale = useGame((s) => s.gridScale);
  const setGridScale = useGame((s) => s.setGridScale);
  const letterScale = useGame((s) => s.letterScale);
  const setLetterScale = useGame((s) => s.setLetterScale);
  const resetProgress = useGame((s) => s.resetProgress);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [idCopied, setIdCopied] = useState(false);

  return (
    <div className="flex flex-col gap-3 pb-8">
      <TopBar title={t('settingsTitle')} onBack={onBack} />

      {/* language */}
      <section className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-3">
          <Languages className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          <h3 className="font-black text-sm">{t('language')}</h3>
        </div>
        <div className="flex rounded-2xl overflow-hidden border-2 border-white/70 font-black shadow-inner">
          <button
            className="flex-1 py-2.5 transition-colors flex items-center justify-center gap-2"
            style={{ background: lang === 'fa' ? 'var(--accent)' : 'rgba(255,255,255,.45)', color: lang === 'fa' ? '#fff' : 'var(--ink)' }}
            onClick={() => { audio.sfx('tick'); setLang('fa'); }}
          >
            🇮🇷 فارسی
          </button>
          <button
            className="flex-1 py-2.5 transition-colors flex items-center justify-center gap-2"
            style={{ background: lang === 'en' ? 'var(--accent)' : 'rgba(255,255,255,.45)', color: lang === 'en' ? '#fff' : 'var(--ink)' }}
            onClick={() => { audio.sfx('tick'); setLang('en'); }}
          >
            🇬🇧 English
          </button>
        </div>
      </section>

      {/* toggles */}
      <section className="glass-panel p-2">
        <ToggleRow icon={<Music className="w-5 h-5" />} label={t('music')} value={music} onChange={(v) => { setMusic(v); if (v) audio.playMusic('lobby'); else audio.stopMusic(); }} />
        <ToggleRow icon={<Volume2 className="w-5 h-5" />} label={t('sfx')} value={sfx} onChange={(v) => { setSfx(v); if (v) audio.sfx('pop'); }} />
        <ToggleRow icon={<Vibrate className="w-5 h-5" />} label={t('haptics')} value={haptics} onChange={(v) => { setHaptics(v); if (v) audio.vibrate(30); }} />
      </section>

      {/* graphics quality (بخش ۱۶) */}
      <section className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-1">
          <Gauge className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          <h3 className="font-black text-sm">{t('qualityTitle')}</h3>
        </div>
        <p className="text-[10px] font-bold opacity-55 mb-3">{t('qualityHint')}</p>
        <div className="flex rounded-2xl overflow-hidden border-2 border-white/70 font-black shadow-inner">
          {(['low', 'medium', 'high'] as const).map((q) => (
            <button
              key={q}
              className="flex-1 py-2.5 transition-colors text-xs"
              style={{
                background: quality === q ? 'var(--accent)' : 'rgba(255,255,255,.45)',
                color: quality === q ? '#fff' : 'var(--ink)',
              }}
              onClick={() => { audio.sfx('tick'); setQuality(q); }}
            >
              {t(`quality_${q}` as never)}
            </button>
          ))}
        </div>
        {/* auto-save note (بخش ۱۶) */}
        <div className="flex items-center gap-2 mt-3 rounded-xl bg-black/5 p-2.5">
          <Save className="w-4 h-4 shrink-0" style={{ color: '#1f9d55' }} />
          <p className="text-[10px] font-bold opacity-70 leading-relaxed">{t('autosaveOn')}</p>
        </div>
      </section>

      {/* grid & letter size (اندازه جدول و فونت — قابل تنظیم توسط بازیکن) */}
      <section className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-1">
          <Type className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          <h3 className="font-black text-sm">{t('displayTitle')}</h3>
        </div>
        <p className="text-[10px] font-bold opacity-55 mb-3">{t('displayHint')}</p>
        <SizeRow label={t('gridSize')} value={gridScale} onChange={setGridScale} />
        <div className="h-2.5" />
        <SizeRow label={t('letterSize')} value={letterScale} onChange={setLetterScale} />
      </section>

      {/* device id (شناسه دستگاه — برای پشتیبانی و هدیه سکه ادمین) */}
      <section className="glass-panel p-3 flex items-center gap-3">
        <Fingerprint className="w-5 h-5 shrink-0" style={{ color: 'var(--accent)' }} />
        <div className="flex-1 min-w-0">
          <p className="font-black text-[12px]">{t('deviceId')}</p>
          <p className="text-[10px] font-mono font-bold opacity-60 truncate" dir="ltr">{installId()}</p>
          <p className="text-[9px] font-bold opacity-50 mt-0.5 leading-relaxed">{t('deviceIdHint')}</p>
        </div>
        <GameButton
          size="sm"
          variant="blue"
          className="shrink-0 !px-2.5"
          onClick={() => {
            navigator.clipboard?.writeText(installId());
            setIdCopied(true);
            setTimeout(() => setIdCopied(false), 2000);
          }}
        >
          {idCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </GameButton>
      </section>

      {/* about */}
      <section className="glass-panel p-4 flex items-center gap-3">
        <div className="w-14 h-14 shrink-0"><LogoMark className="w-full h-full" /></div>
        <div>
          <div className="flex items-center gap-1.5 font-black text-sm"><Info className="w-4 h-4" />{t('about')}</div>
          <p className="text-xs font-bold opacity-70 mt-1 leading-relaxed">{t('aboutText')}</p>
        </div>
      </section>

      {/* reset */}
      <GameButton variant="red" className="w-full" onClick={() => setConfirmReset(true)}>
        <Trash2 className="w-5 h-5" /> {t('resetProgress')}
      </GameButton>

      <div className="flex justify-center py-2">
        <div className="mascot-wrap w-20 opacity-80"><Mascot /></div>
      </div>

      <GameModal open={confirmReset} onClose={() => setConfirmReset(false)}>
        <div className="text-center">
          <h3 className="text-lg font-black mb-1">{t('resetProgress')}</h3>
          <p className="text-xs font-bold opacity-60 mb-4">{t('resetWarn')}</p>
          <div className="flex gap-2 justify-center">
            <GameButton variant="blue" onClick={() => setConfirmReset(false)}>{t('cancel')}</GameButton>
            <GameButton variant="red" onClick={() => { resetProgress(); setConfirmReset(false); setResetDone(true); }}>
              {t('confirm')}
            </GameButton>
          </div>
        </div>
      </GameModal>

      <GameModal open={resetDone} onClose={() => setResetDone(false)}>
        <div className="text-center">
          <p className="font-black mb-3">✓ {t('resetDone')}</p>
          <GameButton variant="green" onClick={() => { setResetDone(false); onBack(); }}>{t('close')}</GameButton>
        </div>
      </GameModal>
    </div>
  );
}

function ToggleRow({ icon, label, value, onChange }: { icon: React.ReactNode; label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 p-2.5 cursor-pointer">
      <span style={{ color: 'var(--accent)' }}>{icon}</span>
      <span className="font-black text-sm flex-1">{label}</span>
      <button
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={() => { audio.sfx('click'); onChange(!value); }}
        className="relative w-14 h-8 rounded-full transition-colors border-2"
        style={{
          background: value ? 'linear-gradient(180deg,#7be3a3,#38c172)' : 'rgba(0,0,0,.18)',
          borderColor: value ? '#1f9d55' : 'rgba(0,0,0,.15)',
          boxShadow: value ? 'inset 0 2px 3px rgba(0,0,0,.15)' : 'inset 0 2px 3px rgba(0,0,0,.25)',
        }}
      >
        <span
          className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white shadow-md transition-all"
          style={{ insetInlineStart: value ? 'calc(100% - 27px)' : '3px' }}
        />
      </button>
    </label>
  );
}

// ---------- grid & letter size (اندازه جدول و فونت) ----------
const SIZE_STEPS: { v: number; key: 'sizeSmall' | 'sizeNormal' | 'sizeLarge' }[] = [
  { v: 0.85, key: 'sizeSmall' },
  { v: 1, key: 'sizeNormal' },
  { v: 1.15, key: 'sizeLarge' },
];

function SizeRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const { t } = useI18n();
  return (
    <div>
      <p className="text-[11px] font-black opacity-70 mb-1.5">{label}</p>
      <div className="flex rounded-2xl overflow-hidden border-2 border-white/70 font-black shadow-inner">
        {SIZE_STEPS.map((s) => (
          <button
            key={s.v}
            className="flex-1 py-2 transition-colors text-xs"
            style={{
              background: value === s.v ? 'var(--accent)' : 'rgba(255,255,255,.45)',
              color: value === s.v ? '#fff' : 'var(--ink)',
            }}
            onClick={() => { audio.sfx('tick'); onChange(s.v); }}
          >
            {t(s.key)}
          </button>
        ))}
      </div>
    </div>
  );
}
