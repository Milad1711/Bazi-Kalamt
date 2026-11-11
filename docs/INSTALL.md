# نصب و راه‌اندازی — Word Game 3D / Installation Guide

## پیش‌نیازها / Prerequisites
- Node.js 20+ (Node 22 recommended)
- npm (یا bun/pnpm)

## ۱. اجرا در مرورگر / Run in browser (بخش ۱۷.۱)

```bash
npm install

# environment
echo 'DATABASE_URL=file:/home/<project>/db/custom.db' > .env
# optional: admin panel token
echo 'ADMIN_TOKEN=choose-a-strong-token' >> .env

# database (SQLite for the demo — PostgreSQL in production, see ARCHITECTURE.md)
npx prisma db push
npx prisma generate

npm run dev        # http://localhost:3000
npm run build && npm start   # production
```

- بازی: `/` — بازی مهمان بلافاصله کار می‌کند (guest play, no account needed).
- پروفایل: از لابی → آواتار یا دکمه «پروفایل بازیکن»؛ ساخت حساب → همگام‌سازی بین دستگاه‌ها.
- پنل مدیریت: `/admin` (توکن `ADMIN_TOKEN`).

## ۲. نسخه اندروید / Android build (بخش ۱۷.۲)

```bash
npm i -D @capacitor/cli && npm i @capacitor/core @capacitor/android
npx cap add android
# نکته: capacitor.config.json → server.url را به آدرس سرور اصلی تغییر بده
#       (یا برای بسته‌ی کاملاً آفلاین خروجی استاتیک وب را در webDir قرار بده
#        و APIها را روی سرور میزبانی کن)
npx cap sync android
cd android
./gradlew assembleDebug        # خروجی: android/app/build/outputs/apk/debug/
./gradlew bundleRelease        # AAB برای گوگل‌پلی (نیاز به signing config)
```

امضای نسخه انتشار (Release signing):

```bash
keytool -genkey -v -keystore wordgame.keystore -alias wordgame -keyalg RSA -keysize 2048 -validity 10000
# android/app/build.gradle → signingConfigs.release
```

## ۳. نسخه iOS / iOS build (بخش ۱۷.۳)

```bash
npm i @capacitor/ios
npx cap add ios
npx cap sync ios
open ios/App/App.xcworkspace   # Xcode → signing & capabilities → Archive
```
نیازمند macOS + Xcode 15+ و حساب Apple Developer برای انتشار در App Store.

## ۴. متغیرهای محیطی / Environment

| Var | توضیح |
| --- | --- |
| `DATABASE_URL` | رشته اتصال (SQLite دمو / PostgreSQL تولید) |
| `ADMIN_TOKEN` | توکن پنل `/admin` — حتماً برای عمومی تغییر بده |

## ۵. پنل مدیریت / Admin panel (بخش ۱۷.۱۴)

- آمار سرویس: حساب‌ها، خریدها، دفتر کل سکه.
- قیمت‌گذاری مرکزی: بسته‌های سکه، بسته‌های ترکیبی، VIP — بدون آپدیت کلاینت.
- مدیریت محتوا: افزودن/حذف کلمه به بانک هر زبان و هر دسته؛ کلمات بلافاصله با
  `/api/content/words` به بازی تزریق می‌شوند.

## ۶. داده و پشتیبان‌گیری / Data

- دمو: فایل `db/custom.db` (SQLite) — کافی است از همین فایل بکاپ بگیری.
- تولید: PostgreSQL — `npx prisma migrate deploy`.

## ۷. عیب‌یابی / Troubleshooting

| مشکل | راه‌حل |
| --- | --- |
| خطای Prisma روی start | `npx prisma db push` را دوباره اجرا کن |
| خریدها خطای network دادند | سرور در دسترس نیست؛ بازی آفلاین ادامه می‌دهد و بعد از اتصال خودش همگام می‌شود |
| صدا پخش نمی‌شود | مرورگرها تا اولین لمس صدا را قفل می‌کنند — یک بار صفحه را لمس کن |
| فراموشی توکن ادمین | مقدار `ADMIN_TOKEN` را در env عوض کن |
