// ============ Level Map — 10 zones × 10 levels, Boss Challenge every 10th ============
'use client';
import React, { useEffect, useState } from 'react';
import { Lock, Crown } from 'lucide-react';
import { useI18n } from './ui';
import { ZONES, zoneIndexForLevel, zoneUnlocked, zoneName } from '@/lib/game/zones';
import { LEVELS_PER_ZONE, isBossLevel } from '@/lib/game/types';
import { audio } from '@/lib/game/audio';

export function LevelMap({
  totalLevels,
  unlocked,
  starsFor,
  onPlay,
  compact = false,
}: {
  totalLevels: number;
  unlocked: number;
  starsFor: (level: number) => number;
  onPlay: (level: number) => void;
  compact?: boolean;
}) {
  const { t, fmt, lang } = useI18n();
  const zoneCount = Math.min(ZONES.length, Math.ceil(totalLevels / LEVELS_PER_ZONE));
  const activeZone = zoneIndexForLevel(Math.min(unlocked, totalLevels));
  const [zoneIdx, setZoneIdx] = useState(activeZone);

  // follow the player's progress (only jumps when the frontier moves)
  useEffect(() => { setZoneIdx(activeZone); }, [activeZone]);

  const clampedIdx = Math.min(zoneIdx, zoneCount - 1);
  const zone = ZONES[clampedIdx];
  const zoneLocked = !zoneUnlocked(unlocked, clampedIdx);
  const start = clampedIdx * LEVELS_PER_ZONE + 1;
  const end = Math.min(totalLevels, start + LEVELS_PER_ZONE - 1);
  const nodes = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  const zoneStars = nodes.reduce((s, n) => s + starsFor(n), 0);
  const maxStars = nodes.length * 3;

  return (
    <div className="flex flex-col gap-2.5">
      {/* zone selector */}
      <div className="zone-chips -mx-1 px-1">
        {ZONES.slice(0, zoneCount).map((z, i) => {
          const locked = !zoneUnlocked(unlocked, i);
          const active = i === clampedIdx;
          return (
            <button
              key={z.id}
              className="zone-chip"
              disabled={locked}
              onClick={() => { audio.sfx('tick'); setZoneIdx(i); }}
              style={active ? {
                background: `linear-gradient(180deg, ${z.grad[0]}, ${z.grad[1]})`,
                color: '#fff',
                borderColor: 'rgba(255,255,255,.9)',
                boxShadow: '0 3px 0 rgba(31,20,60,.25)',
              } : locked ? { opacity: 0.55 } : undefined}
              aria-label={zoneName(z, lang)}
            >
              <span className="text-sm leading-none">{locked ? <Lock className="w-3 h-3" /> : z.icon}</span>
              <span>{zoneName(z, lang)}</span>
            </button>
          );
        })}
      </div>

      {/* zone banner */}
      <div
        className="rounded-2xl p-2.5 flex items-center gap-3 border-2 border-white/60"
        style={{ background: `linear-gradient(135deg, ${zone.grad[0]}, ${zone.grad[1]})`, opacity: zoneLocked ? 0.75 : 1 }}
      >
        <span className={`text-3xl leading-none ${zoneLocked ? 'grayscale' : ''}`}>{zone.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-black text-sm text-white drop-shadow" style={{ textShadow: '0 1px 2px rgba(0,0,0,.25)' }}>
            {zoneName(zone, lang)}
          </p>
          <p className="text-[10px] font-black text-white/90" style={{ textShadow: '0 1px 2px rgba(0,0,0,.25)' }}>
            {zoneLocked
              ? `🔒 ${t('zoneLocked', { n: fmt(start) })}`
              : t('zoneStars', { n: fmt(zoneStars) })}
          </p>
        </div>
        <span className="chip !py-0.5 !text-[10px] !bg-black/25 !border-white/40 text-white shrink-0">
          ⭐ {fmt(zoneStars)}/{fmt(maxStars)}
        </span>
      </div>

      {/* level nodes */}
      <div className={`grid grid-cols-5 ${compact ? 'gap-x-2 gap-y-5' : 'gap-x-3 gap-y-6'} px-1`}>
        {nodes.map((n) => {
          const boss = isBossLevel(n);
          const isLocked = n > unlocked;
          const starCount = starsFor(n);
          return (
            <div key={n} className="flex justify-center relative">
              <button
                className={`map-node relative ${compact ? 'sm' : ''} ${boss ? 'boss' : ''} ${isLocked ? 'locked' : starCount > 0 ? 'done' : ''} ${!isLocked && n === unlocked ? 'pulse-ring' : ''}`}
                style={n === unlocked && !isLocked ? (boss
                  ? { boxShadow: '0 6px 0 #5b2ecc, 0 0 0 6px rgba(255,224,130,.55)' }
                  : { background: 'linear-gradient(180deg,#fff3a3,#ffd75e)', color: '#8a5a00', boxShadow: '0 6px 0 #e59a00, 0 10px 16px rgba(31,20,60,.25)' }) : undefined}
                disabled={isLocked}
                onClick={() => { if (!isLocked) { audio.sfx('pop'); onPlay(n); } }}
                aria-label={`Level ${n}${isLocked ? ' locked' : `, ${starCount} stars`}`}
              >
                {boss && !isLocked && (
                  <span className="boss-tag"><span>BOSS</span></span>
                )}
                {isLocked
                  ? (boss ? <Crown className="w-5 h-5" /> : <Lock className="w-5 h-5" />)
                  : <span>{fmt(n)}</span>}
                {!isLocked && (
                  <span className="stars">
                    {[1, 2, 3].map((s) => (
                      <svg key={s} viewBox="0 0 24 24" width="13" height="13">
                        <path
                          d="M12 2l2.9 6.26L21.5 9.3l-4.75 4.4 1.15 6.55L12 17l-5.9 3.25L7.25 13.7 2.5 9.3l6.6-1.04L12 2z"
                          fill={s <= starCount ? '#ffd54f' : 'rgba(0,0,0,.22)'}
                          stroke="#fff"
                          strokeWidth="1.4"
                        />
                      </svg>
                    ))}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
