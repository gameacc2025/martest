# مستندات API - Telecom Marketplace

## مقدمه
این مستندات کلیه APIهای موجود در سیستم Telecom Marketplace را پوشش می‌دهد. این سیستم بر پایه معماری Fastify ساخته شده و از سیستم احراز هویت JWT و RBAC برای مدیریت دسترسی‌ها استفاده می‌کند.

---

## جدول محتوا
1. [معماری کلی](#معماری-کلی)
2. [احراز هویت و مجوزها](#احراز-هویت-و-مجوزها)
3. [APIهای Auth (احراز هویت)](#apiهای-auth)
4. [APIهای Users (کاربران)](#apiهای-users)
5. [APIهای Roles & Permissions (نقش‌ها و مجوزها)](#apiهای-roles--permissions)
6. [APIهای Companies (شرکت‌ها)](#apiهای-companies)
7. [APIهای Categories (دسته‌بندی‌ها)](#apiهای-categories)
8. [APIهای Products (محصولات)](#apiهای-products)
9. [کدهای وضعیت و خطاها](#کدهای-وضعیت-و-خطاها)

---

## معماری کلی

### ساختار Base URL
- **Environment Development**: `http://localhost:3000/api`
- **Environment Production**: `https://your-domain.com/api`

### فرمت درخواست‌ها
- **Content-Type**: `application/json`
- **Authentication**: `Bearer <access_token>` در هدر Authorization

### فرمت پاسخ‌ها
```json
{
  "status": "success|error",
  "data": {...},
  "message": "پیام توضیحی",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100
  }
}
```

---

## احراز هویت و مجوزها

### سیستم RBAC
- **نقش‌های سیستمی**:
  - `SUPER_ADMIN`: دسترسی کامل به تمام قسمت‌ها
  - `COMPANY_ADMIN`: مدیریت کاربران و محصولات شرکت خود
  - `BUYER`: مشاهده محصولات و خرید

- **مجوزها**: هر نقش می‌تواند مجوزهای مختلفی داشته باشد
- **مجوزهای کاربر**: کاربر می‌تواند علاوه بر مجوزهای نقش، مجوزهای مستقیم نیز داشته باشد

### توکن‌ها
- **Access Token**: JWT با مدت اعتبار 15 دقیقه
- **Refresh Token**: با مدت اعتبار 7 روز، در کوکی ذخیره می‌شود
- **Payload توکن**:
  ```json
  {
    "sub": "user_id",
    "username": "user_username",
    "roles": ["SUPER_ADMIN"],
    "permissions": ["users.read", "users.create"],
    "companyId": 1
  }
  ```

---

## APIهای Auth

### `POST /api/auth/login`
**توضیح**: ورود به سیستم با شماره تلفن و رمز عبور (تلفن تنها شناسه ورود است)

**Request Body**:
```json
{
  "phone": "string",
  "password": "string"
}
```

**Response**:
```json
{
  "status": "success",
  "data": {
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token",
      "expiresIn": 900
    },
    "user": {
      "id": 1,
      "phone": "09120000000",
      "email": "admin@example.com",
      "status": "ACTIVE"
    },
    "profile": {
      "firstName": "مدیر",
      "lastName": "سیستم"
    },
    "accessProfile": {
      "type": "STAFF",
      "companyId": null,
      "isActive": true
    },
    "roles": ["SUPER_ADMIN"],
    "permissions": ["*"]
  }
}
```

---

### `POST /api/auth/refresh`
**توضیح**: دریافت توکن دسترسی جدید با استفاده از توکن تازه‌سازی

**Headers**:
- `Cookie: refreshToken=<refresh_token>`

**Response**:
```json
{
  "status": "success",
  "data": {
    "accessToken": "new_jwt_token"
  }
}
```

---

### `POST /api/auth/logout`
**توضیح**: خروج از سیستم (حذف توکن تازه‌سازی فعلی)

**Headers**:
- `Cookie: refreshToken=<refresh_token>`

**Response**:
```json
{
  "status": "success",
  "message": "خروج با موفقیت انجام شد"
}
```

---

### `POST /api/auth/logout-all`
**توضیح**: خروج از تمام دستگاه‌ها

**Headers**:
- `Authorization: Bearer <access_token>`

**Response**:
```json
{
  "status": "success",
  "message": "خروج از تمام دستگاه‌ها انجام شد"
}
```

---

### `GET /api/auth/me`
**توضیح**: دریافت پروفایل کاربر فعلی

**Headers**:
- `Authorization: Bearer <access_token>`

**Response**:
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "fullName": "مدیر سیستم",
      "email": "admin@example.com",
      "companyId": null,
      "roles": [...],
      "permissions": [...]
    }
  }
}
```

---

### `PATCH /api/auth/change-password`
**توضیح**: تغییر رمز عبور کاربر فعلی

**Headers**:
- `Authorization: Bearer <access_token>`

**Request Body**:
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

**Response**:
```json
{
  "status": "success",
  "message": "رمز عبور با موفقیت تغییر کرد"
}
```

---

### `PATCH /api/auth/users/:id/password`
**توضیح**: ریست رمز عبور کاربر توسط ادمین

**Headers**:
- `Authorization: Bearer <access_token>`

**Required Permission**: `users.reset_password`

**Request Body**:
```json
{
  "newPassword": "string"
}
```

**Response**:
```json
{
  "status": "success",
  "message": "رمز عبور کاربر با موفقیت ریست شد"
}
```

---

## APIهای Users

### `GET /api/users`
**توضیح**: لیست تمام کاربران

**Headers**:
- `Authorization: Bearer <access_token>`

**Required Permission**: `users.read`

**Query Parameters**:
- `page`: شماره صفحه (default: 1)
- `limit`: تعداد آیتم در هر صفحه (default: 10)
- `search`: جستجو در نام کاربری، ایمیل، نام کامل

**Response**:
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "username": "admin",
      "fullName": "مدیر سیستم",
      "email": "admin@example.com",
      "isActive": true,
      "companyId": null,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100
  }
}
```

---

### `POST /api/users`
**توضیح**: ایجاد کاربر جدید

**Headers**:
- `Authorization: Bearer <access_token>`

**Required Permission**: `users.create`

**Request Body**:
```json
{
  "username": "string",
  "fullName": "string",
  "email": "string",
  "password": "string",
  "companyId": 1,
  "isActive": true
}
```

**Response**:
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "username": "newuser",
    "fullName": "نام کاربر",
    "email": "newuser@example.com",
    "isActive": true,
    "companyId": 1,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### `GET /api/users/:id`
**توضیح**: دریافت اطلاعات کاربر

**Headers**:
- `Authorization: Bearer <access_token>`

**Required Permission**: `users.read`

**Response**:
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "username": "admin",
    "fullName": "مدیر سیستم",
    "email": "admin@example.com",
    "isActive": true,
    "companyId": null,
    "roles": [...],
    "permissions": [...],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### `PATCH /api/users/:id`
**توضیح**: به‌روزرسانی اطلاعات کاربر

**Headers**:
- `Authorization: Bearer <access_token>`

**Required Permission**: `users.update`

**Request Body**:
```json
{
  "fullName": "string",
  "email": "string",
  "isActive": true
}
```

**Response**:
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "username": "admin",
    "fullName": "نام جدید",
    "email": "newemail@example.com",
    "isActive": true
  }
}
```

---

### `PATCH /api/users/:id/access`
**توضیح**: تنظیم نقش‌ها و مجوزهای کاربر

**Headers**:
- `Authorization: Bearer <access_token>`

**Required Permission**: `users.assign_roles`

**Request Body**:
```json
{
  "roleIds": [1, 2],
  "permissionIds": [1, 2, 3]
}
```

**Response**:
```json
{
  "status": "success",
  "message": "دسترسی‌های کاربر با موفقیت به‌روزرسانی شد"
}
```

---

### `DELETE /api/users/:id`
**توضیح**: حذف کاربر

**Headers**:
- `Authorization: Bearer <access_token>`

**Required Permission**: `users.delete`

**Response**:
```json
{
  "status": "success",
  "message": "کاربر با موفقیت حذف شد"
}
```

---

## APIهای Roles & Permissions

### `GET /api/roles`
**توضیح**: لیست تمام نقش‌ها

**Headers**:
- `Authorization: Bearer <access_token>`

**Required Permission**: `roles.read`

**Response**:
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "name": "SUPER_ADMIN",
      "label": "مدیر کل سیستم",
      "description": "دسترسی کامل به تمام قسمت‌ها",
      "isSystem": true,
      "permissions": [
        {"id": 1, "name": "users.read", "label": "مشاهده کاربران"},
        {"id": 2, "name": "users.create", "label": "ایجاد کاربر"}
      ]
    }
  ]
}
```

---

### `POST /api/roles`
**توضیح**: ایجاد نقش جدید

**Headers**:
- `Authorization: Bearer <access_token>`

**Required Permission**: `roles.create`

**Request Body**:
```json
{
  "name": "string",
  "label": "string",
  "description": "string"
}
```

**Response**:
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "new_role",
    "label": "نقش جدید",
    "description": "توضیحات نقش",
    "isSystem": false
  }
}
```

---

### `GET /api/roles/:id`
**توضیح**: دریافت اطلاعات نقش

**Headers**:
- `Authorization: Bearer <access_token>`

**Required Permission**: `roles.read`

**Response**:
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "SUPER_ADMIN",
    "label": "مدیر کل سیستم",
    "description": "دسترسی کامل",
    "isSystem": true,
    "permissions": [...]
  }
}
```

---

### `PATCH /api/roles/:id`
**توضیح**: به‌روزرسانی نقش

**Headers**:
- `Authorization: Bearer <access_token>`

**Required Permission**: `roles.update`

**Request Body**:
```json
{
  "label": "string",
  "description": "string",
  "permissionIds": [1, 2, 3]
}
```

**Response**:
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "updated_role",
    "label": "نقش به‌روزرسانی شده",
    "description": "توضیحات جدید",
    "permissions": [...]
  }
}
```

---
### `DELETE /api/roles/:id`
**توضیح**: حذف نقش (فقط نقش‌های غیر سیستمی)

**Headers**:
- `Authorization: Bearer <access_token>`

**Required Permission**: `roles.delete`

**Response**:
```json
{
  "status": "success",
  "message": "نقش با موفقیت حذف شد"
}
```

---

### `GET /api/roles/permissions`
**توضیح**: لیست تمام مجوزها

**Headers**:
- `Authorization: Bearer <access_token>`

**Required Permission**: `permissions.read`

**Response**:
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "name": "users.read",
      "label": "مشاهده کاربران",
      "group": "users"
    }
  ]
}
```

---
### `POST /api/roles/permissions`
**توضیح**: ایجاد مجوز جدید

**Headers**:
- `Authorization: Bearer <access_token>`

**Required Permission**: `permissions.assign`

**Request Body**:
```json
{
  "name": "string",
  "label": "string",
  "group": "string",
  "description": "string"
}
```

**Response**:
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "new_permission",
    "label": "مجوز جدید",
    "group": "users",
    "description": "توضیحات مجوز"
  }
}
```

---
### `PATCH /api/roles/permissions/:id`
**توضیح**: به‌روزرسانی مجوز

**Headers**:
- `Authorization: Bearer <access_token>`

**Required Permission**: `permissions.assign`

**Request Body**:
```json
{
  "label": "string",
  "group": "string",
  "description": "string"
}
```

**Response**:
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "updated_permission",
    "label": "مجوز به‌روزرسانی شده",
    "group": "users"
  }
}
```

---
### `DELETE /api/roles/permissions/:id`
**توضیح**: حذف مجوز

**Headers**:
- `Authorization: Bearer <access_token>`

**Required Permission**: `permissions.assign`

**Response**:
```json
{
  "status": "success",
  "message": "مجوز با موفقیت حذف شد"
}
```

---
## APIهای Companies

### `GET /api/companies`
**توضیح**: لیست تمام شرکت‌ها

**Headers**:
- `Authorization: Bearer <access_token>`

**Required Permission**: `companies.read`

**Response**:
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "name": "شرکت مخابرات",
      "type": "TELECOM_OPERATOR",
      "description": "توضیحات شرکت",
      "logoUrl": "http://...",
      "website": "http://...",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---
### `POST /api/companies`
**توضیح**: ایجاد شرکت جدید

**Headers**:
- `Authorization: Bearer <access_token>`

**Required Permission**: `companies.create`

**Request Body**:
```json
{
  "name": "string",
  "type": "MANUFACTURER|IMPORTER|TELECOM_OPERATOR",
  "description": "string",
  "logoUrl": "string",
  "website": "string",
  "isActive": true
}
```

**Response**:
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "شرکت جدید",
    "type": "MANUFACTURER",
    "description": "توضیحات",
    "isActive": true
  }
}
```

---
### `GET /api/companies/:id`
**توضیح**: دریافت اطلاعات شرکت

**Headers**:
- `Authorization: Bearer <access_token>`

**Required Permission**: `companies.read`

**Response**:
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "شرکت مخابرات",
    "type": "TELECOM_OPERATOR",
    "description": "توضیحات",
    "logoUrl": "http://...",
    "website": "http://...",
    "isActive": true,
    "users": [...],
    "products": [...]
  }
}
```

---
### `PATCH /api/companies/:id`
**توضیح**: به‌روزرسانی شرکت

**Headers**:
- `Authorization: Bearer <access_token>`

**Required Permission**: `companies.update`

**Request Body**:
```json
{
  "name": "string",
  "description": "string",
  "logoUrl": "string",
  "website": "string",
  "isActive": true
}
```

**Response**:
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "نام به‌روزرسانی شده",
    "description": "توضیحات جدید",
    "isActive": true
  }
}
```

---
### `DELETE /api/companies/:id`
**توضیح**: حذف شرکت

**Headers**:
- `Authorization: Bearer <access_token>`

**Required Permission**: `companies.delete`

**Response**:
```json
{
  "status": "success",
  "message": "شرکت با موفقیت حذف شد"
}
```

---
## APIهای Categories

### `GET /api/categories`
**توضیح**: لیست تمام دسته‌بندی‌ها (ساختار درختی)

**Headers**:
- `Authorization: Bearer <access_token>`

**Required Permission**: `categories.read`

**Response**:
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "name": "تجهیزات انتقال",
      "slug": "transmission-equipment",
      "parentId": null,
      "children": [
        {
          "id": 2,
          "name": "رادیو لینک",
          "slug": "radio-link",
          "parentId": 1
        }
      ]
    }
  ]
}
```

---
### `POST /api/categories`
**توضیح**: ایجاد دسته‌بندی جدید

**Headers**:
- `Authorization: Bearer <access_token>`

**Required Permission**: `categories.create`

**Request Body**:
```json
{
  "name": "string",
  "slug": "string",
  "parentId": 1
}
```

**Response**:
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "دسته‌بندی جدید",
    "slug": "new-category",
    "parentId": null
  }
}
```

---
### `GET /api/categories/:id`
**توضیح**: دریافت اطلاعات دسته‌بندی

**Headers**:
- `Authorization: Bearer <access_token>`

**Required Permission**: `categories.read`

**Response**:
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "تجهیزات انتقال",
    "slug": "transmission-equipment",
    "parentId": null,
    "products": [...]
  }
}
```

---
### `PATCH /api/categories/:id`
**توضیح**: به‌روزرسانی دسته‌بندی

**Headers**:
- `Authorization: Bearer <access_token>`

**Required Permission**: `categories.update`

**Request Body**:
```json
{
  "name": "string",
  "slug": "string",
  "parentId": 1
}
```

**Response**:
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "نام جدید",
    "slug": "new-slug"
  }
}
```

---
### `DELETE /api/categories/:id`
**توضیح**: حذف دسته‌بندی

**Headers**:
- `Authorization: Bearer <access_token>`

**Required Permission**: `categories.delete`

**Response**:
```json
{
  "status": "success",
  "message": "دسته‌بندی با موفقیت حذف شد"
}
```

---
## APIهای Products

### `GET /api/products`
**توضیح**: لیست تمام محصولات

**Headers**:
- `Authorization: Bearer <access_token>`

**Required Permission**: `products.read`

**Query Parameters**:
- `page`: شماره صفحه
- `limit`: تعداد آیتم
- `categoryId`: فیلتر بر اساس دسته‌بندی
- `companyId`: فیلتر بر اساس شرکت
- `status`: فیلتر بر اساس وضعیت (DRAFT, PUBLISHED, ARCHIVED)
- `search`: جستجو در عنوان و توضیحات

**Response**:
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "title": "آنتن مخابراتی",
      "description": "توضیحات محصول",
      "sku": "ANT-001",
      "status": "PUBLISHED",
      "specifications": {
        "frequency": "2.4GHz",
        "gain": "15dBi"
      },
      "companyId": 1,
      "categoryId": 1,
      "prices": [...],
      "images": [...],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100
  }
}
```

---
### `POST /api/products`
**توضیح**: ایجاد محصول جدید

**Headers**:
- `Authorization: Bearer <access_token>`

**Required Permission**: `products.create`

**Request Body**:
```json
{
  "title": "string",
  "description": "string",
  "sku": "string",
  "status": "DRAFT|PUBLISHED|ARCHIVED",
  "categoryId": 1,
  "specifications": {},
  "prices": [
    {
      "price": 1000000,
      "currency": "IRR",
      "unit": "unit",
      "minOrderQty": 1,
      "quantityAvailable": 10
    }
  ],
  "images": [
    {
      "url": "http://...",
      "type": "image|datasheet|catalog"
    }
  ]
}
```

**Response**:
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "title": "محصول جدید",
    "description": "توضیحات",
    "sku": "PROD-001",
    "status": "DRAFT",
    "companyId": 1,
    "categoryId": 1
  }
}
```

---
### `GET /api/products/:id`
**توضیح**: دریافت اطلاعات محصول

**Headers**:
- `Authorization: Bearer <access_token>`

**Required Permission**: `products.read`

**Response**:
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "title": "آنتن مخابراتی",
    "description": "توضیحات کامل",
    "sku": "ANT-001",
    "status": "PUBLISHED",
    "specifications": {...},
    "company": {...},
    "category": {...},
    "prices": [...],
    "images": [...]
  }
}
```

---
### `PATCH /api/products/:id`
**توضیح**: به‌روزرسانی محصول

**Headers**:
- `Authorization: Bearer <access_token>`

**Required Permission**: `products.update`

**Request Body**:
```json
{
  "title": "string",
  "description": "string",
  "sku": "string",
  "status": "DRAFT|PUBLISHED|ARCHIVED",
  "categoryId": 1,
  "specifications": {}
}
```

**Response**:
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "title": "عنوان به‌روزرسانی شده",
    "description": "توضیحات جدید",
    "status": "PUBLISHED"
  }
}
```

---
### `DELETE /api/products/:id`
**توضیح**: حذف محصول

**Headers**:
- `Authorization: Bearer <access_token>`

**Required Permission**: `products.delete`

**Response**:
```json
{
  "status": "success",
  "message": "محصول با موفقیت حذف شد"
}
```

---
## کدهای وضعیت و خطاها

### کدهای وضعیت HTTP
| کد | توضیح |
|----|--------|
| 200 | موفقیت |
| 201 | ایجاد شد |
| 400 | درخواست نامعتبر |
| 401 | غیرمجاز (نیاز به احراز هویت) |
| 403 | ممنوع (دسترسی رد شد) |
| 404 | یافت نشد |
| 409 | تعارض (مثلا کاربر تکراری) |
| 500 | خطای سرور |

### خطاهای رایج
```json
{
  "status": "error",
  "code": "VALIDATION_ERROR",
  "message": "اعتبارسنجی با شکست مواجه شد",
  "errors": [
    {
      "field": "email",
      "message": "ایمیل معتبر نیست"
    }
  ]
}
```

```json
{
  "status": "error",
  "code": "UNAUTHORIZED",
  "message": "توکن منقضی شده یا نامعتبر است"
}
```

```json
{
  "status": "error",
  "code": "FORBIDDEN",
  "message": "شما مجوز انجام این عمل را ندارید"
}
```

```json
{
  "status": "error",
  "code": "NOT_FOUND",
  "message": "منبع یافت نشد"
}
```

---
## نکات امنیتی
1. همیشه از HTTPS در محیط production استفاده کنید
2. توکن‌های دسترسی را در سمت کلاینت ذخیره نکنید (فقط در memory)
3. توکن‌های تازه‌سازی در کوکی‌های httpOnly ذخیره می‌شوند
4. تمام درخواست‌ها باید دارای هدر Content-Type: application/json باشند
5. برای عملیات حساس، از CSRF protection استفاده کنید

---
## نسخه‌بندی API
- نسخه فعلی: `v1`
- فرمت آدرس: `/api/v1/...` (در آینده)
- در حال حاضر تمام APIها در `/api/...` قرار دارند

---

## اعلان‌ها (Notifications)

برای مسیرهای کاربر، تنظیمات ترجیح اعلان و ارسال/پایش اعلان‌های مدیریتی، سند تخصصی [سیستم اعلان‌ها](NOTIFICATION_SYSTEM.md) را ببینید. مسیرهای واقعی در کدهای `backend/src/modules/notifications/notification.routes.js` و `backend/src/modules/admin/admin.routes.js` تعریف شده‌اند؛ هنگام تغییر API، ابتدا آن‌ها و تست‌های مرتبط را بررسی کنید و این مستندات را همگام نگه دارید.
