# Telecom Marketplace

مارکت‌پلیس تجهیزات مخابراتی — ساختار کامل با Docker

## پیش‌نیاز

- Docker Desktop (ویندوز/مک) یا Docker Engine (لینوکس)
- Git

## راه‌اندازی سریع

```bash
# ۱. کلون پروژه
git clone <repo-url>
cd telecom-marketplace

# ۲. ساخت فایل‌های env
copy backend\.env.example backend\.env          # ویندوز
copy frontend\.env.local.example frontend\.env.local

# ۳. اجرا در حالت توسعه (hot reload)
docker compose -f docker-compose.dev.yml up

# ۴. اجرای migration دیتابیس (دفعه اول)
docker exec telecom_backend_dev npx prisma migrate dev

# ۵. seed داده‌های اولیه
docker exec telecom_backend_dev node prisma/seed.js
```

## آدرس‌ها

| سرویس    | آدرس                     |
|----------|--------------------------|
| سایت عمومی | http://localhost:3001   |
| داشبورد  | http://localhost:3001/dashboard |
| API      | http://localhost:3000/api |
| Swagger (بعداً) | http://localhost:3000/docs |

## دستورات مفید

```bash
# مشاهده لاگ‌ها
docker compose -f docker-compose.dev.yml logs -f

# فقط لاگ بک‌اند
docker compose -f docker-compose.dev.yml logs -f backend

# اجرای migration
docker exec telecom_backend_dev npx prisma migrate dev

# باز کردن Prisma Studio (مرورگر دیتابیس)
docker exec -it telecom_backend_dev npx prisma studio

# اجرای production
docker compose up -d --build
```

## ساختار پروژه

```
telecom-marketplace/
├── docker-compose.yml          ← production
├── docker-compose.dev.yml      ← development (hot reload)
├── backend/                    ← Fastify API
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   ├── prisma/schema.prisma
│   └── src/
│       ├── modules/auth/
│       ├── modules/products/
│       ├── modules/companies/
│       ├── modules/categories/
│       └── modules/users/
├── apps/                        ← Frontend applications
│   ├── website/                 ← Public marketplace
│   ├── company/                 ← Company portal
│   └── admin/                   ← Admin portal
└── packages/                    ← Shared packages
    ├── shared-ui/               ← Components, theme, SCSS
    ├── shared-core/             ← Auth, HTTP, API layer
    └── vite-config/             ← Shared Vite configuration
```
