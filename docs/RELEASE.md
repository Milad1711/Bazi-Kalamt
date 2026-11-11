# انتشار — Word Game 3D / Release Guide

## چک‌لیست پیش از انتشار / Pre-release checklist

- [ ] `npm run build` بدون خطا
- [ ] `npx tsc --noEmit` بدون خطا (مسیر src)
- [ ] تست خرید دمو (پک، بسته، VIP) و مشاهده تراکنش در `/admin` → آمار
- [ ] تست ثبت‌نام/ورود + همگام‌سازی بین دو مرورگر (دو دستگاه شبیه‌سازی‌شده)
- [ ] `ADMIN_TOKEN` پیش‌فرض عوض شده باشد
- [ ] `capacitor.config.json → server.url` به دامنه اصلی اشاره کند
- [ ] `DATABASE_URL` به PostgreSQL تولید و `prisma migrate deploy`

## ۱. انتشار وب / Web release

```bash
npm ci && npm run build && npm start   # یا داکر/PaaS دلخواه
```
- PWA: `public/manifest.json` → نصب از مرورگر موبایل هم ممکن است.
- CDN: فایل‌های استاتیک قابل کش؛ مسیرهای `/api/*` را کش نکن.

## ۲. اندروید — Google Play

1. `docs/INSTALL.md §۲` → `bundleRelease` (AAB).
2. Play Console → App signing by Google (توصیه‌شده).
3. Data safety: بازی سکه واقعی نمی‌فروشد (دمو)؛ در نسخه پرداخت‌دار، جمع‌آوری
   «شناسه نصب» و «داده بازی» را اعلام کن.
4. Content rating: Everyone؛ بدون تبلیغ اجباری (تبلیغ جایزه‌دار فقط با رضایت
   صریح کاربر نمایش داده می‌شود).

## ۳. iOS — App Store

1. `docs/INSTALL.md §۳` → Archive در Xcode.
2. پس از تأیید، TestFlight → انتشار.
3. App Privacy: مطابق داده‌های جمع‌شده (پروفایل بازیکن / خرید دمو).

## ۴. مهاجرت به PostgreSQL (تولید)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

```bash
npx prisma migrate dev --name init
npx prisma migrate deploy   # سرور
```

## ۵. نسخه‌بندی و رول‌اوت

- `package.json → version` را bump بده و tag بزن: `git tag v1.1.0`.
- قیمت‌ها و محتوا بدون انتشار نسخه جدید از `/admin` قابل تغییرند.
- رول‌بک: نسخه قبلی build را اجرا کن؛ دیتابیس فقط با migration رو به جلو.

## ۶. پایش / Monitoring

- `/api/admin/stats` → KPIهای سرویس (حساب‌ها، خرید، گردش سکه).
- خطاهای runtime در `ErrorBoundary` لاگ می‌شوند → سیم‌کشی به Sentry/OTLP.
- پاسخ‌های 429 (rate-limit) نشانه سوءاستفاده: در لاگ سرور رصد کن.

## ۷. مسیر رقابت آنلاین / Online competition roadmap

1. `GET /api/leaderboard` (امتیاز سمت سرور از `tournamentPoints`) +
   WebSocket برای به‌روزرسانی زنده — `RemoteLeaderboardProvider` آماده است.
2. مسابقات محدود زمانی واقعی: جدول `Competition` + ثبت امتیاز تأییدشده با
   `POST /api/game/validate`.
3. جوایز رتبه‌های برتر به‌صورت تراکنش دفتر کل صادر شود (نه دستی).
