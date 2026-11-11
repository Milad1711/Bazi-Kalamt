// ============ Admin panel (بخش ۱۷ — پنل مدیریت محتوا و مراحل) ============
// Token-gated dashboard served at /admin (outside the game shell).
//  1. Service stats   — accounts, purchases, ledger volume (Analytics service)
//  2. Economy prices  — edit pack/bundle/VIP prices, live via server overrides
//  3. Content words   — add/remove custom words per language & category
//  4. Devices         — look up an install id (شناسه دستگاه), inspect its
//                       server-side ledger and gift coins directly
// Auth: the panel sends the password as x-admin-token, verified server-side
// via @/server/admin-auth — scrypt hash in DB (set yours from the Security
// tab / کادر امن); until then env ADMIN_TOKEN or the demo default
// 'bq3-admin-demo' is accepted. The token never travels in the URL.
'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';

const CATS = [
  'animals', 'fruits', 'food', 'countries', 'cities', 'nature',
  'technology', 'sports', 'science', 'movies', 'general', 'persianWords', 'englishWords',
];

interface Stats {
  accounts: number; sessions: number; purchases: number;
  purchaseCoinsGranted: number; ledgerRows: number; ledgerNetCoins: number;
  customWords: number; snapshots: number;
}
interface Override { key: string; price: number }
interface CustomWord { id: string; lang: string; category: string; word: string }
interface BankCount { category: string; fa: number; en: number }
interface EconomyConfigDto {
  packs: { id: string; coins: number; price: number }[];
  bundles: { id: string; price: number; value: number }[];
  vip: { price: number; days: number };
}
interface DeviceRow { installId: string; balance: number; entries: number; net: number; lastAt: string }
interface LedgerRow { id: string; delta: number; balanceAfter: number; reason: string; createdAt: string }
interface PurchaseRow { id: string; itemId: string; kind: string; priceServer: number; granted: number; createdAt: string }
interface DeviceProfile {
  installId: string; balance: number; ledgerRows: number; netCoins: number;
  lastActivity: string | null; ledger: LedgerRow[]; purchases: PurchaseRow[];
}

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [showTok, setShowTok] = useState(false);
  const [hasCustom, setHasCustom] = useState<boolean | null>(null); // custom password set? (کادر امن)
  const [authed, setAuthed] = useState(false);
  const [fa, setFa] = useState(true);
  const [tab, setTab] = useState<'stats' | 'prices' | 'words' | 'devices' | 'security'>('stats');
  const [stats, setStats] = useState<Stats | null>(null);
  const [config, setConfig] = useState<EconomyConfigDto | null>(null);
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [custom, setCustom] = useState<CustomWord[]>([]);
  const [counts, setCounts] = useState<BankCount[]>([]);
  const [wordLang, setWordLang] = useState<'fa' | 'en'>('fa');
  const [wordCat, setWordCat] = useState('animals');
  const [wordText, setWordText] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [devQ, setDevQ] = useState('');
  const [device, setDevice] = useState<DeviceProfile | null>(null);
  const [devNotFound, setDevNotFound] = useState(false);
  const [giftAmount, setGiftAmount] = useState('500');
  const [giftNote, setGiftNote] = useState('');
  const [devBusy, setDevBusy] = useState(false);
  // security tab — set / rotate the admin password (کادر امن)
  const [curPass, setCurPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newPass2, setNewPass2] = useState('');
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [busyPass, setBusyPass] = useState(false);
  const [secMsg, setSecMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const L = useCallback((faS: string, enS: string) => (fa ? faS : enS), [fa]);

  const authFetch = useCallback(async (url: string, init?: RequestInit, tok?: string) => {
    const res = await fetch(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', 'x-admin-token': tok ?? token, ...(init?.headers ?? {}) },
    });
    if (res.status === 401) throw new Error('unauthorized');
    return res.json();
  }, [token]);

  const loadAll = useCallback(async (tok?: string) => {
    const [s, e, w, dv] = await Promise.all([
      authFetch('/api/admin/stats', undefined, tok),
      authFetch('/api/admin/economy', undefined, tok),
      authFetch('/api/admin/words', undefined, tok),
      authFetch('/api/admin/devices', undefined, tok),
    ]);
    setStats(s);
    setConfig(e.config);
    setOverrides(e.overrides ?? []);
    const d: Record<string, string> = {};
    for (const o of e.overrides ?? []) d[o.key] = String(o.price);
    setDrafts(d);
    setCustom(w.custom ?? []);
    setCounts(w.counts ?? []);
    setDevices(dv.devices ?? []);
  }, [authFetch]);

  const tryAuth = async (tok?: string) => {
    const t = tok ?? token;
    setMsg(null);
    try {
      await loadAll(t);
      setAuthed(true);
      sessionStorage.setItem('wg-admin-token', t); // secure-box session — dies with the tab
      setMsg(null);
    } catch {
      sessionStorage.removeItem('wg-admin-token');
      setMsg(L('رمز اشتباه است', 'Wrong password'));
    }
  };

  const savePrice = async (key: string) => {
    const price = Math.trunc(Number(drafts[key]));
    if (!Number.isFinite(price) || price < 0) return;
    await authFetch('/api/admin/economy', { method: 'POST', body: JSON.stringify({ key, price }) });
    await loadAll();
    setMsg(L(`قیمت ${key} ذخیره شد`, `Price ${key} saved`));
    setTimeout(() => setMsg(null), 2500);
  };

  const addWord = async () => {
    const word = wordText.trim().replace(/\s+/g, '');
    if (word.length < 3) return;
    const res = await authFetch('/api/admin/words', {
      method: 'POST',
      body: JSON.stringify({ lang: wordLang, category: wordCat, word }),
    });
    if (!res.ok) {
      setMsg(L('خطا: تکراری یا نامعتبر', 'Error: duplicate or invalid'));
    } else {
      setWordText('');
      await loadAll();
      setMsg(L(`«${word}» اضافه شد`, `“${word}” added`));
    }
    setTimeout(() => setMsg(null), 2500);
  };

  const delWord = async (id: string) => {
    await authFetch(`/api/admin/words?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    await loadAll();
  };

  // ---------- devices (مدیریت شناسه دستگاه + هدیه سکه) ----------
  const searchDevice = async (id?: string) => {
    const q = (id ?? devQ).trim();
    if (!q) return;
    setDevQ(q);
    const res = await authFetch(`/api/admin/devices?q=${encodeURIComponent(q)}`);
    if (res.found) {
      setDevice(res.device);
      setDevNotFound(false);
    } else {
      setDevice(null);
      setDevNotFound(true);
    }
  };

  const giftCoins = async () => {
    if (!device || devBusy) return;
    const amount = Math.trunc(Number(giftAmount));
    if (!Number.isFinite(amount) || amount < 1 || amount > 1_000_000) {
      setMsg(L('مقدار سکه نامعتبر است', 'Invalid amount'));
      setTimeout(() => setMsg(null), 2500);
      return;
    }
    setDevBusy(true);
    const res = await authFetch('/api/admin/devices', {
      method: 'POST',
      body: JSON.stringify({ installId: device.installId, amount, note: giftNote }),
    });
    setDevBusy(false);
    if (res.ok) {
      setMsg(L(
        `${amount.toLocaleString()} سکه هدیه داده شد — موجودی جدید: ${res.balance.toLocaleString()}`,
        `Gifted ${amount.toLocaleString()} coins — new balance: ${res.balance.toLocaleString()}`,
      ));
      setGiftNote('');
      await searchDevice(device.installId);
    } else {
      setMsg(L('خطا در هدیه سکه', 'Gift failed'));
    }
    setTimeout(() => setMsg(null), 3500);
  };

  // ---------- security: set / rotate the admin password (کادر امن) ----------
  const changePass = async () => {
    if (busyPass) return;
    setSecMsg(null);
    if (curPass !== token) {
      setSecMsg({ ok: false, text: L('رمز فعلی درست نیست', 'Current password is wrong') });
      return;
    }
    if (newPass.length < 8 || newPass.length > 72) {
      setSecMsg({ ok: false, text: L('رمز جدید باید ۸ تا ۷۲ کاراکتر باشد', 'New password must be 8–72 characters') });
      return;
    }
    if (newPass !== newPass2) {
      setSecMsg({ ok: false, text: L('تکرار رمز جدید مطابقت ندارد', 'Password repeat does not match') });
      return;
    }
    if (newPass === curPass) {
      setSecMsg({ ok: false, text: L('رمز جدید باید با رمز فعلی متفاوت باشد', 'New password must differ from the current one') });
      return;
    }
    setBusyPass(true);
    try {
      const res = await authFetch('/api/admin/password', {
        method: 'POST',
        body: JSON.stringify({ currentToken: token, newToken: newPass }),
      });
      if (res.ok) {
        setToken(newPass);
        sessionStorage.setItem('wg-admin-token', newPass);
        setHasCustom(true);
        setSecMsg({ ok: true, text: L('✅ رمز جدید ذخیره شد — از این به بعد فقط با همین رمز وارد شو', '✅ New password saved — sign in with it from now on') });
        setCurPass('');
        setNewPass('');
        setNewPass2('');
      } else if (res.error === 'weak_password') {
        setSecMsg({ ok: false, text: L('رمز جدید کوتاه است (حداقل ۸ کاراکتر)', 'New password is too short (min 8 characters)') });
      } else {
        setSecMsg({ ok: false, text: L('خطا در تغییر رمز', 'Failed to change password') });
      }
    } catch {
      setSecMsg({ ok: false, text: L('خطا در تغییر رمز', 'Failed to change password') });
    }
    setBusyPass(false);
  };

  // secure session (کادر امن): the token lives in sessionStorage only — never
  // in the URL — and the tab auto re-signs-in on refresh.
  useEffect(() => {
    fetch('/api/admin/password').then((r) => r.json()).then((d) => setHasCustom(!!d.hasCustom)).catch(() => {});
    const saved = sessionStorage.getItem('wg-admin-token');
    if (!saved) return;
    setToken(saved);
    loadAll(saved).then(() => setAuthed(true)).catch(() => sessionStorage.removeItem('wg-admin-token'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!authed) return;
    const id = setInterval(() => { loadAll().catch(() => {}); }, 30_000);
    return () => clearInterval(id);
  }, [authed, loadAll]);

  if (!authed) {
    return (
      <main dir={fa ? 'rtl' : 'ltr'} className="min-h-screen bg-slate-100 grid place-items-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-black">🧠 {L('پنل مدیریت', 'Admin Panel')}</h1>
            <button className="text-xs font-bold underline" onClick={() => setFa(!fa)}>
              {fa ? 'EN' : 'فا'}
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            {hasCustom === false
              ? L('کادر امن — رمز پیش‌فرض دمو: bq3-admin-demo. بعد از ورود، از تب «امنیت» رمز خودت را تعیین کن.', 'Secure box — demo default password: bq3-admin-demo. After signing in, set your own from the “Security” tab.')
              : L('رمز مدیریت را داخل کادر امن وارد کن.', 'Enter the admin password into the secure box.')}
          </p>
          <div className="relative mb-3">
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') tryAuth(); }}
              type={showTok ? 'text' : 'password'}
              placeholder={L('رمز مدیریت', 'Admin password')}
              autoComplete="current-password"
              dir="ltr"
              className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 pe-10 text-sm font-bold outline-none focus:border-teal-500"
            />
            <button
              type="button"
              onClick={() => setShowTok((v) => !v)}
              aria-label={showTok ? L('مخفی کردن رمز', 'Hide password') : L('نمایش رمز', 'Show password')}
              className="absolute end-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showTok ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {msg && <p className="text-xs font-black text-red-600 mb-2">{msg}</p>}
          <button
            onClick={() => tryAuth()}
            className="w-full py-2.5 rounded-xl bg-teal-600 text-white font-black text-sm hover:bg-teal-700 transition-colors"
          >
            {L('ورود', 'Sign in')}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main dir={fa ? 'rtl' : 'ltr'} className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-4">
        <header className="flex items-center gap-3">
          <h1 className="text-xl font-black flex-1">🧠 {L('پنل مدیریت بازی کلمات', 'Word Game Admin')}</h1>
          <button className="text-xs font-bold underline" onClick={() => setFa(!fa)}>{fa ? 'EN' : 'فا'}</button>
          <button
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300"
            onClick={() => { setAuthed(false); setToken(''); setShowTok(false); sessionStorage.removeItem('wg-admin-token'); }}
          >
            {L('خروج', 'Sign out')}
          </button>
        </header>

        <nav className="flex gap-2">
          {([['stats', L('آمار', 'Stats')], ['prices', L('قیمت‌ها', 'Prices')], ['words', L('کلمات', 'Words')], ['devices', L('دستگاه‌ها', 'Devices')], ['security', L('امنیت', 'Security')]] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-4 py-2 rounded-xl text-sm font-black transition-colors ${tab === k ? 'bg-teal-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
            >
              {label}
            </button>
          ))}
        </nav>

        {msg && (
          <div className="rounded-xl bg-emerald-100 text-emerald-800 text-xs font-black px-4 py-2.5">{msg}</div>
        )}

        {tab === 'stats' && stats && (
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label={L('حساب‌ها', 'Accounts')} value={stats.accounts} />
            <StatCard label={L('نشست‌های فعال', 'Sessions')} value={stats.sessions} />
            <StatCard label={L('خریدهای تأییدشده', 'Verified purchases')} value={stats.purchases} />
            <StatCard label={L('سکه‌های فروخته‌شده', 'Coins granted')} value={stats.purchaseCoinsGranted} />
            <StatCard label={L('تراکنش‌های دفتر کل', 'Ledger entries')} value={stats.ledgerRows} />
            <StatCard label={L('گردش خالص سکه', 'Net coin flow')} value={stats.ledgerNetCoins} />
            <StatCard label={L('اسنپ‌شات ابری', 'Cloud snapshots')} value={stats.snapshots} />
            <StatCard label={L('کلمات سفارشی', 'Custom words')} value={stats.customWords} />
          </section>
        )}

        {tab === 'prices' && config && (
          <section className="bg-white rounded-2xl shadow p-4 flex flex-col gap-3">
            <p className="text-xs text-slate-500">
              {L('قیمت‌ها از سرور خوانده می‌شوند؛ تغییر اینجا بلافاصله برای همه کلاینت‌ها اعمال می‌شود.', 'Prices are served from the server; changes here apply to every client immediately.')}
            </p>
            {config.packs.map((p) => (
              <PriceRow
                key={p.id}
                label={`${L('بسته سکه', 'Coin pack')}: ${p.id} (${p.coins} ${L('سکه', 'coins')})`}
                base={p.price}
                value={drafts[`pack:${p.id}`]}
                onChange={(v) => setDrafts((d) => ({ ...d, [`pack:${p.id}`]: v }))}
                onSave={() => savePrice(`pack:${p.id}`)}
                L={L}
              />
            ))}
            {config.bundles.map((b) => (
              <PriceRow
                key={b.id}
                label={`${L('بسته پیشنهادی', 'Bundle')}: ${b.id}`}
                base={b.price}
                value={drafts[`bundle:${b.id}`]}
                onChange={(v) => setDrafts((d) => ({ ...d, [`bundle:${b.id}`]: v }))}
                onSave={() => savePrice(`bundle:${b.id}`)}
                L={L}
              />
            ))}
            <PriceRow
              label="👑 VIP"
              base={config.vip.price}
              value={drafts['vip']}
              onChange={(v) => setDrafts((d) => ({ ...d, vip: v }))}
              onSave={() => savePrice('vip')}
              L={L}
            />
            {overrides.length > 0 && (
              <p className="text-[11px] text-slate-500">
                {L('قیمت‌های بازنویسی‌شده فعال:', 'Active overrides:')}{' '}
                {overrides.map((o) => `${o.key}=${o.price}`).join(' · ')}
              </p>
            )}
          </section>
        )}

        {tab === 'words' && (
          <>
            <section className="bg-white rounded-2xl shadow p-4 flex flex-col gap-3">
              <h2 className="font-black text-sm">{L('افزودن کلمه به بانک', 'Add a word to the bank')}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <select
                  value={wordLang}
                  onChange={(e) => setWordLang(e.target.value as 'fa' | 'en')}
                  className="border-2 border-slate-200 rounded-xl px-2 py-2 text-sm font-bold"
                >
                  <option value="fa">فارسی</option>
                  <option value="en">English</option>
                </select>
                <select
                  value={wordCat}
                  onChange={(e) => setWordCat(e.target.value)}
                  className="border-2 border-slate-200 rounded-xl px-2 py-2 text-sm font-bold"
                >
                  {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input
                  value={wordText}
                  onChange={(e) => setWordText(e.target.value)}
                  placeholder={L('کلمه (۳ تا ۱۲ حرف)', 'Word (3–12 chars)')}
                  className="border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-teal-500"
                />
                <button
                  onClick={addWord}
                  className="rounded-xl bg-teal-600 text-white font-black text-sm hover:bg-teal-700"
                >
                  {L('افزودن', 'Add')}
                </button>
              </div>
            </section>

            <section className="bg-white rounded-2xl shadow p-4">
              <h2 className="font-black text-sm mb-2">{L('حجم بانک هر دسته', 'Bank size per category')}</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b-2 border-slate-100">
                      <th className="text-start py-1.5">{L('دسته', 'Category')}</th>
                      <th className="py-1.5">FA</th>
                      <th className="py-1.5">EN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {counts.map((c) => (
                      <tr key={c.category} className="border-b border-slate-50">
                        <td className="py-1.5 font-bold">{c.category}</td>
                        <td className="py-1.5 text-center font-black">{c.fa}</td>
                        <td className="py-1.5 text-center font-black">{c.en}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {custom.length > 0 && (
              <section className="bg-white rounded-2xl shadow p-4">
                <h2 className="font-black text-sm mb-2">{L('کلمات سفارشی', 'Custom words')}</h2>
                <div className="flex flex-wrap gap-2">
                  {custom.map((w) => (
                    <span key={w.id} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-bold">
                      {w.word}
                      <span className="text-[9px] text-slate-400">{w.lang}/{w.category}</span>
                      <button onClick={() => delWord(w.id)} className="text-red-500 hover:text-red-700 font-black" aria-label="delete">✕</button>
                    </span>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {tab === 'devices' && (
          <>
            <section className="bg-white rounded-2xl shadow p-4 flex flex-col gap-3">
              <h2 className="font-black text-sm">{L('مدیریت دستگاه‌ها', 'Device management')}</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                {L(
                  'شناسه دستگاه (install id) بازیکن را جستجو کن، موجودی سمت سرور و دفتر کل او را ببین و مستقیم سکه هدیه بده. بازیکن با باز کردن دوباره بازی، سکه هدیه را خودکار دریافت می‌کند.',
                  'Search a player’s device id (install id), inspect the server-side ledger and gift coins directly. The device picks up the gift automatically on its next app start.',
                )}
              </p>
              <div className="flex gap-2 flex-wrap">
                <input
                  value={devQ}
                  onChange={(e) => setDevQ(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') searchDevice(); }}
                  placeholder={L('شناسه دستگاه…', 'Device id…')}
                  dir="ltr"
                  className="flex-1 min-w-[220px] border-2 border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold outline-none focus:border-teal-500"
                />
                <button
                  onClick={() => searchDevice()}
                  className="px-4 py-2 rounded-xl bg-teal-600 text-white font-black text-sm hover:bg-teal-700"
                >
                  {L('جستجو', 'Search')}
                </button>
              </div>

              {devNotFound && (
                <p className="text-xs font-black text-red-600">{L('دستگاهی با این شناسه پیدا نشد', 'No device found with this id')}</p>
              )}

              {device && (
                <div className="rounded-xl border-2 border-teal-100 bg-teal-50/40 p-3 flex flex-col gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <p className="text-[10px] font-bold text-slate-500">{L('شناسه دستگاه', 'Device id')}</p>
                      <p className="text-xs font-black font-mono break-all" dir="ltr">{device.installId}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {L('آخرین فعالیت', 'Last activity')}: {device.lastActivity ? new Date(device.lastActivity).toLocaleString(fa ? 'fa-IR' : 'en-US') : '—'}
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="text-[10px] font-bold text-slate-500">{L('موجودی سرور', 'Server balance')}</p>
                      <p className="text-2xl font-black text-teal-700">{device.balance.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <MiniStat label={L('تراکنش‌ها', 'Entries')} value={device.ledgerRows} />
                    <MiniStat label={L('گردش خالص', 'Net flow')} value={device.netCoins} />
                    <MiniStat label={L('خریدها', 'Purchases')} value={device.purchases.length} />
                  </div>

                  {/* gift form (هدیه سکه) */}
                  <div className="rounded-xl bg-white border-2 border-slate-100 p-3 flex flex-col gap-2">
                    <h3 className="font-black text-xs">{L('هدیه سکه به این دستگاه', 'Gift coins to this device')}</h3>
                    <div className="flex gap-2 flex-wrap items-end">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">{L('مقدار', 'Amount')}</label>
                        <input
                          value={giftAmount}
                          onChange={(e) => setGiftAmount(e.target.value.replace(/[^\d]/g, ''))}
                          inputMode="numeric"
                          className="w-28 border-2 border-slate-200 rounded-xl px-2.5 py-1.5 text-sm font-black outline-none focus:border-teal-500"
                        />
                      </div>
                      <div className="flex-1 min-w-[160px]">
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">{L('یادداشت (دلیل)', 'Note (reason)')}</label>
                        <input
                          value={giftNote}
                          onChange={(e) => setGiftNote(e.target.value)}
                          maxLength={28}
                          placeholder={L('مثلاً: جبران خطا', 'e.g. support compensation')}
                          className="w-full border-2 border-slate-200 rounded-xl px-2.5 py-1.5 text-sm font-bold outline-none focus:border-teal-500"
                        />
                      </div>
                      <button
                        onClick={giftCoins}
                        disabled={devBusy}
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-black text-xs hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {L('هدیه سکه', 'Gift coins')}
                      </button>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {[100, 500, 1000, 5000].map((n) => (
                        <button
                          key={n}
                          onClick={() => setGiftAmount(String(n))}
                          className="px-2.5 py-1 rounded-lg bg-white border-2 border-slate-200 text-xs font-bold hover:border-teal-500"
                        >
                          +{n.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* recent ledger */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="text-slate-400 border-b-2 border-slate-100">
                          <th className="text-start py-1.5">{L('زمان', 'Time')}</th>
                          <th className="text-start py-1.5">{L('دلیل', 'Reason')}</th>
                          <th className="py-1.5">{L('تغییر', 'Delta')}</th>
                          <th className="py-1.5">{L('مانده', 'Balance')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {device.ledger.map((r) => (
                          <tr key={r.id} className="border-b border-slate-50">
                            <td className="py-1.5 font-bold text-slate-500">{new Date(r.createdAt).toLocaleString(fa ? 'fa-IR' : 'en-US')}</td>
                            <td className="py-1.5 font-mono text-[10px]" dir="ltr">{r.reason}</td>
                            <td className={`py-1.5 text-center font-black ${r.delta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                              {r.delta > 0 ? '+' : ''}{r.delta.toLocaleString()}
                            </td>
                            <td className="py-1.5 text-center font-black">{r.balanceAfter.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>

            <section className="bg-white rounded-2xl shadow p-4">
              <h2 className="font-black text-sm mb-2">{L('دستگاه‌های اخیر', 'Recent devices')}</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b-2 border-slate-100">
                      <th className="text-start py-1.5">{L('شناسه دستگاه', 'Device id')}</th>
                      <th className="py-1.5">{L('موجودی', 'Balance')}</th>
                      <th className="py-1.5">{L('تراکنش‌ها', 'Entries')}</th>
                      <th className="py-1.5">{L('آخرین فعالیت', 'Last activity')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {devices.map((d) => (
                      <tr
                        key={d.installId}
                        onClick={() => searchDevice(d.installId)}
                        className="border-b border-slate-50 hover:bg-teal-50 cursor-pointer"
                      >
                        <td className="py-1.5 font-mono text-[10px] max-w-[220px] truncate" dir="ltr">{d.installId}</td>
                        <td className="py-1.5 text-center font-black">{d.balance.toLocaleString()}</td>
                        <td className="py-1.5 text-center font-bold">{d.entries}</td>
                        <td className="py-1.5 text-center text-slate-500 text-[10px]">{new Date(d.lastAt).toLocaleString(fa ? 'fa-IR' : 'en-US')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {devices.length === 0 && (
                  <p className="text-xs text-slate-400 py-3 text-center">{L('هنوز تراکنشی ثبت نشده', 'No ledger activity yet')}</p>
                )}
              </div>
            </section>
          </>
        )}

        {tab === 'security' && (
          <section className="bg-white rounded-2xl shadow p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <ShieldCheck className="w-5 h-5 text-teal-600" />
              <h2 className="font-black text-sm">{L('تغییر رمز مدیریت (کادر امن)', 'Change admin password (secure box)')}</h2>
              {hasCustom && (
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 rounded-lg px-2 py-1 ms-auto">
                  🔒 {L('رمز اختصاصی فعال است', 'Custom password active')}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {L('رمز به‌صورت هش scrypt روی سرور ذخیره می‌شود و متن ساده‌اش هیچ‌جا نگه داشته نمی‌شود. بعد از تغییر، رمز قبلی و پیش‌فرض دمو بلافاصله باطل می‌شوند.', 'The password is stored server-side as a scrypt hash; its plain text is never kept. After changing, the old and demo passwords are invalidated immediately.')}
            </p>
            <SecurePassBox label={L('رمز فعلی', 'Current password')} value={curPass} onChange={setCurPass} show={showCur} setShow={setShowCur} autoComplete="current-password" L={L} />
            <SecurePassBox label={L('رمز جدید (حداقل ۸ کاراکتر)', 'New password (min 8 characters)')} value={newPass} onChange={setNewPass} show={showNew} setShow={setShowNew} L={L} />
            <SecurePassBox label={L('تکرار رمز جدید', 'Repeat new password')} value={newPass2} onChange={setNewPass2} show={showNew} setShow={setShowNew} L={L} />
            {secMsg && (
              <p className={`text-xs font-black ${secMsg.ok ? 'text-emerald-600' : 'text-red-600'}`}>{secMsg.text}</p>
            )}
            <button
              onClick={changePass}
              disabled={busyPass}
              className="self-start px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-black hover:bg-teal-700 disabled:opacity-50 transition-opacity"
            >
              {busyPass ? L('در حال ذخیره…', 'Saving…') : L('ذخیره رمز جدید', 'Save new password')}
            </button>
          </section>
        )}
      </div>
    </main>
  );
}

// ---------- secure password box (کادر امن) — masked input + reveal toggle ----------
function SecurePassBox({
  label, value, onChange, show, setShow, L, autoComplete = 'new-password',
}: {
  label: string; value: string;
  onChange: (v: string) => void;
  show: boolean; setShow: (v: boolean) => void;
  autoComplete?: string;
  L: (fa: string, en: string) => string;
}) {
  return (
    <div>
      <label className="text-[11px] font-bold text-slate-500 block mb-1">{label}</label>
      <div className="relative">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          dir="ltr"
          className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 pe-10 text-sm font-bold outline-none focus:border-teal-500"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          aria-label={show ? L('مخفی کردن', 'Hide') : L('نمایش', 'Show')}
          className="absolute end-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="text-2xl font-black">{value.toLocaleString()}</div>
      <div className="text-[11px] font-bold text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white border-2 border-slate-100 p-2 text-center">
      <div className="text-sm font-black">{value.toLocaleString()}</div>
      <div className="text-[9px] font-bold text-slate-500">{label}</div>
    </div>
  );
}

function PriceRow({
  label, base, value, onChange, onSave, L,
}: {
  label: string; base: number; value?: string;
  onChange: (v: string) => void; onSave: () => void;
  L: (fa: string, en: string) => string;
}) {
  const overridden = value !== undefined && value !== String(base);
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className={`text-sm font-bold flex-1 min-w-[180px] ${overridden ? 'text-teal-700' : 'text-slate-700'}`}>
        {label}
        <span className="text-[10px] text-slate-400 ms-2">base {base}</span>
      </span>
      <input
        value={value ?? String(base)}
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ''))}
        inputMode="numeric"
        className="w-24 border-2 border-slate-200 rounded-xl px-2.5 py-1.5 text-sm font-black outline-none focus:border-teal-500"
      />
      <button
        onClick={onSave}
        className="px-3 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-black hover:bg-teal-700"
      >
        {L('ذخیره', 'Save')}
      </button>
    </div>
  );
}
