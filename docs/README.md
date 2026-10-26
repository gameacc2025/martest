# مستندات پروژه Telecom Marketplace

این مخزن یک monorepo برای بازارگاه B2B تجهیزات مخابراتی است؛ شامل سه اپ Vue/Vite، یک API مبتنی بر Fastify، PostgreSQL/Prisma و packageهای مشترک.

## مستندات مرجع

| سند | برای چه کاری |
|---|---|
| [API_DOCUMENTATION.md](API_DOCUMENTATION.md) | پایه API، گروه مسیرها و قراردادهای جاری |
| [DATABASE_DOCUMENTATION.md](DATABASE_DOCUMENTATION.md) | مدل‌های Prisma، تاریخچه قیمت و migrations |
| [FRONTEND_DOCUMENTATION.md](FRONTEND_DOCUMENTATION.md) | ساختار سه پنل و packageهای workspace |
| [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) | Compose، env، پورت‌ها و بررسی سلامت |
| [role-access-matrix.md](role-access-matrix.md) | دامنه‌های STAFF/COMPANY/CUSTOMER و RBAC |
| [architecture/README.md](architecture/README.md) | مرجع گراف و روش بازسازی/اعتبارسنجی |
| [NOTIFICATION_SYSTEM.md](NOTIFICATION_SYSTEM.md) | قرارداد سیستم اعلان‌ها |
| [AI_AGENT_WORKFLOW.md](AI_AGENT_WORKFLOW.md) | روال همکاری و تحویل کار |

## ساختار جاری

- `apps/website`: سایت عمومی و تجربه CUSTOMER
- `apps/company`: پنل شرکت
- `apps/admin`: پنل STAFF
- `packages/`: API client، auth، permissions، shared core/UI و Vite config
- `backend/`: Fastify API، Prisma schema، migrations و seed
- `docker-compose.yml`: PostgreSQL، backend و سه پنل
- `docs/architecture/DEPENDENCY_GRAPH.generated.mmd`: گراف تولیدشده

## نسخه‌ها و endpointهای محلی

- Node.js: 22 (Docker backend image: `node:22-bookworm-slim`)
- pnpm: 9.0.0
- API prefix: `/api/v1`
- Backend: `http://localhost:3000`
- Website: `http://localhost:3001`
- Company: `http://localhost:3002`
- Admin: `http://localhost:3003`
- PostgreSQL در Compose روی host منتشر نمی‌شود.

## دستورات اصلی

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm build
npm ci --prefix backend
pnpm --dir backend test
node scripts/generate-architecture-graph.mjs --check
docker compose config
docker compose up -d --build
```

## قانون مرجعیت

مستندات خلاصه‌ای از کد هستند. در صورت اختلاف، برای مسیر API به `backend/src/app.js` و route/schemaهای مربوط، برای مدل‌ها به `backend/prisma/schema.prisma` و migrations، برای پورت‌ها به `docker-compose.yml` و برای نسخه دقیق وابستگی‌ها به package manifests و lockfile رجوع کنید. هیچ تست runtime، SMTP یا browser را بدون اجرای واقعی موفق تلقی نکنید.
