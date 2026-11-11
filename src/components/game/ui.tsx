// ============ Shared game UI atoms ============
'use client';
import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, X } from 'lucide-react';
import { useGame } from '@/lib/game/store';
import { translate, formatNumber, type DictKey } from '@/lib/game/i18n';
import type { Lang } from '@/lib/game/types';
import { audio } from '@/lib/game/audio';
import { CoinIcon } from '@/lib/game/art';

export function useI18n() {
  const lang = useGame((s) => s.lang) as Lang;
  return {
    lang,
    dir: (lang === 'fa' ? 'rtl' : 'ltr') as 'rtl' | 'ltr',
    t: (key: DictKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
    fmt: (n: number) => formatNumber(n, lang),
  };
}

// ---------- Buttons ----------
type BtnVariant = 'orange' | 'green' | 'gold' | 'blue' | 'red';
export function GameButton({
  variant = 'orange',
  size = 'md',
  className = '',
  onClick,
  children,
  disabled,
  title,
  type = 'button',
}: {
  variant?: BtnVariant;
  size?: 'sm' | 'md' | 'xl';
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
  disabled?: boolean;
  title?: string;
  type?: 'button' | 'submit';
}) {
  const variantClass = variant === 'orange' ? '' : `btn3d-${variant}`;
  const sizeClass = size === 'sm' ? 'btn3d-sm' : size === 'xl' ? 'btn3d-xl' : '';
  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      className={`btn3d ${variantClass} ${sizeClass} ${className}`}
      onClick={(e) => {
        if (disabled) return;
        audio.sfx('click');
        audio.vibrate(12);
        onClick?.(e);
      }}
    >
      {children}
    </button>
  );
}

// ---------- Icons / pills ----------
export function CoinPill({ amount, className = '' }: { amount: number; className?: string }) {
  const { fmt } = useI18n();
  return (
    <span
      data-coin-target
      className={`chip ${className}`}
      style={{ background: 'linear-gradient(180deg,#fff6d8,#ffe9a8)', borderColor: '#ffd75e' }}
    >
      <CoinIcon className="w-5 h-5" />
      {/* key on amount remounts the span → replays the bump animation */}
      <span key={amount} className="coin-bump font-black text-[#7a5200]">{fmt(amount)}</span>
    </span>
  );
}

export function XPBar({ pct, level }: { pct: number; level: number }) {
  const { fmt } = useI18n();
  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <div className="relative flex-1 h-4 rounded-full overflow-hidden border-2 border-white/70 bg-black/15 shadow-inner">
        <div
          className="absolute inset-y-0 ltr:left-0 rtl:right-0 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#7be3a3,#38c172)' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-black text-white drop-shadow-[0_1px_1px_rgba(0,0,0,.5)]">{fmt(pct)}%</span>
        </div>
      </div>
    </div>
  );
}

export function LevelBadge({ level }: { level: number }) {
  const { fmt } = useI18n();
  return (
    <span className="chip" style={{ background: 'linear-gradient(180deg,#e7ddff,#cdbdf5)', borderColor: '#b9a3ec' }}>
      <span className="font-black text-[#5b3fa8]">Lv {fmt(level)}</span>
    </span>
  );
}

export function StarRow({ stars, size = 22, animate = false }: { stars: number; size?: number; animate?: boolean }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${stars}/3 stars`}>
      {[1, 2, 3].map((i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          width={size}
          height={size}
          className={`star3d ${animate && i <= stars ? 'star3d pop' : ''}`}
          style={animate ? { animationDelay: `${i * 0.18}s` } : undefined}
        >
          <path
            d="M12 2l2.9 6.26L21.5 9.3l-4.75 4.4 1.15 6.55L12 17l-5.9 3.25L7.25 13.7 2.5 9.3l6.6-1.04L12 2z"
            fill={i <= stars ? '#ffd54f' : 'rgba(0,0,0,.18)'}
            stroke={i <= stars ? '#f9a825' : 'rgba(0,0,0,.12)'}
            strokeWidth="1.5"
          />
        </svg>
      ))}
    </div>
  );
}

// ---------- Top bar ----------
export function TopBar({
  title,
  onBack,
  right,
  subtitle,
}: {
  title: React.ReactNode;
  onBack?: () => void;
  right?: React.ReactNode;
  subtitle?: React.ReactNode;
}) {
  const { dir } = useI18n();
  const BackIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;
  return (
    <header className="flex items-center gap-2 pt-3 pb-2 sticky top-0 z-30" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,.25), transparent)' }}>
      {onBack && (
        <button
          onClick={() => { audio.sfx('click'); onBack(); }}
          className="btn3d btn3d-sm !px-3 !py-2 shrink-0"
          aria-label="back"
        >
          <BackIcon className="w-5 h-5" />
        </button>
      )}
      <div className="flex-1 min-w-0 text-center">
        <h1 className="text-xl font-black leading-tight truncate" style={{ color: 'var(--ink)' }}>{title}</h1>
        {subtitle && <p className="text-xs font-bold opacity-70 truncate">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">{right ?? <span className="w-[52px]" />}</div>
    </header>
  );
}

// ---------- Modal ----------
export function GameModal({
  open,
  onClose,
  children,
  closeOnOverlay = false,
  wide = false,
}: {
  open: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  closeOnOverlay?: boolean;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);
  if (!open) return null;
  return (
    <div
      className="modal-overlay p-4"
      onClick={() => { if (closeOnOverlay) { audio.sfx('click'); onClose?.(); } }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`glass-panel modal-panel w-full ${wide ? 'max-w-lg' : 'max-w-sm'} p-5 pt-6`}
        style={{ background: 'var(--panel-strong)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {onClose && (
          <button
            onClick={() => { audio.sfx('click'); onClose(); }}
            className="absolute top-3 ltr:right-3 rtl:left-3 w-8 h-8 rounded-full grid place-items-center bg-black/10 hover:bg-black/20 transition-colors"
            aria-label="close"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

// ---------- Timer chip ----------
export function TimerChip({ seconds, warning = false }: { seconds: number; warning?: boolean }) {
  const { fmt } = useI18n();
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return (
    <span
      className="chip"
      style={{
        background: warning ? 'linear-gradient(180deg,#ffdcc9,#ffc4a3)' : 'var(--panel-strong)',
        color: warning ? '#a03000' : 'var(--ink)',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      <Clock className="w-4 h-4" />
      <span className="font-black">{fmt(m)}:{fmt(s).padStart(2, '0')}</span>
    </span>
  );
}

// ---------- Section title ----------
export function SectionTitle({ icon, children, action }: { icon?: React.ReactNode; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-1">
      {icon}
      <h2 className="text-base font-black" style={{ color: 'var(--ink)' }}>{children}</h2>
      <div className="flex-1" />
      {action}
    </div>
  );
}
