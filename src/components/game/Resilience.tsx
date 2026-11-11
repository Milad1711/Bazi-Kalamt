// ============ Resilience (بخش ۱۶ — مدیریت خطا، قطعی اینترنت، ادامه بازی) ============
// ErrorBoundary: an unexpected crash never loses the save — progress lives in
// localStorage (auto-save) and the player can reload instantly.
// OfflineBanner: shows connection state; the game is fully playable offline and
// server-verified rewards self-heal via the ledger on reconnect.
'use client';
import React from 'react';
import { WifiOff, Wifi, RefreshCw, AlertTriangle } from 'lucide-react';
import { useGame } from '@/lib/game/store';

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    // in production this would go to the analytics service (ARCHITECTURE.md §13)
    console.error('[WordGame3D] runtime error:', error);
  }

  render() {
    if (this.state.error) {
      const lang = useGame.getState().lang;
      const fa = lang === 'fa';
      return (
        <div className="game-root" data-theme="meadow" dir={fa ? 'rtl' : 'ltr'}>
          <div className="min-h-screen grid place-items-center p-6">
            <div className="glass-panel p-6 max-w-sm text-center">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3" style={{ color: '#f4511e' }} />
              <h1 className="text-lg font-black mb-1" style={{ color: 'var(--ink)' }}>
                {fa ? 'مشکلی پیش آمد' : 'Something went wrong'}
              </h1>
              <p className="text-xs font-bold opacity-70 mb-4 leading-relaxed">
                {fa
                  ? 'بازی به خطای غیرمنتظره‌ای خورد. پیشرفتت ذخیره شده است.'
                  : 'The game hit an unexpected error. Your progress is saved.'}
              </p>
              <button
                className="btn3d btn3d-green w-full"
                onClick={() => location.reload()}
              >
                <RefreshCw className="w-4 h-4 inline-block align-[-3px] me-1" />
                {fa ? 'بارگذاری دوباره' : 'Reload'}
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/** Connection-state pill — fixed to the top edge, non-intrusive. */
export function OfflineBanner() {
  const lang = useGame((s) => s.lang);
  const [online, setOnline] = React.useState<boolean | null>(null); // null = not mounted yet
  const [flashBack, setFlashBack] = React.useState(false);

  React.useEffect(() => {
    const update = () => {
      setOnline((prev) => {
        const next = navigator.onLine;
        if (prev === false && next) {
          setFlashBack(true);
          setTimeout(() => setFlashBack(false), 3000);
        }
        return next;
      });
    };
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (online === null || (online && !flashBack)) return null;
  const fa = lang === 'fa';
  const goingBack = online && flashBack;
  return (
    <div
      className="fixed top-2 left-1/2 -translate-x-1/2 z-[200] rounded-full px-3.5 py-1.5 flex items-center gap-2 text-[11px] font-black border-2 border-white/70 shadow-lg"
      style={{
        background: goingBack ? 'linear-gradient(180deg,#7be3a3,#38c172)' : 'linear-gradient(180deg,#546e7a,#37474f)',
        color: '#fff',
        whiteSpace: 'nowrap',
      }}
      role="status"
    >
      {goingBack ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
      {goingBack
        ? (fa ? 'اتصال برقرار شد — همگام‌سازی…' : 'Back online — syncing…')
        : (fa ? 'اتصال قطع است — آفلاین بازی می‌کنی، پیشرفتت محفوظ است' : 'No connection — playing offline, your progress is safe')}
    </div>
  );
}
