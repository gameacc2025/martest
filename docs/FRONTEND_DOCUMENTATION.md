# مستندات فرانت‌اند — سه پنل Vue

## ساختار جاری

پروژه یک monorepo مبتنی بر pnpm است و سه اپلیکیشن مستقل Vue/Vite دارد:

| اپلیکیشن | مسیر | کاربرد | پورت توسعه/Compose |
|---|---|---|---|
| Website | `apps/website` | وب‌سایت عمومی، کاتالوگ محصول و تجربه CUSTOMER | 3001 |
| Company | `apps/company` | پنل شرکت و مدیریت محصولات/استعلام‌های مجاز | 3002 |
| Admin | `apps/admin` | پنل STAFF برای مدیریت و تأیید | 3003 |

این پورت‌ها در Compose به host منتشر می‌شوند. در imageهای production، اپ‌ها با nginx روی پورت داخلی 80 سرو می‌شوند.

## فناوری‌ها

- Vue 3 و Vue Router
- Vite 8 در manifestهای اپلیکیشن
- PrimeVue 4 و PrimeIcons در سه اپلیکیشن
- Pinia در جاهایی که state مشترک/ماندگار لازم است
- JavaScript (نه TypeScript)
- pnpm workspace برای سه اپ و packageهای مشترک

نسخه قطعی هر وابستگی در `package.json` و `pnpm-lock.yaml` است؛ این سند جایگزین lockfile نیست.

## ساختار monorepo

```text
apps/
  website/       # اپ عمومی
  company/       # پنل شرکت
  admin/         # پنل مدیریت
packages/
  api-client/    # قرارداد/کلاینت HTTP مشترک
  auth/          # نشست و handoff احراز هویت
  permissions/   # کمک‌ابزارهای مجوز
  shared-core/   # منطق مشترک
  shared-ui/     # اجزای رابط مشترک
  vite-config/   # تنظیمات مشترک Vite
backend/         # Fastify + Prisma API
docker/nginx/    # reverse proxy برای API و uploads + SPA fallback
```

هر اپ ساختار `src/`، router، صفحات، کامپوننت‌ها و تست‌های خود را دارد. برای مسیر دقیق فایل‌ها از درخت همان اپ استفاده کنید؛ مسیر قدیمی `frontend/src/` در ساختار فعلی وجود ندارد.

## Packageهای مشترک

- `@telecom/api-client`: از این package برای درخواست‌های API استفاده کنید و کلاینت موازی جدید نسازید.
- `@telecom/auth`: منطق مشترک احراز هویت و انتقال نشست.
- `@telecom/permissions`: بررسی مجوزها در UI؛ جایگزین مجوزسنجی backend نیست.
- `@telecom/shared-core` و `@telecom/shared-ui`: منطق و اجزای مشترک.
- `@telecom/vite-config`: تنظیمات پایه Vite.

## URLهای API و پراکسی

- Prefix بک‌اند: `/api/v1`
- Compose: مرورگر به origin هر پنل متصل می‌شود؛ nginx مسیر `/api/` و `/uploads/` را به `http://backend:3000` پراکسی می‌کند.
- در حالت توسعه، پیکربندی مشترک Vite از پورت مختص هر اپ و API target تعریف‌شده در `vite.config.js` استفاده می‌کند.
- نام میزبان `backend` فقط داخل شبکه Docker معتبر است؛ آن را در URL سمت مرورگر hardcode نکنید.
- در production، originهای مجاز باید در `backend/.env` با `ALLOWED_ORIGINS` هماهنگ باشند.

## احراز هویت و مجوز

دامنه دسترسی با `AccessProfile.type` مشخص می‌شود: STAFF، COMPANY یا CUSTOMER. نقش‌ها و permissionها دسترسی عملیاتی را کنترل می‌کنند. Router guardهای فرانت‌اند برای UX هستند؛ backend باید تمام مجوزها و مالکیت منابع را دوباره بررسی کند. به role name به‌تنهایی به‌عنوان مرز امنیتی اعتماد نکنید.

## دستورات توسعه

```bash
pnpm install --frozen-lockfile
pnpm dev:website
pnpm dev:company
pnpm dev:admin
pnpm dev:all
```

## تست و build

```bash
pnpm test
pnpm test:shared-ui
pnpm test:shared-core
pnpm test:api-client
pnpm test:auth
pnpm build
```

برای تست‌های مخصوص اپ‌ها، script همان `apps/*/package.json` را بررسی کنید. موفقیت build به‌تنهایی معادل تست مرورگر یا صحت اتصال runtime نیست.

## تست‌های مرورگر

گردش‌های اصلی موردنیاز برای E2E: بارگذاری هر سه SPA، ورود/خروج، حفاظت مسیرها، مشاهده/ویرایش محصول بر اساس مجوز، استعلام و پاسخ، اعلان و شمارنده، و جزئیات محصول/تاریخچه قیمت. تست‌ها نباید به سرویس SMTP واقعی یا داده production وابسته باشند؛ برای هر تست از محیط و حساب آزمایشی ایزوله استفاده کنید.
