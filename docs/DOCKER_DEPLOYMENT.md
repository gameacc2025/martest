# راهنمای Docker و استقرار

## معماری واقعی Compose

فایل مرجع: `docker-compose.yml`. Compose فعلی پنج سرویس دارد:

| سرویس | image/build | پورت داخلی | پورت میزبان |
|---|---|---:|---:|
| postgres | `postgres:18.4-bookworm` | 5432 | منتشر نمی‌شود |
| backend | `backend/Dockerfile` | 3000 | 3000 |
| website | `apps/website/Dockerfile` + nginx | 80 | 3001 |
| company | `apps/company/Dockerfile` + nginx | 80 | 3002 |
| admin | `apps/admin/Dockerfile` + nginx | 80 | 3003 |

تمام سرویس‌ها در شبکه bridge `telecom_net` قرار می‌گیرند. دیتابیس عمداً به host منتشر نمی‌شود. برای دسترسی تشخیصی از `docker compose exec postgres psql ...` استفاده کنید.

## پیش‌نیاز و نسخه‌ها

- Docker Engine/Desktop با Docker Compose plugin v2
- Node.js 22 برای اجرای محلی backend/buildهای جاری
- pnpm 9 برای workspace فرانت‌اند
- PostgreSQL؛ image Compose فعلی PostgreSQL 18.4
- نسخه دقیق کتابخانه‌ها از lockfile و manifestها خوانده می‌شود.

## تنظیم محیط

1. فایل ریشه `.env.example` را به `.env` کپی کنید و مقدار امن `POSTGRES_PASSWORD` را تنظیم کنید.
2. `backend/.env.example` را به `backend/.env` کپی کنید.
3. `JWT_ACCESS_SECRET` و `JWT_REFRESH_SECRET` را با secret تصادفی مستقل و طولانی جایگزین کنید.
4. `ALLOWED_ORIGINS` را مطابق دامنه‌های واقعی سه پنل تنظیم کنید.
5. `VITE_WEBSITE_APP_URL`، `VITE_COMPANY_APP_URL` و `VITE_ADMIN_APP_URL` آدرس‌های عمومی‌ای هستند که هنگام build داخل فایل‌های JS قرار می‌گیرند؛ در Compose برای localhost پیکربندی پیش‌فرض دارند. برای دامنه‌های production آن‌ها را در `.env` به origin واقعی پنل‌ها تغییر دهید و imageها را دوباره build کنید.
6. برای ارسال email، تنظیمات SMTP معتبر لازم است. بدون SMTP واقعی، ارسال email خارجی تأییدشده محسوب نمی‌شود.
6. هیچ فایل env حاوی secret را commit نکنید.

> مقدارهای نمونه فقط برای توسعه‌اند. از رمز seed پیش‌فرض و secretهای نمونه در محیط عملیاتی استفاده نکنید.

## راه‌اندازی

```bash
docker compose config
docker compose up -d --build
docker compose ps
docker compose logs -f backend
```

Backend هنگام start دستور `prisma migrate deploy`، سپس `prisma/seed.js` و بعد سرور را اجرا می‌کند. بنابراین شکست migration/seed مانع شروع API می‌شود. قبل از deploy، migrationها و backup دیتابیس را جداگانه بازبینی کنید.

## بررسی سلامت

```bash
curl -i http://localhost:3000/health
curl -i http://localhost:3001/health
curl -i http://localhost:3002/health
curl -i http://localhost:3003/health
```

- Backend: `GET /health` پاسخ JSON وضعیت API می‌دهد.
- هر پنل از nginx پاسخ `200 ok` روی `/health` می‌دهد.
- درخواست API از طریق هر پنل باید از مسیر `/api/v1` عبور کند؛ مثلاً `/api/v1` به‌تنهایی لزوماً endpoint عمومی ندارد. endpoint مشخصی مثل `/api/v1/auth/login` را برای بررسی پراکسی استفاده کنید.
- `/uploads/` نیز از nginx به backend می‌رود.

## عیب‌یابی

- `POSTGRES_PASSWORD must be set`: مقدار ریشه `.env` وجود ندارد یا خالی است.
- خطای `backend/.env`: Compose آن را به‌عنوان env_file می‌خواند؛ فایل را از نمونه بسازید.
- backend بالا نمی‌آید: `docker compose logs backend postgres` و وضعیت migration را بررسی کنید.
- API از یک پنل CORS می‌گیرد: origin دقیق هر سه پنل را در `ALLOWED_ORIGINS` وارد کنید و backend را بازسازی/راه‌اندازی مجدد کنید.
- پورت اشغال است: mappingهای 3000–3003 را بررسی کنید.
- DB host port ندارد: این رفتار عمدی است؛ پورت 5432 را در production منتشر نکنید.

## عملیات معمول

```bash
docker compose restart backend
docker compose logs --tail=200 backend
docker compose down
```

`docker compose down -v` volume دیتابیس را حذف می‌کند؛ فقط در محیط آزمایشی و پس از اطمینان از حذف داده‌ها اجرا شود.

## پشتیبان‌گیری

برای backup/restore از ابزارهای PostgreSQL مانند `pg_dump` و `pg_restore` در محیطی با دسترسی کنترل‌شده استفاده کنید. پیش از migration عملیاتی، backup قابل‌بازیابی تهیه و روش restore را جداگانه آزمایش کنید. اجرای موفق Compose به‌تنهایی اثبات backup قابل‌بازیابی نیست.
