# مستندات پایگاه داده - Telecom Marketplace

## مقدمه
این مستندات ساختار پایگاه داده پروژه Telecom Marketplace را شرح میدهد. این پروژه از **PostgreSQL** به عنوان پایگاه داده اصلی و **Prisma ORM** به عنوان لایه ارتباط با پایگاه داده استفاده میکند.

---

## جدول محتوا
1. [معماری کلی پایگاه داده](#معماری-کلی-پایگاه-داده)
2. [مدلهای RBAC](#مدلهای-rbac)
3. [مدلهای اصلی کسب و کار](#مدلهای-اصلی-کسب-و-کار)
4. [روابط بین مدلها](#روابط-بین-مدلها)
5. [Enums و انواع داده](#enums-و-انواع-داده)
6. [ایندکسها و بهینهسازی](#ایندکسها-و-بهینهسازی)
7. [استراتژیهای امنیتی](#استراتژیهای-امنیتی)
8. [مثالهای پرس و جو](#مثالهای-پرس-و-جو)

---

## معماری کلی پایگاه داده

### مشخصات فنی
- **DBMS**: PostgreSQL 16
- **ORM**: Prisma Client (Node.js)
- **Connection Pooling**: توسط Prisma مدیریت میشود
- **Encoding**: UTF-8
- **Timezone**: UTC

### ساختار اتصال
```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
```

### ساختار کلی مدلها
```
┌─────────────────────────────────────────────────────────────┐
│                        RBAC Models                            │
├─────────────────────────────────────────────────────────────┤
│  Role          │  Permission  │  RolePermission  │  UserRole     │
│  UserPermission│  RefreshToken                              │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                      Business Models                          │
├─────────────────────────────────────────────────────────────┤
│  User          │  Company       │  Category      │  Product      │
│  ProductPrice  │  ProductImage                              │
└─────────────────────────────────────────────────────────────┘
```

---

## مدلهای RBAC

### 1. Role (نقش)
**توضیح**: نقشهای کاربران در سیستم. نقشها میتوانند سیستمی یا سفارشی باشند.

```prisma
model Role {
  id          Int              @id @default(autoincrement())
  name        String           @unique // machine name, e.g. "SUPER_ADMIN"
  label       String                    // human readable, e.g. "مدیر کل سیستم"
  description String?
  isSystem    Boolean          @default(false) // system roles cannot be deleted

  users       UserRole[]
  permissions RolePermission[]

  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  @@index([isSystem])
}
```

**فیلدها**:
- `id`: شناسه یکتا
- `name`: نام ماشینخوانی (منحصر به فرد)
- `label`: برچسب قابل نمایش
- `description`: توضیحات اختیاری
- `isSystem`: آیا نقش سیستمی است؟ (نمی توان حذف کرد)
- `createdAt/updatedAt`: زمان ایجاد و بهروزرسانی

**نقشهای سیستمی پیشفرض**:
- `SUPER_ADMIN`: دسترسی کامل به تمام قسمتها
- `COMPANY_ADMIN`: مدیریت کاربران و محصولات شرکت خود
- `BUYER`: مشاهده محصولات و خرید

---

### 2. Permission (مجوز)
**توضیح**: مجوزهای دسترسی در سیستم. هر مجوز یک عمل خاص را مشخص میکند.

```prisma
model Permission {
  id          Int              @id @default(autoincrement())
  name        String           @unique // machine name, e.g. "users.create"
  label       String                    // human readable
  description String?
  group       String?                   // for grouping in the UI, e.g. "users"

  roles       RolePermission[]
  users       UserPermission[]

  createdAt   DateTime         @default(now())

  @@index([group])
}
```

**فیلدها**:
- `id`: شناسه یکتا
- `name`: نام ماشینخوانی (منحصر به فرد)
- `label`: برچسب قابل نمایش
- `description`: توضیحات اختیاری
- `group`: گروهبندی مجوزها (مثلا "users", "products")
- `createdAt`: زمان ایجاد

**مجوزهای پیشفرض**:
- `users.*`: مدیریت کاربران
- `roles.*`: مدیریت نقشها
- `permissions.*`: مدیریت مجوزها
- `companies.*`: مدیریت شرکتها
- `categories.*`: مدیریت دستهبندیها
- `products.*`: مدیریت محصولات

---

### 3. RolePermission (ارتباط نقش-مجوز)
**توضیح**: جدول واسط بین Role و Permission (Many-to-Many)

```prisma
model RolePermission {
  roleId       Int
  permissionId Int
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  assignedAt   DateTime   @default(now())

  @@id([roleId, permissionId])
  @@index([permissionId])
}
```

**فیلدها**:
- `roleId`: شناسه نقش
- `permissionId`: شناسه مجوز
- `assignedAt`: زمان تخصیص
- کلید اصلی مرکب: `(roleId, permissionId)`

---

### 4. UserRole (ارتباط کاربر-نقش)
**توضیح**: جدول واسط بین User و Role (Many-to-Many)

```prisma
model UserRole {
  userId   Int
  roleId   Int
  user     User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role     Role @relation(fields: [roleId], references: [id], onDelete: Cascade)

  assignedAt DateTime @default(now())

  @@id([userId, roleId])
  @@index([roleId])
}
```

**فیلدها**:
- `userId`: شناسه کاربر
- `roleId`: شناسه نقش
- `assignedAt`: زمان تخصیص
- کلید اصلی مرکب: `(userId, roleId)`

---

### 5. UserPermission (مجوزهای مستقیم کاربر)
**توضیح**: مجوزهای مستقیم تخصیص داده شده به کاربر (علاوه بر مجوزهای نقش)

```prisma
model UserPermission {
  userId       Int
  permissionId Int
  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  assignedAt   DateTime   @default(now())

  @@id([userId, permissionId])
  @@index([permissionId])
}
```

**فیلدها**:
- `userId`: شناسه کاربر
- `permissionId`: شناسه مجوز
- `assignedAt`: زمان تخصیص
- کلید اصلی مرکب: `(userId, permissionId)`

---

### 6. RefreshToken (توکن تازهسازی)
**توضیح**: ذخیره توکنهای تازهسازی برای مدیریت سشنها

```prisma
model RefreshToken {
  id          Int       @id @default(autoincrement())
  token       String    @unique  // stored as SHA-256 hash, never plaintext
  userId      Int
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt   DateTime
  createdAt   DateTime  @default(now())

  @@index([userId])
  @@index([token])
}
```

**فیلدها**:
- `id`: شناسه یکتا
- `token`: توکن هش شده (SHA-256)
- `userId`: شناسه کاربر
- `expiresAt`: زمان انقضا
- `createdAt`: زمان ایجاد

**استراتژی امنیتی**:
- توکنها هرگز به صورت plaintext ذخیره نمیشوند
- در هنگام logout، رکورد مربوطه حذف میشود
- در هنگام refresh، توکن قدیمی حذف و توکن جدید ایجاد میشود (Token Rotation)

---

## مدلهای اصلی کسب و کار

### 1. User (کاربر)
**توضیح**: کاربران سیستم

```prisma
model User {
  id            Int            @id @default(autoincrement())
  username      String         @unique // login name, e.g. "admin"
  fullName      String
  email         String         @unique
  password      String         // bcrypt hashed - never stored as plaintext

  isActive      Boolean        @default(true)

  // COMPANY_ADMIN and BUYER belong to a company
  // SUPER_ADMIN has companyId = null
  companyId     Int?
  company       Company?       @relation(fields: [companyId], references: [id])

  // RBAC relations
  roles         UserRole[]
  permissions   UserPermission[]

  // Refresh tokens for this user (a user can have multiple active sessions)
  refreshTokens RefreshToken[]

  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@index([email])
  @@index([companyId])
}
```

**فیلدها**:
- `id`: شناسه یکتا
- `username`: نام کاربری (منحصر به فرد)
- `fullName`: نام کامل
- `email`: ایمیل (منحصر به فرد)
- `password`: رمز عبور هش شده (bcrypt)
- `isActive`: آیا کاربر فعال است؟
- `companyId`: شناسه شرکت (برای COMPANY_ADMIN و BUYER)
- `createdAt/updatedAt`: زمان ایجاد و بهروزرسانی

**ایندکسها**:
- ایمیل: برای جستجوی سریع
- شرکت: برای فیلتر کردن کاربران یک شرکت

---

### 2. Company (شرکت)
**توضیح**: شرکتهای فعال در بازارگاه

```prisma
model Company {
  id            Int          @id @default(autoincrement())
  name          String
  type          CompanyType
  description   String?
  logoUrl       String?
  website       String?
  isActive      Boolean      @default(true)

  // Relations
  users         User[]
  products      Product[]

  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
}
```

**فیلدها**:
- `id`: شناسه یکتا
- `name`: نام شرکت
- `type`: نوع شرکت (از enum CompanyType)
- `description`: توضیحات
- `logoUrl`: آدرس لوگو
- `website`: آدرس وبسایت
- `isActive`: آیا شرکت فعال است؟
- `createdAt/updatedAt`: زمان ایجاد و بهروزرسانی

**انواع شرکت (CompanyType)**:
- `MANUFACTURER`: تولید کننده داخلی
- `IMPORTER`: وارد کننده تجهیزات
- `TELECOM_OPERATOR`: شرکت مخابراتی (خریدار)

---

### 3. Category (دستهبندی)
**توضیح**: دستهبندی محصولات (ساختار درختی)

```prisma
model Category {
  id          Int         @id @default(autoincrement())
  name        String
  slug        String      @unique

  // Self-referencing for hierarchical categories
  // Example: Transmission Equipment > Radio Link > Point-to-Point
  parentId    Int?
  parent      Category?   @relation("CategoryTree", fields: [parentId], references: [id])
  children    Category[]  @relation("CategoryTree")

  products    Product[]

  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}
```

**فیلدها**:
- `id`: شناسه یکتا
- `name`: نام دستهبندی
- `slug`: شناسه یکتا برای URLها
- `parentId`: شناسه دستهبندی والد (برای ساختار درختی)
- `parent`: دستهبندی والد
- `children`: دستهبندیهای فرزند
- `products`: محصولات این دستهبندی
- `createdAt/updatedAt`: زمان ایجاد و بهروزرسانی

**مثال ساختار درختی**:
```
تجهیزات انتقال (id: 1)
├── رادیو لینک (id: 2)
│   ├── Point-to-Point (id: 3)
│   └── Point-to-Multipoint (id: 4)
└── کابل (id: 5)
    ├── فیبر نوری (id: 6)
    └── مسی (id: 7)
```

---

### 4. Product (محصول)
**توضیح**: محصولات بازارگاه

```prisma
model Product {
  id              Int            @id @default(autoincrement())
  title           String
  description     String?
  sku             String?        // supplier's internal product code

  // Flexible technical specifications stored as JSON
  // Different product types have different specs:
  //   Antenna: { frequency, gain, beamwidth, ipRating }
  //   Battery: { voltage, capacity, cycleLife, chemistry }
  //   Cable:   { coreCount, standard, armorType }
  specifications  Json?

  status          ProductStatus  @default(DRAFT)

  companyId       Int
  company         Company        @relation(fields: [companyId], references: [id])

  categoryId      Int?
  category        Category?      @relation(fields: [categoryId], references: [id])

  prices          ProductPrice[]
  images          ProductImage[]

  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  @@index([companyId])
  @@index([categoryId])
  @@index([status])
}
```

**فیلدها**:
- `id`: شناسه یکتا
- `title`: عنوان محصول
- `description`: توضیحات
- `sku`: کد داخلی تامین کننده
- `specifications`: مشخصات فنی (JSON)
- `status`: وضعیت محصول
- `companyId`: شناسه شرکت مالک
- `categoryId`: شناسه دستهبندی
- `createdAt/updatedAt`: زمان ایجاد و بهروزرسانی

**وضعیت محصول (ProductStatus)**:
- `DRAFT`: قابل مشاهده فقط برای مالک و SUPER_ADMIN
- `PUBLISHED`: قابل مشاهده برای تمام کاربران احراز هویت شده
- `ARCHIVED`: مخفی از کاتالوگ (حذف نرم)

**مثال specifications برای آنتن**:
```json
{
  "frequency": "2.4GHz",
  "gain": "15dBi",
  "beamwidth": "30 degrees",
  "ipRating": "IP67",
  "connectorType": "N-Type"
}
```

---

### 5. ProductPrice (قیمت محصول)
**توضیح**: تاریخچه قیمت محصولات

```prisma
model ProductPrice {
  id                  Int       @id @default(autoincrement())
  productId           Int
  product             Product   @relation(fields: [productId], references: [id], onDelete: Cascade)

  price               Decimal   @db.Decimal(18, 2)
  currency            String    @default("IRR")
  unit                String?   // "unit", "meter", "kilogram", etc.
  minOrderQty         Int?
  quantityAvailable   Int?

  // Price history: when a new price is set, validTo is set on the old row
  validFrom           DateTime  @default(now())
  validTo             DateTime? // null = currently active price

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  @@index([productId])
}
```

**فیلدها**:
- `id`: شناسه یکتا
- `productId`: شناسه محصول
- `price`: قیمت (با دقت 2 رقم اعشار)
- `currency`: واحد پول (پیشفرض: IRR)
- `unit`: واحد اندازهگیری
- `minOrderQty`: حداقل مقدار سفارش
- `quantityAvailable`: مقدار موجود
- `validFrom`: تاریخ شروع اعتبار
- `validTo`: تاریخ پایان اعتبار (null = فعال)
- `createdAt/updatedAt`: زمان ایجاد و بهروزرسانی

**استراتژی تاریخچه قیمت**:
- هنگام تنظیم قیمت جدید، `validTo` روی رکورد قدیمی تنظیم میشود
- فقط یک رکورد با `validTo = null` برای هر محصول فعال است

---

### 6. ProductImage (تصاویر محصول)
**توضیح**: تصاویر و مستندات محصولات

```prisma
model ProductImage {
  id          Int       @id @default(autoincrement())
  productId   Int
  product     Product   @relation(fields: [productId], references: [id], onDelete: Cascade)

  url         String
  type        String    @default("image")   // "image" | "datasheet" | "catalog"

  createdAt   DateTime  @default(now())

  @@index([productId])
}
```

**فیلدها**:
- `id`: شناسه یکتا
- `productId`: شناسه محصول
- `url`: آدرس فایل
- `type`: نوع فایل
  - `image`: تصویر محصول
  - `datasheet`: دیتاشیت فنی
  - `catalog`: کاتالوگ
- `createdAt`: زمان ایجاد

---

## روابط بین مدلها

### نمودار روابط
```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User      │       │    Role      │       │ Permission  │
└─────────────┘       └─────────────┘       └─────────────┘
       │                      │                      │
       │ many-to-many         │ many-to-many         │
       ▼                      ▼                      ▼
┌─────────────────────┐ ┌─────────────────────┐
│   UserRole           │ │   RolePermission     │
└─────────────────────┘ └─────────────────────┘
       │                      │
       │                      │ many-to-many
       │                      ▼
       │               ┌─────────────────────┐
       │               │   UserPermission     │
       │               └─────────────────────┘
       │
       │ 1-to-many
       ▼
┌─────────────────────┐       ┌─────────────┐
│   RefreshToken       │       │   Company    │
└─────────────────────┘       └─────────────┘
                                      │
                                      │ 1-to-many
              ┌───────────────────────┼───────────────────────┐
              ▼                       ▼                       ▼
       ┌─────────────┐       ┌─────────────┐       ┌─────────────┐
       │   Product    │       │  Category    │       │    User      │
       └─────────────┘       └─────────────┘       └─────────────┘
              │                       │
              │ 1-to-many             │ self-referencing
              ▼                       ▼
       ┌─────────────────────┐ ┌─────────────────────┐
       │   ProductPrice       │ │   Category (tree)    │
       └─────────────────────┘ └─────────────────────┘
              │
              │ 1-to-many
              ▼
       ┌─────────────────────┐
       │   ProductImage       │
       └─────────────────────┘
```

### توضیح روابط
1. **User ↔ Role**: Many-to-Many (از طریق UserRole)
2. **User ↔ Permission**: Many-to-Many (از طریق UserPermission)
3. **Role ↔ Permission**: Many-to-Many (از طریق RolePermission)
4. **User ↔ RefreshToken**: One-to-Many
5. **Company ↔ User**: One-to-Many
6. **Company ↔ Product**: One-to-Many
7. **Category ↔ Product**: One-to-Many
8. **Category ↔ Category**: Self-referencing (ساختار درختی)
9. **Product ↔ ProductPrice**: One-to-Many
10. **Product ↔ ProductImage**: One-to-Many

---

## Enums و انواع داده

### CompanyType
```prisma
enum CompanyType {
  MANUFACTURER      // تولید کننده داخلی
  IMPORTER          // وارد کننده تجهیزات
  TELECOM_OPERATOR  // شرکت مخابراتی (خریدار)
}
```

### ProductStatus
```prisma
enum ProductStatus {
  DRAFT      // قابل مشاهده فقط برای مالک و SUPER_ADMIN
  PUBLISHED  // قابل مشاهده برای تمام کاربران احراز هویت شده
  ARCHIVED   // مخفی از کاتالوگ (حذف نرم)
}
```

### انواع داده سفارشی
- **Decimal**: برای قیمتها (18 رقم، 2 رقم اعشار)
- **Json**: برای ذخیره مشخصات فنی محصولات
- **DateTime**: برای ذخیره تاریخ و زمان (UTC)

---

## ایندکسها و بهینهسازی

### ایندکسهای موجود
| مدل | فیلد | نوع | توضیح |
|-----|------|------|--------|
| User | email | Unique | جستجوی سریع ایمیل |
| User | companyId | Index | فیلتر کاربران شرکت |
| Role | isSystem | Index | فیلتر نقشهای سیستمی |
| Permission | group | Index | گروهبندی مجوزها |
| RolePermission | permissionId | Index | جستجوی سریع مجوزها |
| UserRole | roleId | Index | جستجوی سریع نقشها |
| UserPermission | permissionId | Index | جستجوی سریع مجوزها |
| RefreshToken | userId | Index | جستجوی توکنهای کاربر |
| RefreshToken | token | Unique | جلوگیری از تکرار توکن |
| Company | (id) | Primary | کلید اصلی |
| Category | slug | Unique | شناسه یکتا برای URL |
| Category | parentId | Foreign | رابطه درختی |
| Product | companyId | Index | فیلتر محصولات شرکت |
| Product | categoryId | Index | فیلتر محصولات دستهبندی |
| Product | status | Index | فیلتر بر اساس وضعیت |
| ProductPrice | productId | Index | جستجوی قیمتهای محصول |
| ProductImage | productId | Index | جستجوی تصاویر محصول |

### استراتژیهای بهینهسازی
1. **ایندکسهای مرکب**: برای پرس و جوهای مکرر با چندین شرط
2. **Cascading Deletes**: حذف خودکار رکوردهای وابسته
3. **Soft Deletes**: استفاده از فیلد `isActive` به جای حذف فیزیکی
4. **JSON Fields**: ذخیره دادههای انعطافپذیر در فیلدهای JSON

---

## استراتژیهای امنیتی

### هش کردن دادهها
1. **رمزهای عبور**: هش شده با bcrypt
2. **توکنهای تازهسازی**: هش شده با SHA-256
3. **هیچ داده حساسی به صورت plaintext ذخیره نمیشود**

### کنترل دسترسی
1. **RBAC**: سیستم مدیریت دسترسی بر اساس نقش
2. **Permission Checks**: بررسی مجوزها در سطح API
3. **Data Filtering**: فیلتر کردن دادهها بر اساس شرکت کاربر

### مثال: بررسی دسترسی در پرس و جو
```javascript
// فقط محصولات شرکت کاربر فعلی
const products = await prisma.product.findMany({
  where: {
    companyId: currentUser.companyId
  }
});

// فقط کاربران شرکت کاربر فعلی (برای COMPANY_ADMIN)
const users = await prisma.user.findMany({
  where: {
    companyId: currentUser.companyId
  }
});
```

### مثال: محاسبه مجوزهای موثر کاربر
```javascript
// مجوزهای موثر = مجوزهای نقشها + مجوزهای مستقیم کاربر
const effectivePermissions = [
  ...user.permissions.map(p => p.name),
  ...user.roles.flatMap(r => r.permissions.map(p => p.name))
];
```

---

## مثالهای پرس و جو

### 1. دریافت کاربر با نقشها و مجوزها
```javascript
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    roles: {
      include: {
        role: {
          include: {
            permissions: true
          }
        }
      }
    },
    permissions: {
      include: {
        permission: true
      }
    },
    company: true
  }
});
```

### 2. دریافت محصولات با دستهبندی و شرکت
```javascript
const products = await prisma.product.findMany({
  where: {
    status: 'PUBLISHED',
    categoryId: 1
  },
  include: {
    category: true,
    company: true,
    prices: {
      where: {
        validTo: null // فقط قیمتهای فعال
      }
    },
    images: true
  },
  orderBy: {
    createdAt: 'desc'
  },
  take: 10
});
```

### 3. دریافت ساختار درختی دستهبندیها
```javascript
// دستهبندیهای ریشه
const rootCategories = await prisma.category.findMany({
  where: {
    parentId: null
  },
  include: {
    children: {
      include: {
        children: true // سطح سوم
      }
    }
  }
});
```

### 4. جستجوی محصولات
```javascript
const searchResults = await prisma.product.findMany({
  where: {
    OR: [
      { title: { contains: 'آنتن' } },
      { description: { contains: 'آنتن' } }
    ],
    status: 'PUBLISHED'
  },
  include: {
    company: true,
    category: true
  }
});
```

### 5. دریافت تاریخچه قیمت یک محصول
```javascript
const priceHistory = await prisma.productPrice.findMany({
  where: {
    productId: 1
  },
  orderBy: {
    validFrom: 'desc'
  }
});
```

### 6. ایجاد کاربر با نقش و مجوز
```javascript
const user = await prisma.user.create({
  data: {
    username: 'newuser',
    fullName: 'نام کاربر',
    email: 'newuser@example.com',
    password: bcrypt.hashSync('password123'),
    companyId: 1,
    roles: {
      create: [
        { roleId: 2 } // COMPANY_ADMIN
      ]
    },
    permissions: {
      create: [
        { permissionId: 10 } // مجوز خاص
      ]
    }
  },
  include: {
    roles: true,
    permissions: true
  }
});
```

### 7. بهروزرسانی نقش و مجوزهای کاربر
```javascript
await prisma.$transaction([
  // حذف نقشهای قدیمی
  prisma.userRole.deleteMany({
    where: { userId: 1 }
  }),
  // حذف مجوزهای مستقیم قدیمی
  prisma.userPermission.deleteMany({
    where: { userId: 1 }
  }),
  // اضافه کردن نقشهای جدید
  prisma.userRole.createMany({
    data: [
      { userId: 1, roleId: 2 },
      { userId: 1, roleId: 3 }
    ]
  }),
  // اضافه کردن مجوزهای مستقیم جدید
  prisma.userPermission.createMany({
    data: [
      { userId: 1, permissionId: 10 },
      { userId: 1, permissionId: 11 }
    ]
  })
]);
```

---
## Migrationها و مدیریت schema

### ایجاد Migration جدید
```bash
npx prisma migrate dev --name add_new_field
```

### اعمال Migration در production
```bash
npx prisma migrate deploy
```

### باز کردن Prisma Studio
```bash
npx prisma studio
```

### بررسی وضعیت Migrationها
```bash
npx prisma migrate status
```

---
## نکات مهم

1. **Backup گیری**: قبل از اعمال Migrationها در production، Backup بگیرید
2. **Test Migrationها**: همیشه Migrationها را در محیط test اجرا کنید
3. **Rollback**: در صورت بروز مشکل، از Backup استفاده کنید
4. **Data Migration**: برای تغییرات بزرگ، اسکریپتهای data migration بنویسید
5. **Performance**: برای پرس و جوهای پیچیده، از ایندکسهای مناسب استفاده کنید

---
## منابع
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)