# Word Game 3D — بازی کلمات سه‌بعدی

A joyful cross-platform 3D brain-training game: **Word Hunter** (hidden-word
grids) and **Memory Match 3D** (pair flipping), 100 levels each × 4
difficulties, full economy, and a Persian (RTL) + English (LTR) interface.

بازی فکری سه‌بعدی با دو دنیای پازل، اقتصاد کامل، فروشگاه، رتبه‌بندی و پشتیبانی
کامل فارسی/انگلیسی.

## Quick start / اجرا

```bash
npm install
cp .env.example .env      # سپس DATABASE_URL را از Neon بگذار (DEPLOY.md)
npx prisma db push && npx prisma generate
npm run dev            # http://localhost:3000
```

Admin panel: `/admin` • Deploy (رایگان): `DEPLOY.md` (Neon + GitHub + Render) • Docs: `docs/INSTALL.md` (نصب) • `docs/RELEASE.md`
(انتشار Android/iOS/Web) • `ARCHITECTURE.md` (معماری ۱۳ سرویس)

## Feature map (spec §1–17)

| Area | Highlights |
| --- | --- |
| Mini-games | Word Hunter + Memory Match 3D — 100 levels each, bosses every 10th |
| i18n | Full fa/en dictionaries (`DictKey`-typed), RTL/LTR, Vazirmatn/Baloo 2, `fa-IR` digits, per-language word banks |
| Economy | Coins & XP, level/mission/achievement rewards, daily 7-day ladder (100→400 + hint + chest), chests, events |
| Missions & achievements | Daily/weekly missions, 20 achievements each with an exclusive reward |
| Shop & monetization | 3D shop, skins/boards/bg/fx/characters, coin packs, bundles, VIP (extra daily rewards, exclusive items, ad-free), consent-gated optional rewarded ads |
| Player profile | Name, avatar, level, XP, coins, completed levels, best records, skins, achievements, game history — guest play + account + cross-device cloud sync |
| Leaderboard | Independent module — weekly / monthly / friends boards, limited-time weekend competition, top-rank rewards, online provider stub |
| Backend | Prisma + PostgreSQL (Neon free tier), scrypt auth, server-authoritative wallet, idempotent purchase verification, append-only coin ledger, level-result server validation, rate limiting, admin panel |
| Performance | Mobile-first responsive, graphics quality setting (low/medium/high), auto-save, offline play + reconnect sync, error boundary |

## Documentation

- `ARCHITECTURE.md` — the 13 services, anti-cheat design, sync protocol, leaderboard module swap-in path
- `DEPLOY.md` — free-tier deploy guide: Neon Postgres → GitHub → Render + admin password setup
- `docs/INSTALL.md` — browser/Android/iOS install steps
- `docs/RELEASE.md` — release checklist, store publishing, online-competition roadmap
