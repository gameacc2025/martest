# مستندات پروژه Telecom Marketplace

این مخزن یک monorepo مبتنی بر pnpm است که شامل سه برنامه Vue 3/Vite، یک API مبتنی بر Fastify، بسته‌های مشترک و PostgreSQL است. این صفحه فهرست مستندات را معرفی می‌کند؛ در صورت اختلاف، کد، manifestها، Prisma schema و فایل‌های Compose مرجع نهایی‌اند.

## نقشه مستندات

| سند | موضوع |
|---|---|
| [API_DOCUMENTATION.md](API_DOCUMENTATION.md) | قرارداد API و مسیرهای `/api/v1`؛ هر endpoint باید با route/schema فعلی تطبیق داده شود |
| [DATABASE_DOCUMENTATION.md](DATABASE_DOCUMENTATION.md) | مدل‌های Prisma، ارتباط‌ها و migrationها |
| [FRONTEND_DOCUMENTATION.md](FRONTEND_DOCUMENTATION.md) | سه برنامه frontend، routerها، state و دسترسی به API |
| [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) | اجرای Docker Compose و سرویس‌های production |
| [NOTIFICATION_SYSTEM.md](NOTIFICATION_SYSTEM.md) | اعلان‌ها، inbox، صف ارسال و تنظیمات SMTP/SMS |
| [role-access-matrix.md](role-access-matrix.md) | مرزهای CUSTOMER / COMPANY / STAFF و کنترل‌های دسترسی |
| [REPOSITORY_QUALITY_AUDIT_2026-10-26.md](REPOSITORY_QUALITY_AUDIT_2026-10-26.md) | یافته‌های کیفیت، محدودیت‌های اعتبارسنجی و کارهای باقی‌مانده |
| [AI_AGENT_WORKFLOW.md](AI_AGENT_WORKFLOW.md) | گردش‌کار عامل‌های توسعه |

## ساختار فعلی مخزن

- `apps/website` — وب‌سایت عمومی بازارگاه و تجربه CUSTOMER
- `apps/company` — پنل شرکت و تجربه COMPANY
- `apps/admin` — پنل مدیریت و تجربه STAFF
- `backend` — Fastify، Prisma و API
- `packages` — بسته‌های مشترک auth، API client، core، permissions و UI
- `docker-compose.yml` — استقرار چندسرویسی production
- `docker-compose.dev.yml` — محیط توسعه، در صورت استفاده از Docker
- `pnpm-workspace.yaml` — تعریف workspace

## فناوری‌های فعلی

| بخش | فناوری |
|---|---|
| Frontend | Vue 3، Vite، Vue Router، Pinia در بخش‌های مورد استفاده |
| UI | PrimeVue و بسته‌های مشترک UI |
| Backend | Node.js 22، Fastify 4 |
| Database/ORM | PostgreSQL و Prisma 6 |
| Workspace | pnpm 9 |
| API prefix | `/api/v1` |

## دستورات متداول

از ریشه مخزن و پس از نصب وابستگی‌ها:

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm build
```

تست بک‌اند:

```bash
npm ci --prefix backend
pnpm --dir backend test
```

اجرای production با Docker Compose:

```bash
docker compose config
docker compose up -d --build
docker compose ps
docker compose logs --tail=200 backend
```

برای جزئیات متغیرهای محیطی و محدودیت‌های اجرای واقعی، به [راهنمای Docker](DOCKER_DEPLOYMENT.md) مراجعه کنید. قبل از اجرای migration یا seed روی محیط واقعی، backup، مقصد دیتابیس و تنظیمات secrets را بررسی کنید.

## اصول مهم معماری

- `AccessProfile.type` زمینه دسترسی برنامه را مشخص می‌کند: `CUSTOMER`، `COMPANY` یا `STAFF`. نقش‌ها به‌تنهایی نباید جایگزین بررسی زمینه و مالکیت شوند.
- کنترل دسترسی و مالکیت داده باید در بک‌اند enforce شود؛ مخفی‌کردن کنترل در UI به‌تنهایی امنیت ایجاد نمی‌کند.
- وضعیت سبز CI به‌تنهایی اثبات‌کننده ارسال واقعی ایمیل/SMS، پرداخت واقعی، اجرای production یا تست بصری مرورگر نیست.
- تاریخچه قیمت باید از snapshotهای ذخیره‌شده خوانده شود؛ داده تاریخی موجودنبوده را نباید ساختگی نمایش داد.
- در صورت تغییر قرارداد API، مدل دیتابیس یا رفتار مجوزها، سند متناظر و تست رگرسیون نیز باید به‌روز شود.
