# Role Access Matrix

> **When adding/changing roles, update ALL THREE enforcement points simultaneously.**

## Admin App (`apps/admin`)

**Allowed roles:** SUPER_ADMIN, ADMIN, MODERATOR, SUPPORT, FINANCE, VIEWER

| Enforcement Point | File | Line |
|-------------------|------|------|
| Frontend router guard | `apps/admin/src/router/index.js` | ~line 94 |
| Backend login validation | `backend/src/modules/auth/auth.service.js` | `login()` function, APP_ACCESS_ROLES check |
| Seed definition | `backend/prisma/seed.js` | `ROLES` array |

**Excluded:** BUYER, COMPANY — these users cannot access the admin panel.

## Company App (`apps/company`)

**Allowed roles:** COMPANY

| Enforcement Point | File | Line |
|-------------------|------|------|
| Frontend router guard | `apps/company/src/router/index.js` | ~line 84 |
| Backend login validation | `backend/src/modules/auth/auth.service.js` | `login()` function, APP_ACCESS_ROLES check |
| Seed definition | `backend/prisma/seed.js` | `ROLES` array |

**Excluded:** BUYER, ADMIN, MODERATOR, SUPPORT, FINANCE, VIEWER — only company users can access.

## Website (`apps/website`)

**No role restriction.** Public marketplace accessible to all.

- **Guest:** Can browse products, categories, company profiles
- **Buyer (BUYER role):** Can browse + access profile page
- **Any authenticated user:** Can browse + access profile

## Complete Role List (from seed.js)

| Role | Label | Admin App | Company App | Website |
|------|-------|-----------|-------------|---------|
| SUPER_ADMIN | Super Admin | ✅ (bypasses all) | ✅ (bypasses all) | ✅ |
| ADMIN | مدیر سامانه | ✅ | ❌ | ✅ |
| COMPANY | نماینده شرکت | ❌ | ✅ | ✅ |
| MODERATOR | مسئول محتوا | ✅ | ❌ | ✅ |
| SUPPORT | پشتیبانی | ✅ | ❌ | ✅ |
| FINANCE | مالی | ✅ | ❌ | ✅ |
| VIEWER | مشاهده‌گر | ✅ | ❌ | ✅ |
| BUYER | خریدار | ❌ | ❌ | ✅ |

## Key Rules

1. **BUYER has NO `dashboard.read` permission** — removed from seed to prevent accidental admin/company access
2. **SUPER_ADMIN bypasses all app-type checks** — can access any app for support/debugging
3. **Backend validation (Step 0.6) is the ONLY real security boundary** — frontend guards (Steps 0.4/0.5) are UX only
4. **`app` parameter in login is optional** — if omitted, no role check is performed (backward compatible)
5. **Company users cannot create/delete/edit other users** — only platform admins can manage user lifecycle
