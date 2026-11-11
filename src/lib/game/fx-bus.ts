// ============ FX Bus — tiny event emitter for visual effects ============
'use client';

type FxEvent =
  | { type: 'burst'; x: number; y: number; kind: 'coins' | 'confetti' | 'sparkle' }
  | { type: 'coinflight'; x: number; y: number; count: number };

type Listener = (e: FxEvent) => void;
const listeners = new Set<Listener>();

export function onFx(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emitFx(e: FxEvent) {
  listeners.forEach((l) => l(e));
}

export function burstAt(el: HTMLElement | null, kind: 'coins' | 'confetti' | 'sparkle' = 'coins') {
  if (!el) return;
  const r = el.getBoundingClientRect();
  emitFx({ type: 'burst', x: r.left + r.width / 2, y: r.top + r.height / 2, kind });
}

export function coinsFrom(el: HTMLElement | null, count = 6) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  emitFx({ type: 'coinflight', x: r.left + r.width / 2, y: r.top + r.height / 2, count });
}
