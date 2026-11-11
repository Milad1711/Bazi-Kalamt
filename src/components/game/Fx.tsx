// ============ FX: particle canvas + flying coins ============
'use client';
import { useEffect, useRef } from 'react';
import { onFx } from '@/lib/game/fx-bus';
import { useGame } from '@/lib/game/store';
import { CoinIcon } from '@/lib/game/art';

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; size: number; color: string; shape: 'circle' | 'rect' | 'star';
  rot: number; vr: number;
}

const CONFETTI_COLORS = ['#ff8a3d', '#ffd54f', '#38c172', '#4facfe', '#f06292', '#ba68c8', '#ff7043'];
const COIN_COLORS = ['#ffd54f', '#ffb300', '#fff176'];

/** ambient particle palettes per shop fx item */
const AMBIENT: Record<string, { colors: string[]; shape: Particle['shape']; rise: number; drift: number; every: number; glyph?: string }> = {
  fxSparkle: { colors: ['#ffffff', '#ffe082', '#ffd54f'], shape: 'star', rise: -0.35, drift: 0.25, every: 420 },
  fxBubbles: { colors: ['#81d4fa', '#4fc3f7', '#b3e5fc'], shape: 'circle', rise: -0.9, drift: 0.5, every: 380 },
  fxHearts: { colors: ['#f48fb1', '#f06292', '#ff8a80'], shape: 'star', rise: -0.55, drift: 0.35, every: 700 },
  fxStars: { colors: ['#ffd54f', '#fff176', '#ffb300'], shape: 'star', rise: 0.7, drift: -0.4, every: 260 },
};

function drawGlyph(ctx: CanvasRenderingContext2D, p: Particle, glyph: string) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  ctx.fillStyle = p.color;
  ctx.font = `${p.size * 3}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(glyph, 0, 0);
  ctx.restore();
}

export function ParticlesCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const raf = useRef<number>(0);
  const ambientAcc = useRef<number>(0);
  const lastT = useRef<number>(0);
  const fxMode = useGame((s) => s.equipped.fx);
  const quality = useGame((s) => s.quality);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = quality === 'low' ? 1 : quality === 'medium' ? Math.min(devicePixelRatio, 1.5) : devicePixelRatio;
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const burstCount = quality === 'low' ? 0.3 : quality === 'medium' ? 0.6 : 1;
    const off = onFx((e) => {
      if (e.type !== 'burst') return;
      const n = Math.round((e.kind === 'confetti' ? 70 : e.kind === 'coins' ? 26 : 18) * burstCount);
      for (let i = 0; i < n; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * (e.kind === 'confetti' ? 7 : 5);
        const palette = e.kind === 'confetti' ? CONFETTI_COLORS : e.kind === 'coins' ? COIN_COLORS : ['#fff', '#ffd54f', '#fffbf0'];
        particles.current.push({
          x: e.x, y: e.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 3,
          life: 0, maxLife: 50 + Math.random() * 40,
          size: e.kind === 'confetti' ? 5 + Math.random() * 6 : 3 + Math.random() * 5,
          color: palette[Math.floor(Math.random() * palette.length)],
          shape: e.kind === 'confetti' ? 'rect' : 'circle',
          rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
        });
      }
    });

    const tick = (t: number) => {
      const dt = lastT.current ? Math.min(t - lastT.current, 100) : 16;
      lastT.current = t;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // ---- ambient mode (from shop fx item) — skipped on low quality ----
      const amb = quality === 'low' ? undefined : AMBIENT[fxMode];
      if (amb) {
        ambientAcc.current += dt;
        if (ambientAcc.current >= amb.every) {
          ambientAcc.current = 0;
          const fromTop = amb.rise > 0; // star shower falls from the sky
          particles.current.push({
            x: Math.random() * window.innerWidth,
            y: fromTop ? -12 : window.innerHeight + 12,
            vx: (Math.random() - 0.5) * amb.drift * 2,
            vy: amb.rise * (0.7 + Math.random() * 0.7),
            life: 0, maxLife: 260 + Math.random() * 120,
            size: 2.5 + Math.random() * 3,
            color: amb.colors[Math.floor(Math.random() * amb.colors.length)],
            shape: amb.shape,
            rot: 0, vr: (Math.random() - 0.5) * 0.04,
          });
        }
      }

      const alive: Particle[] = [];
      for (const p of particles.current) {
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        // burst particles feel gravity; ambient ones just drift
        if (p.maxLife < 120) p.vy += 0.14;
        p.vx *= 0.99;
        p.rot += p.vr;
        if (p.life < p.maxLife) {
          alive.push(p);
          const alpha = Math.min(1, 2.5 - p.life / (p.maxLife / 2.5)) * 0.9;
          ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
          ctx.fillStyle = p.color;
          if (p.shape === 'rect') {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
            ctx.restore();
          } else if (p.shape === 'star' && p.maxLife >= 120) {
            drawGlyph(ctx, p, fxMode === 'fxHearts' ? '♥' : fxMode === 'fxStars' ? '★' : '✦');
          } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        }
      }
      particles.current = alive;
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener('resize', resize);
      off();
    };
  }, [fxMode, quality]);

  return <canvas ref={canvasRef} className="fixed inset-0 z-[90] pointer-events-none" aria-hidden="true" />;
}

export function FlyingCoins() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const off = onFx((e) => {
      if (e.type !== 'coinflight' || !hostRef.current) return;
      const target = document.querySelector('[data-coin-target]');
      const tr = target?.getBoundingClientRect();
      if (!tr) return;
      for (let i = 0; i < Math.min(e.count, 10); i++) {
        const el = document.createElement('div');
        el.className = 'coin-fly';
        el.style.left = `${e.x - 17 + (Math.random() - 0.5) * 60}px`;
        el.style.top = `${e.y - 17 + (Math.random() - 0.5) * 40}px`;
        el.style.setProperty('--dx', `${tr.left + tr.width / 2 - e.x}px`);
        el.style.setProperty('--dy', `${tr.top + tr.height / 2 - e.y}px`);
        el.style.animationDelay = `${i * 60}ms`;
        el.innerHTML = '<svg viewBox="0 0 100 100" width="34" height="34"><circle cx="50" cy="50" r="44" fill="#f9a825"/><circle cx="50" cy="50" r="32" fill="#ffd54f"/><path d="M50 30 L57 44 L72 46 L61 57 L64 72 L50 64 L36 72 L39 57 L28 46 L43 44 Z" fill="#f9a825"/></svg>';
        hostRef.current.appendChild(el);
        setTimeout(() => el.remove(), 1400);
      }
    });
    return () => { off(); };
  }, []);

  return <div ref={hostRef} aria-hidden="true" />;
}
