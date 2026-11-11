# راهنمای انتشار رایگان — Neon + GitHub + Render

کل زیرساخت روی پلن‌های **رایگان دائمی** راه می‌افتد (بدون کارت بانکی):

| سرویس | نقش | سقف رایگان |
| --- | --- | --- |
| [Neon](https://neon.tech) | دیتابیس PostgreSQL | ~۱GB دیتابیس + ۱۰۰ ساعت CPU در ماه، تا ۱۰۰ پروژه — بعد از بیکاری می‌خوابد ولی خودکار بیدار می‌شود |
| [GitHub](https://github.com) | سورس‌کد + دیپلوی خودکار | نامحدود برای ریپوی خصوصی/عمومی |
| [Render](https://render.com) | هاست Next.js | ۷۵۰ ساعت در ماه؛ بعد از ۱۵ دقیقه بی‌کاری می‌خوابد (~۱ دقیقه بیدار شدن) |

> نکته دسترسی: این سرویس‌ها مثل Vercel و Turso از ایران معمولاً با VPN باز می‌شوند؛
> خودِ سایت بازی برای کاربران نهایی از داخل ایران بدون فیلترشکن باز می‌شود.

---

## مرحله ۱ — ساخت دیتابیس در Neon

1. به [neon.tech](https://neon.tech) برو و با اکانت GitHub ثبت‌نام کن.
2. **Create project** → نام دلخواه (مثلاً `word-game`) → Region نزدیک‌تر: `Europe (Frankfurt)` → نسخه Postgres پیش‌فرض.
3. در همان صفحه (Branch overview) دکمه سبز **Connect** را بزن (زیر نام پروژه،
   منوی سمت چپ). در پنجره باز‌شده:
   - گزینه **Pooled connection** را انتخاب کن (برای جلوگیری از خطای too many connections).
   - رشته اتصال را کپی کن؛ چیزی شبیه:

   ```
   postgresql://USER:PASSWORD@ep-XXXX-pooler.YYYY.aws.neon.tech/neondb?sslmode=require
   ```

4. همین رشته را در متغیرهای Render (مرحله ۴) می‌گذاریم.
   - بقیه موارد صفحه Neon (Better Auth، Object storage، Functions، AI Gateway…)
     را نادیده بگیر — لازم نیست.

## مرحله ۲ — ساخت جداول (خودکار!)

نیازی به کار دستی نیست: در Blueprint رندر دستور `prisma db push` به‌صورت خودکار
اجرا می‌شود و همه جدول‌ها (`Account`, `Session`, `PlayerSnapshot`, `EconomyOverride`,
`ContentWord`, `Purchase`, `CoinLedger`, `AdminAuth`) را روی Neon می‌سازد.

فقط اگر خواستی **محلی** هم با دیتابیس Neon اجرا کنی، فایل `.env` را با رشته اتصال
پر کن و `npm run db:push` بزن.

## مرحله ۳ — انتقال کد به GitHub (ویندوز، با GitHub Desktop)

ساده‌ترین راه روی ویندوز:

1. [desktop.github.com](https://desktop.github.com) → نصب **GitHub Desktop** و ورود با اکانت GitHub.
2. پوشه پروژه بازی را روی کامپیوترت باز کن (File → **Add local repository** →
   Choose پوشه‌ای که `package.json` دارد).
3. بالای برنامه: **Publish repository** → نام `word-game-3d` → تیک Keep this code private
   را بگذار → Publish.

(جایگزین با ترمینال: در گیت‌هاب یک ریپوی خالی بساز و بعد
`git remote add origin https://github.com/USERNAME/word-game-3d.git && git push -u origin main`.)

- فایل `.env` و دیتابیس محلی (`db/`) به‌صورت خودکار commit نمی‌شوند — رمزها فقط روی Render ثبت می‌شوند.

## مرحله ۴ — هاست Render

1. به [dashboard.render.com](https://dashboard.render.com) برو (با اکانت GitHub).
2. **New + → Web Service** → ریپو را انتخاب کن.
   - اگر `render.yaml` را ببینی، کافی است **Blueprint** را تأیید کنی؛ همه تنظیمات پایین خودکار اعمال می‌شود.
3. تنظیمات (در صورت نیاز دستی):
   - Runtime: **Node** — Branch: `main` — Plan: **Free**
   - Build Command: `npm install && npx prisma db push --skip-generate && npm run build`
   - Start Command: `npm run start`
4. بخش **Environment** دو متغیر بساز:
   - `DATABASE_URL` = رشته اتصال Neon از دکمه Connect (مرحله ۱، نسخه Pooled)
   - `ADMIN_TOKEN` = یک رمز قوی (فقط برای ورود اول به پنل ادمین)
5. **Create Web Service** → اولین build حدود ۳ تا ۵ دقیقه طول می‌کشد.
6. آدرس نهایی چیزی مثل `https://word-game-3d-xxxx.onrender.com` است.

## مرحله ۵ — قفل کردن پنل ادمین (کادر امن)

1. `https://YOUR-APP.onrender.com/admin` را باز کن.
2. با رمز `ADMIN_TOKEN` (یا پیش‌فرض دموی `bq3-admin-demo` اگر تنظیم نکردی) وارد شو.
3. تب **«امنیت»** → رمز فعلی + رمز جدید (حداقل ۸ کاراکتر) + تکرار → ذخیره.
4. از این به بعد فقط رمز جدید کار می‌کند و روی سرور به‌صورت هش scrypt نگه داشته می‌شود.

## نکته‌های پلن رایگان

- **خواب سرویس**: بعد از ۱۵ دقیقه بدون بازدید، Render سرویس را خاموش می‌کند؛
  بازدید بعدی ~۱ دقیقه طول می‌کشد تا بیدار شود. اگر می‌خواهی همیشه بیدار بماند،
  یک مانیتور رایگان مثل [UptimeRobot](https://uptimerobot.com) هر ۱۰ دقیقه آدرس را ping کند.
- **سقف Neon**: ۱۰۰ ساعت CPU در ماه برای یک بازی کوچک خیلی بیشتر از نیاز است؛
  مصرف را از تب Metrics در Neon ببین.
- **آپدیت بازی**: فقط `git push` بزن — Render خودش build و انتشار می‌کند.
- **دیتای محلی**: دیتابیس آزمایشی `db/custom.db` منتقل نمی‌شود؛ بازی روی Neon از صفر
  شروع می‌کند (برای شروع تمیز بهتر است). اگر خواستی داده منتقل کنی بگو تا اسکریپتش را بنویسم.

## اجرای محلی (اختیاری)

اگر خواستی بازی را روی کامپیوتر خودت هم با همان دیتابیس Neon اجرا کنی
(نیازمند نصب [Node.js 20+](https://nodejs.org)):

```bash
cp .env.example .env     # سپس DATABASE_URL را از Neon بگذار
npm install              # postinstall خودش prisma generate می‌زند
npm run db:push          # جداول را می‌سازد (اگر قبلاً رندر نساخته باشد)
npm run dev              # http://localhost:3000
```
