# Word Game 3D — Technical Architecture (بخش ۱۴)

> معماری ماژولار و Cross-Platform — نسخه دمو اجراشده در این مخزن + نقشه تکمیل
> This document maps the 13 required services to the code in this repository,
> describes the anti-cheat design, and defines the path to the full production
> stack (Capacitor / PostgreSQL / WebSocket / Cloud Storage).

## 1. Stack (as required by the spec)

| Layer | Spec | This repo (demo) | Production plan |
| --- | --- | --- | --- |
| Frontend | React + TypeScript | ✅ Next.js 16 + React 19 + TS | same codebase |
| Mobile | Capacitor | ✅ `capacitor.config.json` ready | `npx cap add android/ios` → see `docs/RELEASE.md` |
| 3D | Three.js / R3F | ✅ pure CSS-3D + SVG (zero-weight «lightweight 3D», GPU-friendly) | R3F optional for hero scenes; gameplay stays CSS-3D |
| Backend | Node.js | ✅ Next.js API routes (Node runtime) | same, or NestJS extraction |
| Database | PostgreSQL | ✅ Prisma ORM on SQLite (`db/custom.db`) | swap `datasource db` → `postgresql` — zero code change (Prisma) |
| Auth | Secure authentication | ✅ scrypt hashes + opaque bearer tokens | + refresh tokens / OAuth / store sign-in |
| Real-time | WebSocket as needed | 📐 interface stub (`RemoteLeaderboardProvider`) | socket.io (see `examples/websocket/`) |
| Storage | Cloud object storage | ➖ not needed yet (all art is inline SVG) | S3/OSS for avatars, screenshots, remote configs |

## 2. The 13 services → code map

| # | Service | Location | Status |
| --- | --- | --- | --- |
| 1 | Authentication Service | `src/app/api/account/*`, `src/server/accounts.ts` | ✅ register / login / sessions (scrypt + token) |
| 2 | Player Profile Service | `store.ts` (profile slice) + `Profile.tsx` + `PlayerSnapshot` model | ✅ incl. cross-device push/pull sync |
| 3 | Game Engine | `GameShell.tsx`, `store.ts` | ✅ |
| 4 | Word Search Engine | `wordEngine.ts` + `words/` banks (per-language) | ✅ 100 levels × 4 difficulties × 13 categories |
| 5 | Memory Match Engine | `memoryEngine.ts` | ✅ 100 levels × 4 difficulties |
| 6 | Level Management | `zones.ts`, engines' level configs, LevelMap UI | ✅ |
| 7 | Reward Engine | `economy.ts` (XP/levels/events), `store.ts` (chests, daily) | ✅ server-mirrored in `game-validation.ts` |
| 8 | Coin Wallet | server ledger `/api/economy/ledger` + `server-economy.ts` | ✅ server-authoritative balance, client self-corrects |
| 9 | Shop System | `shop.ts`, `Shop.tsx` | ✅ coins/skins/customization/bundles |
| 10 | Payment Verification | `/api/economy/purchase` (idempotent nonce) + `serverPrice()` | ✅ demo receipts; store/gateway receipt check = same hook |
| 11 | Achievement System | `achievements.ts`, Missions hub | ✅ 20 achievements, each with an exclusive reward |
| 12 | Leaderboard | `leaderboard.ts` (independent module) + `Leaderboard.tsx` | ✅ local sim; `RemoteLeaderboardProvider` ready |
| 13 | Analytics | `/api/admin/stats` + admin dashboard | ✅ basic; production: event pipeline |

## 3. Server-authoritative money (موجودی سکه فقط در سرور)

1. **Prices are server-managed** — the shop fetches `/api/economy/config`
   (`economyConfig()` merges admin-panel overrides from the `EconomyOverride`
   table). A tampered client cannot change a price.
2. **Purchases are server-verified** — the client sends `{kind, itemId, nonce}`
   and *never a price*. The server looks up the canonical price, grants the
   canonical amount and records the purchase. The unique `nonce` makes replays
   idempotent («خرید تکراری» impossible).
3. **Every coin delta is reported** to the append-only `CoinLedger` with the
   balance after the change. The server enforces continuity
   (`balanceAfter == last + delta`); a mismatch = tampering → the client adopts
   the authoritative server balance (`reconcileBalance` on boot).
4. **Rate limiting** — `src/server/rate-limit.ts` guards purchase (10/min),
   validation (60/min), auth (5–8/min) and sync (20/min) endpoints.
5. **Payments** — production flow: client gets a receipt from the app store /
   payment gateway → `POST /api/economy/purchase` verifies the receipt with the
   provider → grant happens once, server-side. The demo uses the store
   confirmation as the receipt; the hook point is `verifyPurchase()`.

## 4. Level-result validation (نتیجه مراحل سمت سرور اعتبارسنجی شود)

- Client finishes a level → reports the **inputs** (time, hints, words found,
  pairs, moves, mistakes…) to `POST /api/game/validate`.
- The server re-computes the reward with its own copy of the formulas
  (`src/server/game-validation.ts` mirroring `economy.ts`) and rejects
  impossible inputs (negative/1-hour times, more words than a level holds,
  fewer moves than pairs, …).
- `applyValidation()` in `store.ts`:
  - verified → adopt the server's numbers (self-correction on mismatch);
  - rejected → revert the grant;
  - offline → keep the local result so play continues offline (§16), and the
    entry is marked accordingly in the game history.
- Every finished round carries a **unique transaction id** (`newTxId()`,
  `HistoryEntry.tx`) — traceable, replay-safe.

## 5. Cross-device sync (همگام‌سازی)

`Account` (scrypt hash) → `Session` (bearer token) → `PlayerSnapshot`
(progress-only JSON, ≤ 200 KB, credentials never included).

- Register/login issues a token; guest play needs no account.
- On login the client compares XP: the copy with **more progress** wins and is
  pushed/pulled accordingly; explicit «Save to cloud / Load from cloud» buttons
  exist on the Profile screen.
- Conflict policy: last-write-wins on XP progress, documented in-UI.

## 6. Leaderboard module (ماژول مستقل)

`src/lib/game/leaderboard.ts` exposes `LeaderboardProvider`-shaped access:

- `LocalSimProvider` — deterministic bots (same board for every client),
  weekly/monthly scopes, friends list, limited-time weekend competition, top
  rank rewards. Works fully offline.
- `RemoteLeaderboardProvider` — same interface, already coded to fall back to
  the local sim until `GET /api/leaderboard` + WebSocket (§1) go live.
- Nothing outside the module knows which provider is active — the swap is a
  one-line change.

## 7. Mobile builds

`capacitor.config.json` (appId `ir.wordgame.game`) points the native shell at
the hosted web build. Android/iOS steps: `docs/RELEASE.md`.

## 8. i18n architecture (بخش ۱۵)

- All UI strings flow through `i18n.ts` (`DictKey` type-checked dictionary,
  fa + en); no component owns literal UI text.
- fa: RTL (`dir` switch on `<html>`), Vazirmatn font, `fa-IR` locale numbers.
- en: LTR, Baloo 2, `en-US` numbers.
- Word banks are per-language and per-category (`words/bank-a|b|c.ts` with
  `en`/`fa` arrays + `persianWords`/`englishWords` language categories);
  admin-added words are merged at runtime via `/api/content/words`.
