# راهنمای Docker و استقرار — Telecom Marketplace

این راهنما بر اساس `docker-compose.yml` و `backend/Dockerfile` فعلی نوشته شده است. نمونه‌های قدیمی Next.js، مسیر `frontend/`، Node 18 و endpointهای `/api` دیگر معتبر نیستند.

## معماری فعلی

فایل production Compose این سرویس‌ها را تعریف می‌کند:

| سرویس | مسیر build | پورت میزبان → کانتینر |
|---|---|---|
| PostgreSQL | `postgres:18.4-bookworm` | فقط شبکه داخلی Compose؛ پورت عمومی میزبان منتشر نمی‌شود |
| Backend / Fastify | `backend/Dockerfile` | `3000 → 3000` |
| Website / Vue + Vite | `apps/website/Dockerfile` | `3001 → 80` |
| Company Portal | `apps/company/Dockerfile` | `3002 → 80` |
| Admin Portal | `apps/admin/Dockerfile` | `3003 → 80` |

سرویس‌ها در شبکه bridge با نام `telecom_net` قرار می‌گیرند. حجم PostgreSQL مطابق image فعلی روی `/var/lib/postgresql` mount می‌شود؛ آن را به مسیر داده imageهای قدیمی تغییر ندهید، مگر نسخه image و راهنمای رسمی آن نیز تغییر کند.

## پیش‌نیازها و secrets

- Docker Engine/Desktop و Docker Compose plugin
- دسترسی به مخزن و فضای کافی برای build چهار image
- مقدار امن `POSTGRES_PASSWORD` در فایل محیطی ریشه؛ Compose در صورت نبودن آن باید fail شود و نباید از رمز پیش‌فرض ناامن استفاده کند.
- فایل `backend/.env` با تنظیمات محیطی لازم بک‌اند، از جمله secrets احراز هویت و providerهایی که قرار است فعال باشند.

هرگز فایل‌های `.env`، رمزها، tokenها یا credentialهای واقعی را commit نکنید. مقادیر مورد نیاز را از فایل‌های `.env.example` و تنظیمات محیط خود بررسی کنید؛ این سند عمداً مقدار واقعی secret را درج نمی‌کند.

## اعتبارسنجی پیش از اجرا

ابتدا تنظیمات Compose را بدون راه‌اندازی سرویس‌ها بررسی کنید:

```bash
docker compose config
```

اگر فایل‌های محیطی لازم تنظیم شده‌اند، سرویس‌ها را build و اجرا کنید:

```bash
docker compose up -d --build
docker compose ps
docker compose logs --tail=200 postgres
docker compose logs --tail=200 backend
```

Backend در Dockerfile فعلی دستورهای `prisma migrate deploy` و سپس `node prisma/seed.js` را قبل از شروع سرور اجرا می‌کند. بنابراین قبل از اجرای آن در محیط واقعی، مقصد دیتابیس، backup و برنامه بازگشت را بررسی کنید. اجرای seed فقط به‌دلیل idempotent بودن برخی عملیات، جایگزین backup نیست.

## URLهای پیش‌فرض میزبان

- Website: `http://localhost:3001`
- Company Portal: `http://localhost:3002`
- Admin Portal: `http://localhost:3003`
- Backend: `http://localhost:3000`
- API prefix: `/api/v1`

وجود پورت به‌تنهایی اثبات سلامت برنامه نیست. مسیرهای health و API واقعی را با routeهای ثبت‌شده در نسخه فعلی بررسی کنید.

## عیب‌یابی

```bash
docker compose ps
docker compose logs --tail=200 backend
docker compose logs --tail=200 company
docker compose exec postgres pg_isready
```

اگر backend بالا نمی‌آید:
1. مقدارهای اتصال دیتابیس و `POSTGRES_PASSWORD` را بررسی کنید.
2. مطمئن شوید migrationها در لاگ‌ها با موفقیت اجرا شده‌اند.
3. خطاهای Prisma Client و متغیرهای محیطی را بررسی کنید؛ secretها را در گزارش عمومی کپی نکنید.

اگر frontend به API دسترسی ندارد، تنظیمات proxy در Dockerfile/nginx هر برنامه را با API prefix `/api/v1` و شبکه Compose تطبیق دهید.

## وضعیت اعتبارسنجی

تست‌های CI و تولید Prisma Client به‌تنهایی اثبات نمی‌کنند که Docker imageها build شده‌اند، Compose در محیط واقعی بالا می‌آید، migrationها روی دیتابیس عملیاتی موفق‌اند یا مسیرهای مرورگر کار می‌کنند. این موارد را فقط پس از مشاهده اجرای واقعی و ثبت نتیجه می‌توان PASS دانست.
