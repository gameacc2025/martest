# مستندات کامل پروژه Telecom Marketplace

## معرفی
خوش آمدید به مستندات کامل پروژه **Telecom Marketplace** - یک بازارگاه آنلاین برای تجهیزات مخابراتی. این پروژه یک سیستم کامل با معماری مدرن شامل backend، frontend، پایگاه داده و Docker میباشد.

---

## ساختار مستندات

```
docs/
├── README.md                    # این فایل - راهنمای اصلی
├── API_DOCUMENTATION.md        # مستندات کامل API
├── DATABASE_DOCUMENTATION.md   # مستندات پایگاه داده و Prisma Schema
├── FRONTEND_DOCUMENTATION.md   # مستندات frontend و کامپوننتها
└── DOCKER_DEPLOYMENT.md        # مستندات Docker و Deployment
```

---

## راهنمای مطالعه

### 1. برای توسعهدهندگان Backend
1. **API_DOCUMENTATION.md** - شروع با APIها و معماری backend
2. **DATABASE_DOCUMENTATION.md** - بررسی ساختار پایگاه داده
3. **DOCKER_DEPLOYMENT.md** - راهاندازی محیط توسعه

### 2. برای توسعهدهندگان Frontend
1. **FRONTEND_DOCUMENTATION.md** - بررسی کامپوننتها و صفحات
2. **API_DOCUMENTATION.md** - آشنایی با APIهای مورد استفاده
3. **DOCKER_DEPLOYMENT.md** - راهاندازی محیط توسعه

### 3. برای DevOps
1. **DOCKER_DEPLOYMENT.md** - راهاندازی در production
2. **DATABASE_DOCUMENTATION.md** - مدیریت پایگاه داده
3. **API_DOCUMENTATION.md** - درک معماری سیستم

---

## خلاصه پروژه

### معماری کلی
```
┌─────────────────────────────────────────────────────────────┐
│                        Telecom Marketplace                      │
├─────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐   │
│  │  PostgreSQL  │    │   Backend   │    │    Frontend      │   │
│  │  (Prisma)    │◄───►│  (Fastify)  │◄───►│   (Next.js)      │   │
│  └─────────────┘    └─────────────┘    └─────────────────┘   │
│       ▲                  ▲ 3000              ▲ 3001            │
│       │                  │                  │                  │
│   5432 │              3000 │              3001 │                  │
└───────┼──────────────────┼──────────────────┼──────────────────┘
        │                  │                  │
    Docker Network: telecom_net
```

### فناوریهای استفاده شده
| بخش | فناوری | نسخه | توضیح |
|------|---------|-------|--------|
| **Backend** | Fastify | 4.x | فریمورک وب سریع و کارآمد |
| **Frontend** | Next.js | 14.x | فریمورک React با App Router |
| **Database** | PostgreSQL | 16 | پایگاه داده رابطه‌ای |
| **ORM** | Prisma | 5.x | ORM مدرن برای Node.js |
| **Styling** | Tailwind CSS | 3.x | فریمورک CSS Utility-first |
| **Authentication** | JWT | - | توکنهای وب JSON |
| **RBAC** | Custom | - | سیستم مدیریت دسترسی بر اساس نقش |
| **Containerization** | Docker | 20.x | کانتینریزه کردن اپلیکیشن |
| **Orchestration** | Docker Compose | 2.x | مدیریت کانتینرها |

---

## ویژگیهای اصلی پروژه

### 1. سیستم احراز هویت و مجوزها (RBAC)
- **JWT Authentication**: سیستم ورود با توکنهای دسترسی و تازهسازی
- **Role-Based Access Control**: مدیریت دسترسی بر اساس نقش
- **Dynamic Permissions**: مجوزهای پویا که در پایگاه داده ذخیره میشوند
- **Multi-device Support**: پشتیبانی از چندین دستگاه برای هر کاربر

### 2. مدیریت کاربران
- ثبت نام و ورود کاربران
- مدیریت پروفایل کاربران
- تغییر رمز عبور
- مدیریت نقشها و مجوزهای کاربران

### 3. مدیریت شرکتها
- ایجاد و مدیریت شرکتها
- انواع مختلف شرکت (تولید کننده، وارد کننده، اپراتور مخابراتی)
- تخصیص کاربران به شرکتها

### 4. مدیریت محصولات
- ایجاد و ویرایش محصولات
- دستهبندی محصولات (ساختار درختی)
- مشخصات فنی پویا (JSON)
- مدیریت قیمتها و تاریخچه قیمت
- آپلود تصاویر و مستندات

### 5. ویژگیهای امنیتی
- هش کردن رمزهای عبور با bcrypt
- هش کردن توکنهای تازهسازی با SHA-256
- بررسی مجوزها در سطح API
- فیلتر کردن دادهها بر اساس شرکت کاربر

### 6. ویژگیهای Docker
- محیطهای توسعه و production جداگانه
- Hot reload در توسعه
- مدیریت خودکار وابستگیها
- شبکهبندی بین کانتینرها

---

## راهاندازی سریع

### پیشنیازها
- Docker Desktop (ویندوز/مک) یا Docker Engine (لینوکس)
- Git
- حداقل 4GB RAM و 2 CPU Core

### گام به گام

1. **کلون کردن پروژه**
```bash
git clone <repo-url>
cd telecom-marketplace
```

2. **ایجاد فایلهای محیطی**
```bash
# ویندوز
copy backend\.env.example backend\.env
copy frontend\.env.local.example frontend\.env.local
copy .env.example .env

# لینوکس/مک
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
cp .env.example .env
```

3. **تنظیم متغیرهای محیطی**
- در `backend/.env`:
  - `JWT_SECRET` را به یک کلید مخفی و قوی تغییر دهید
  - `DATABASE_URL` را بررسی کنید
- در `frontend/.env.local`:
  - `NEXT_PUBLIC_API_URL` را بررسی کنید

4. **راهاندازی در محیط توسعه**
```bash
docker compose -f docker-compose.dev.yml up -d
```

5. **اجرای Migrationهای پایگاه داده**
```bash
docker exec telecom_backend_dev npx prisma migrate dev
```

6. **Seed کردن دادههای اولیه**
```bash
docker exec telecom_backend_dev node prisma/seed.js
```

7. **دسترسی به اپلیکیشن**
- **سایت عمومی**: http://localhost:3001
- **داشبورد**: http://localhost:3001/dashboard
- **API**: http://localhost:3000/api

---
## ساختار پروژه

### Backend (`backend/`)
```
backend/
├── src/
│   ├── app.js                  # تنظیمات اصلی Fastify
│   ├── server.js              # سرور HTTP
│   ├── config/
│   │   ├── db.js              # تنظیمات Prisma
│   │   └── env.js             # متغیرهای محیطی
│   ├── middlewares/
│   │   └── rbac.js            # Middleware بررسی مجوزها
│   ├── modules/
│   │   ├── auth/              # ماژول احراز هویت
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.schemas.js
│   │   │   └── auth.service.js
│   │   ├── users/             # ماژول کاربران
│   │   ├── roles/             # ماژول نقشها و مجوزها
│   │   ├── companies/         # ماژول شرکتها
│   │   ├── categories/        # ماژول دستهبندیها
│   │   └── products/          # ماژول محصولات
│   ├── plugins/
│   │   ├── auth.plugin.js     # Plugin احراز هویت JWT
│   │   └── error-handler.plugin.js
│   └── utils/
│       ├── password.js        # توابع رمزنگاری
│       ├── token.js           # توابع مدیریت توکن
│       ├── rbac.js            # توابع RBAC
│       └── pagination.js      # توابع صفحهبندی
├── prisma/
│   ├── schema.prisma          # Schema پایگاه داده
│   └── seed.js                # اسکریپت seed کردن دادهها
├── package.json
├── Dockerfile
├── Dockerfile.dev
└── .env.example
```

### Frontend (`frontend/`)
```
frontend/
├── app/
│   ├── globals.css            # استایلهای جهانی
│   ├── layout.js             # Layout اصلی
│   ├── page.js               # صفحه اصلی
│   ├── login/
│   │   └── page.js           # صفحه ورود
│   ├── companies/
│   │   └── [id]/
│   │       └── page.js       # صفحه جزئیات شرکت
│   └── dashboard/
│       ├── layout.js         # Layout داشبورد
│       ├── page.js           # صفحه اصلی داشبورد
│       ├── categories/
│       │   └── page.js       # مدیریت دستهبندیها
│       ├── companies/
│       │   └── page.js       # مدیریت شرکتها
│       ├── products/
│       │   └── page.js       # مدیریت محصولات
│       └── users/
│           └── page.js       # مدیریت کاربران
├── components/
│   ├── DynamicSpecsForm.js   # فرم مشخصات فنی پویا
│   ├── Navbar.js             # نوار ناوبری
│   ├── Pagination.js         # صفحهبندی
│   ├── ProductCard.js        # کارت محصول
│   ├── ProductFilters.js     # فیلترهای محصول
│   ├── ProductForm.js        # فرم محصول
│   ├── Sidebar.js            # منوی جانبی
│   ├── Table.js              # جدول عمومی
│   └── ui/                   # کامپوننتهای UI پایه
│       ├── Badge.js
│       ├── Button.js
│       ├── Card.js
│       └── Input.js
├── context/
│   └── AuthContext.js        # Context احراز هویت
├── lib/
│   ├── api.js                # توابع API
│   └── auth.js               # توابع احراز هویت
├── public/                   # فایلهای استاتیک
├── package.json
├── tailwind.config.js        # تنظیمات Tailwind
├── next.config.js           # تنظیمات Next.js
├── Dockerfile
├── Dockerfile.dev
└── .env.local.example
```

### Docker
```
.
├── docker-compose.yml        # تنظیمات Production
├── docker-compose.dev.yml    # تنظیمات Development
└── .env.example              # متغیرهای محیطی Docker
```

---
## نقشه API

### Auth
| Method | Endpoint | توضیح | احراز هویت |
|--------|----------|--------|-------------|
| POST | `/api/auth/login` | ورود به سیستم | ❌ |
| POST | `/api/auth/refresh` | تازهسازی توکن | ✅ (Cookie) |
| POST | `/api/auth/logout` | خروج از سیستم | ✅ (Cookie) |
| POST | `/api/auth/logout-all` | خروج از تمام دستگاهها | ✅ (Bearer) |
| GET | `/api/auth/me` | پروفایل کاربر | ✅ (Bearer) |
| PATCH | `/api/auth/change-password` | تغییر رمز عبور | ✅ (Bearer) |
| PATCH | `/api/auth/users/:id/password` | ریست رمز کاربر | ✅ (Bearer) |

### Users
| Method | Endpoint | توضیح | مجوز مورد نیاز |
|--------|----------|--------|----------------|
| GET | `/api/users` | لیست کاربران | `users.read` |
| POST | `/api/users` | ایجاد کاربر | `users.create` |
| GET | `/api/users/:id` | جزئیات کاربر | `users.read` |
| PATCH | `/api/users/:id` | ویرایش کاربر | `users.update` |
| PATCH | `/api/users/:id/access` | تنظیم دسترسی | `users.assign_roles` |
| DELETE | `/api/users/:id` | حذف کاربر | `users.delete` |

### Roles & Permissions
| Method | Endpoint | توضیح | مجوز مورد نیاز |
|--------|----------|--------|----------------|
| GET | `/api/roles` | لیست نقشها | `roles.read` |
| POST | `/api/roles` | ایجاد نقش | `roles.create` |
| GET | `/api/roles/:id` | جزئیات نقش | `roles.read` |
| PATCH | `/api/roles/:id` | ویرایش نقش | `roles.update` |
| DELETE | `/api/roles/:id` | حذف نقش | `roles.delete` |
| GET | `/api/roles/permissions` | لیست مجوزها | `permissions.read` |
| POST | `/api/roles/permissions` | ایجاد مجوز | `permissions.assign` |
| PATCH | `/api/roles/permissions/:id` | ویرایش مجوز | `permissions.assign` |
| DELETE | `/api/roles/permissions/:id` | حذف مجوز | `permissions.assign` |

### Companies
| Method | Endpoint | توضیح | مجوز مورد نیاز |
|--------|----------|--------|----------------|
| GET | `/api/companies` | لیست شرکتها | `companies.read` |
| POST | `/api/companies` | ایجاد شرکت | `companies.create` |
| GET | `/api/companies/:id` | جزئیات شرکت | `companies.read` |
| PATCH | `/api/companies/:id` | ویرایش شرکت | `companies.update` |
| DELETE | `/api/companies/:id` | حذف شرکت | `companies.delete` |

### Categories
| Method | Endpoint | توضیح | مجوز مورد نیاز |
|--------|----------|--------|----------------|
| GET | `/api/categories` | لیست دستهبندیها | `categories.read` |
| POST | `/api/categories` | ایجاد دستهبندی | `categories.create` |
| GET | `/api/categories/:id` | جزئیات دستهبندی | `categories.read` |
| PATCH | `/api/categories/:id` | ویرایش دستهبندی | `categories.update` |
| DELETE | `/api/categories/:id` | حذف دستهبندی | `categories.delete` |

### Products
| Method | Endpoint | توضیح | مجوز مورد نیاز |
|--------|----------|--------|----------------|
| GET | `/api/products` | لیست محصولات | `products.read` |
| POST | `/api/products` | ایجاد محصول | `products.create` |
| GET | `/api/products/:id` | جزئیات محصول | `products.read` |
| PATCH | `/api/products/:id` | ویرایش محصول | `products.update` |
| DELETE | `/api/products/:id` | حذف محصول | `products.delete` |

---
## نقشه پایگاه داده

### مدلهای RBAC
- **Role**: نقشهای کاربران (سیستمی و سفارشی)
- **Permission**: مجوزهای دسترسی
- **RolePermission**: ارتباط بین نقش و مجوز
- **UserRole**: ارتباط بین کاربر و نقش
- **UserPermission**: مجوزهای مستقیم کاربر
- **RefreshToken**: توکنهای تازهسازی

### مدلهای کسب و کار
- **User**: کاربران سیستم
- **Company**: شرکتها
- **Category**: دستهبندی محصولات (ساختار درختی)
- **Product**: محصولات
- **ProductPrice**: قیمتها و تاریخچه قیمت
- **ProductImage**: تصاویر و مستندات محصولات

---
## نقشه کامپوننتهای Frontend

### صفحات اصلی
- `/` - صفحه اصلی (لیست محصولات)
- `/login` - صفحه ورود
- `/companies/[id]` - صفحه جزئیات شرکت

### صفحات داشبورد
- `/dashboard` - صفحه اصلی داشبورد
- `/dashboard/users` - مدیریت کاربران
- `/dashboard/roles` - مدیریت نقشها
- `/dashboard/companies` - مدیریت شرکتها
- `/dashboard/categories` - مدیریت دستهبندیها
- `/dashboard/products` - مدیریت محصولات

### کامپوننتهای عمومی
- `Navbar` - نوار ناوبری
- `Sidebar` - منوی جانبی داشبورد
- `ProductCard` - کارت محصول
- `ProductFilters` - فیلترهای محصول
- `Pagination` - صفحهبندی
- `Table` - جدول عمومی
- `ProductForm` - فرم محصول
- `DynamicSpecsForm` - فرم مشخصات فنی پویا

### کامپوننتهای UI
- `Button` - دکمه پایه
- `Input` - فیلد ورودی
- `Card` - کارت پایه
- `Badge` - نشان

---
## بهترین شیوهها

### Backend
1. همیشه از try/catch برای مدیریت خطاها استفاده کنید
2. اعتبارسنجی ورودیها را انجام دهید
3. از middlewareها برای بررسی مجوزها استفاده کنید
4. لاگهای مناسب را ثبت کنید
5. از transactionها برای عملیات چندگانه استفاده کنید

### Frontend
1. از React Hook Form برای فرمها استفاده کنید
2. stateهای جهانی را در Context مدیریت کنید
3. از Tailwind CSS برای استایلدهی استفاده کنید
4. کامپوننتها را کوچک و قابل استفاده مجدد نگه دارید
5. همیشه بررسی احراز هویت را انجام دهید

### Database
1. از Migrationها برای تغییرات schema استفاده کنید
2. قبل از اعمال Migrationها، Backup بگیرید
3. از ایندکسها برای بهینهسازی پرس و جوها استفاده کنید
4. از transactionها برای عملیات وابسته استفاده کنید

### Docker
1. از Dockerfiles چند مرحله‌ای استفاده کنید
2. از کاربر غیر root در کانتینرها استفاده کنید
3. از healthcheck برای سرویسهای حیاتی استفاده کنید
4. از volumes برای دادههای دائمی استفاده کنید

---
## عیبیابی

### مشکلات رایج Backend
1. **اتصال به پایگاه داده شکست میخورد**
   - `DATABASE_URL` را بررسی کنید
   - مطمئن شوید پایگاه داده در حال اجرا است

2. **JWT Validation Failed**
   - `JWT_SECRET` را بررسی کنید
   - مطمئن شوید توکن منقضی نشده است

3. **Permission Denied**
   - مجوزهای کاربر را بررسی کنید
   - مطمئن شوید کاربر نقش مناسب دارد

### مشکلات رایج Frontend
1. **CORS Error**
   - مطمئن شوید backend CORS را تنظیم کرده است
   - `NEXT_PUBLIC_API_URL` را بررسی کنید

2. **Token Expiration**
   - از interceptor برای تازهسازی خودکار توکن استفاده کنید
   - کاربر را به صفحه ورود هدایت کنید

3. **Hydration Mismatch**
   - از `useEffect` برای کدهای سمت کلاینت استفاده کنید
   - از `suppressHydrationWarning` برای موارد خاص استفاده کنید

### مشکلات رایج Docker
1. **کانتینرها شروع نمیشوند**
   - لاگها را بررسی کنید: `docker logs <container>`
   - پورتهای در حال استفاده را بررسی کنید

2. **Hot reload کار نمیکند**
   - volumes را بررسی کنید
   - کانتینرها را restart کنید

3. **حافظه کافی نیست**
   - حافظه Docker را افزایش دهید
   - از swap استفاده کنید

---
## منابع یادگیری

### مستندات رسمی
- [Fastify Documentation](https://www.fastify.io/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### آموزشها
- [Fastify Crash Course](https://www.youtube.com/watch?v=7TJ8QWcXQs0)
- [Next.js Tutorial](https://nextjs.org/learn)
- [Prisma Crash Course](https://www.youtube.com/watch?v=589x5jQ6X24)
- [Docker for Beginners](https://docker-curriculum.com/)

---
## مشارکت در پروژه

### گزارش باگ
1. در بخش Issues یک issue جدید ایجاد کنید
2. عنوان واضحی برای issue انتخاب کنید
3. مراحل تکرار باگ را شرح دهید
4. اطلاعات محیط را ارائه دهید (نسخه Node.js, Docker, OS)
5. لاگهای مربوطه را ضمیمه کنید

### درخواست ویژگی جدید
1. در بخش Issues یک issue جدید ایجاد کنید
2. عنوان واضحی برای ویژگی انتخاب کنید
3. توضیح کامل از ویژگی مورد نظر ارائه دهید
4. موارد استفاده (use cases) را شرح دهید
5. اگر ممکن است، طرحی برای پیادهسازی ارائه دهید

### Pull Request
1. از branch اصلی fork کنید
2. یک branch جدید برای ویژگی/باگ ایجاد کنید
3. تغییرات خود را commit کنید
4. Pull Request ایجاد کنید
5. به بحثها و درخواستهای بررسی پاسخ دهید

---
## مجوز (License)
این پروژه تحت مجوز MIT منتشر شده است. برای اطلاعات بیشتر، فایل LICENSE را بررسی کنید.

---
## تماس با ما
برای سوالات و پیشنهادات، میتوانید از طریق راههای زیر با ما تماس بگیرید:

- **ایمیل**: support@telecom-marketplace.com
- **وبسایت**: https://telecom-marketplace.com
- **GitHub**: https://github.com/your-org/telecom-marketplace

---
## تغییرات اخیر

### نسخه 1.0.0 (تاریخ انتشار: 2024-07-01)
- انتشار نسخه اولیه
- پیادهسازی سیستم احراز هویت
- پیادهسازی RBAC
- پیادهسازی مدیریت کاربران
- پیادهسازی مدیریت شرکتها
- پیادهسازی مدیریت دستهبندیها
- پیادهسازی مدیریت محصولات
- مستندسازی کامل پروژه

---
**توجه**: این مستندات به طور منظم به روز میشوند. برای دریافت آخرین نسخه، به مخزن پروژه مراجعه کنید.