# Backend Architecture Audit Report

**Date:** 2026-07-31  
**Task:** Complete migration from legacy User model to new architecture  
**Status:** ✅ COMPLETED

---

## Executive Summary

The backend has been successfully migrated from the old User model architecture to the new three-entity separation:

- **User** = authentication identity only (email, phone, passwordHash, status)
- **Profile** = personal information for EVERY human user (firstName, lastName, avatar, metadata)
- **AccessProfile** = authorization context (type: STAFF|COMPANY|CUSTOMER, companyId, isActive)

All legacy references to removed User fields have been eliminated across the entire backend codebase, and the personal-profile table has been renamed from `CustomerProfile` to `Profile` to reflect that it belongs to every human user (customers, company employees and staff), not just customers.

---

## Architectural Rules (Verified)

### ✅ User Model
- Contains ONLY authentication fields: id, email, phone, passwordHash, status, timestamps
- NO personal information (firstName, lastName, fullName, username removed)
- NO company relation (companyId column removed)

### ✅ Profile Model
- Stores personal information for ALL human users
- Every user type (CUSTOMER, COMPANY employees, STAFF) has a Profile
- Fields: firstName, lastName, avatar, metadata
- Renamed from `CustomerProfile` → `Profile` (the personal profile belongs to every human user)

### ✅ AccessProfile Model
- ONLY for authorization context
- Fields: type (STAFF|COMPANY|CUSTOMER), companyId (nullable), isActive
- Does NOT store personal information

### ✅ Business Rules
1. **Company Membership:**
   - Resolved through `AccessProfile.companyId`
   - One company can have multiple users (Manager, Sales, Technical, Support)
   - Each user has: User + Profile + AccessProfile + Roles

2. **Company User Creation:**
   - ONLY administrators can create company users
   - ONLY administrators can assign roles
   - ONLY administrators can enable/disable company access (AccessProfile.isActive)

3. **Application Selection:**
   - MUST depend ONLY on `accessProfile.type`
   - STAFF → Admin application
   - COMPANY → Company application  
   - CUSTOMER → Website
   - Roles control permissions INSIDE the selected application

---

## Files Changed

### 1. ✅ Prisma Schema — model rename
**File:** `backend/prisma/schema.prisma`
**Change:** Renamed `model CustomerProfile` → `model Profile`. Updated the
back-relation on `User` (`profile Profile?`). Regenerated the Prisma client so
`prisma.profile` is the accessor everywhere.

### 2. ✅ Orders Module (REMOVED)
**Status:** Dead module completely removed  
**Reason:** No Order model exists in schema; RFQ interactions are modeled through Inquiry domain  
**Action:**
- Removed `backend/src/modules/orders/` directory entirely
- Unregistered from `backend/src/app.js`

### 3. ✅ Users Module
**Files:**
- `backend/src/modules/users/user.service.js`
- `backend/src/modules/users/user.schemas.js`
- `backend/src/modules/users/user.controller.js`
- `backend/src/modules/users/user.routes.js`

**Changes:**
- All user queries now include the `profile` relation
- Personal fields accessed via `user.profile.firstName/lastName`
- Company membership via `user.accessProfile.companyId`
- `createUser()` now creates User + Profile + AccessProfile + UserRole
- `updateUser()` updates both User and Profile
- Search filters updated to query company relation through AccessProfile

### 4. ✅ Settings Module
**Files:**
- `backend/src/modules/settings/settings.service.js`
- `backend/src/modules/settings/settings.controller.js`
- `backend/src/modules/settings/settings.schemas.js`
- `backend/src/modules/settings/settings.routes.js`

**Changes:**
- Profile updates now target the Profile table
- Company context derived from `accessProfile.companyId`
- Type checking via `accessProfile.type`

### 5. ✅ Companies Module
**File:** `backend/src/modules/companies/company.service.js`

**Changes:**
- `listCompanies()`: Changed `_count.users` → `_count.accessProfiles`
- `getCompanyById()`: Changed `users` relation → `accessProfiles`, flattened to friendly `users[]` array with Profile data
- `changeStatus()`: Company activation now updates users via `WHERE accessProfile.companyId`, and flips `AccessProfile.isActive → true`
- `getStatistics()`: User counts query via `WHERE accessProfile.companyId`

### 6. ✅ Admin Module
**File:** `backend/src/modules/admin/admin.service.js`

**Changes:**
- `getStats()`: Recent users select includes the `profile` relation
- Product `createdBy` select changed from `fullName` → `profile.{firstName, lastName}`

### 7. ✅ Products Module
**File:** `backend/src/modules/products/product.service.js`

**Changes:**
- `statusHistory.changedBy` select: `fullName` → `profile.{firstName, lastName}`
- `getCompanyUserIds()`: Query changed from `user.companyId` → `user.accessProfile.companyId`

### 8. ✅ Inquiries Module
**File:** `backend/src/modules/inquiries/inquiry.service.js`

**Changes:**
- `statusHistory.changedBy` select: `fullName` → `profile.{firstName, lastName}`

### 9. ✅ Auth Module
**Files:**
- `backend/src/modules/auth/auth.service.js`
- `backend/src/modules/auth/auth.schemas.js`
- `backend/src/modules/auth/auth.controller.js`
- `backend/src/modules/auth/auth.routes.js`

**Changes:**
- **AccessProfile.isActive enforcement added:**
  - `login()`: Rejects STAFF/COMPANY users when `accessProfile.isActive === false`
  - `refresh()`: Rejects token refresh for deactivated panel users
- **Token derivation fixed:**
  - `companyId` now derived from `accessProfile.companyId` (not removed User.companyId)
  - Access token payload includes `accessType` and `companyId` from AccessProfile
- **Wire-key rename:** the auth context key `customerProfile` → `profile` across
  the service, JSON schemas, controller and route docs. All auth responses now
  return `profile`.
- **Login is email-only:** removed the last `username` references from route/summary docs.

### 10. ✅ Frontend Auth Consumers
**Files:**
- `packages/auth/store.js`
- `apps/website/src/layouts/PublicLayout.vue`

**Changes:**
- Store state renamed `customerProfile` → `profile`, including localStorage key,
  `setAuthContext`, `clearAuthData`, avatar upload/delete, and the returned store API.
- `PublicLayout.vue` now reads `authStore.profile` for the display name and avatar.

---

## Legacy References Removed

### Search Results: ZERO remaining legacy references in source

**Searched for:**
- `user.username` ❌ (field removed)
- `user.firstName` ❌ (moved to Profile)
- `user.lastName` ❌ (moved to Profile)
- `user.fullName` ❌ (computed from Profile)
- `user.companyId` ❌ (moved to AccessProfile)
- `customerProfile` / `CustomerProfile` ❌ (renamed to `profile` / `Profile`)

**Remaining valid usages:**
- `user.profile.firstName` ✅ (correct new architecture)
- `user.profile.lastName` ✅ (correct new architecture)
- `user.accessProfile.companyId` ✅ (correct new architecture)
- `accessProfile.companyId: true` ✅ (select clause)
- `request.user.companyId` ✅ (JWT claim populated from `accessProfile.companyId`
  in `signAccessToken` — NOT the removed User model field; used in
  `rbac.js::requireOwnCompany` and `product.controller.js::myProducts`)
- `request.user.accessType` ✅ (JWT claim from `accessProfile.type`)

**Schema-level confirmation:**
- ✅ `model User`: NO firstName, lastName, fullName, username, companyId columns
- ✅ `model Profile`: HAS firstName, lastName, avatar, metadata
- ✅ `model AccessProfile`: HAS type, companyId, isActive
- ✅ Product/Inquiry: HAS companyId (correct domain ownership)

---

## Access Control Verification

### ✅ AccessProfile.isActive Enforcement

**Login (`auth/auth.service.js`):**
```javascript
// Panel users (STAFF, COMPANY) whose AccessProfile has been deactivated by
// an admin must not be able to sign in — even though their auth identity
// (User.status) is still ACTIVE.
const accessType = accessProfile?.type ?? null;
if ((accessType === 'STAFF' || accessType === 'COMPANY') && accessProfile?.isActive === false) {
  throw createError(403, 'ACCESS_DISABLED', 'دسترسی این حساب کاربری غیرفعال شده است.');
}
```

**Token Refresh (`auth/auth.service.js`):**
```javascript
// Reject token refresh for deactivated panel users (STAFF/COMPANY).
const refreshAccessType = accessProfile?.type ?? null;
if ((refreshAccessType === 'STAFF' || refreshAccessType === 'COMPANY') && accessProfile?.isActive === false) {
  throw createError(403, 'ACCESS_DISABLED', 'دسترسی این حساب کاربری غیرفعال شده است.');
}
```

**Result:**
- ✅ Admins can disable panel access via `AccessProfile.isActive = false`
- ✅ Disabled users cannot login (even if User.status = ACTIVE)
- ✅ Disabled users' refresh tokens are rejected
- ✅ CUSTOMER access is NOT gated (not a "panel")

---

## Company User Management

### ✅ Admin Can Create Company Employees

**Implementation:** `backend/src/modules/users/user.service.js::createUser()`

**Flow:**
1. Admin provides: email, phone, firstName, lastName, companyId, roles[]
2. Creates User (auth identity)
3. Creates Profile (firstName, lastName)
4. Creates AccessProfile (type=COMPANY, companyId)
5. Assigns roles via UserRole

**Admin Actions:**
- ✅ Activate/deactivate via `AccessProfile.isActive`
- ✅ Change user roles
- ✅ Move user between companies (update AccessProfile.companyId)

---

## Company Registration Flow

### ✅ Correct Implementation

**File:** `backend/src/modules/auth/auth.service.js::registerCompany()`

**Creates:**
1. Company (status=PENDING)
2. Manager User (status=PENDING)
3. Profile (manager firstName, lastName)
4. AccessProfile (type=COMPANY, companyId, **isActive=false**)
5. CompanyInquiryLimit (defaults)

**NO role assigned automatically** ✅  
**Panel access inactive until admin approval** ✅  
Admin assigns roles and activates access after approval.

---

## Authentication Response Structure

### ✅ Consistent Response Format

**All auth endpoints return:**
```javascript
{
  user,           // User (id, email, phone, status)
  profile,        // Profile | null (firstName, lastName, avatar, metadata)
  accessProfile,  // AccessProfile (type, companyId, isActive, company) | null
  roles,          // string[]
  permissions,    // string[]
  tokens          // { accessToken, refreshToken, expiresIn }
}
```

**Verified in:**
- `login()`
- `refresh()` (returns tokens; context comes from `getMe`)
- `getMe()`
- `register()`
- `registerCompany()`

The frontend auth store (`packages/auth/store.js`) consumes this exact shape via
`setAuthContext()` for both `login()` and `getProfile()`.

---

## Syntax Verification

**Executed:** `node --check` on all modified backend modules  
**Result:** ✅ ALL_OK

**Files verified:**
- auth/auth.service.js, auth.schemas.js, auth.controller.js, auth.routes.js
- users/user.service.js, user.controller.js, user.routes.js, user.schemas.js
- companies/company.service.js
- products/product.service.js, product.controller.js
- inquiries/inquiry.service.js
- admin/admin.service.js
- settings/settings.service.js, settings.controller.js, settings.schemas.js, settings.routes.js
- middlewares/rbac.js
- app.js

---

## Final Confirmation

### Application Selection Rules
✅ **No application selection depends on roles anymore.**  
Application is selected ONLY by `accessProfile.type`:
- STAFF → Admin panel
- COMPANY → Company panel
- CUSTOMER → Public website

Roles control **permissions inside** the selected application, NOT which application to load.

### Personal Information Location
✅ **No personal information exists inside AccessProfile.**  
All personal fields (firstName, lastName, avatar, metadata) live in the Profile model.

### Backend Module Dependencies
✅ **No backend module depends on the removed User fields.**  
All modules now correctly access:
- Personal info via `user.profile.*`
- Company membership via `user.accessProfile.companyId`
- Access type via `user.accessProfile.type`
- Access status via `user.accessProfile.isActive`

---

## Conclusion

The backend architecture audit is **COMPLETE**. All legacy User model references
have been successfully migrated to the new three-entity architecture, and the
personal-profile table has been renamed `CustomerProfile` → `Profile`. The system
now correctly separates:

1. **Authentication** (User)
2. **Personal information** (Profile)
3. **Authorization context** (AccessProfile)

The backend is ready for the remaining frontend migration.

---

**Audit completed by:** Backend Architecture Migration Task  
**Next step:** Remaining frontend migration to consume the new backend structure

---

## Addendum — Second Review (Business-Rule Corrections)

A follow-up review surfaced correctness gaps against the business rules. All
were fixed:

### 1. ✅ CUSTOMER users no longer get an AccessProfile
**Rule:** AccessProfile is ONLY for STAFF and COMPANY. CUSTOMER users must not
require one.  
**File:** `auth/auth.service.js::register()`  
**Change:** Removed the `accessProfile.create({ type: 'CUSTOMER' })` call. The
customer registration transaction now creates only **User + Profile +
CUSTOMER_USER role**, and returns `accessProfile: null`. A user with no
AccessProfile is treated as a plain website customer; `login()`'s app guard only
restricts the `admin`/`company` panels, so this is safe.

### 2. ✅ Company users are real users with firstName/lastName
**Rule:** Company users always have a personal name — do not skip the personal
profile just because they are not "customers".  
**File:** `auth/auth.service.js::registerCompany()`  
**Change:** The manager account now also creates a **Profile
(firstName, lastName)**. Added `managerFirstName` / `managerLastName` as required
inputs (already present in `auth.routes.js` schema; the service now consumes and
validates them). Clarified in comments that `Profile` is the personal profile
table for EVERY human user (customers, company employees, staff).

### 3. ✅ Company registration → panel access inactive until approval
**Rule:** On company registration, panel access must be inactive until an admin
approves.  
**File:** `auth/auth.service.js::registerCompany()`  
**Change:** The manager's `AccessProfile` is now created with
**`isActive: false`** (was `true`). Combined with the login/refresh isActive
enforcement, the manager cannot access the company panel until approval.

### 4. ✅ Company approval activates AccessProfile.isActive
**File:** `companies/company.service.js::changeStatus()`  
**Change:** When a PENDING company transitions to ACTIVE, in addition to
activating the User rows, the transaction now flips
**`AccessProfile.isActive → true`** for that company's users:
```javascript
await tx.accessProfile.updateMany({
  where: { companyId: Number(id), isActive: false },
  data: { isActive: true },
});
```
This only enables access; it assigns **no role**.

### 5. ✅ Role assignment happens ONLY after admin approval
**Verified:**
- `registerCompany()` assigns **no role** (no `userRole.create`).
- Company approval (`changeStatus`) assigns **no role** — it only toggles status
  and `isActive`.
- Roles are granted exclusively through the admin-driven users module
  (`user.service.js::setUserAccess()` / `createUser()`), which are separate,
  explicit admin actions.

### 6. ✅ User-returning APIs return display name correctly
Confirmed every user-listing/relation path resolves the name from
`profile.{firstName, lastName}`:

| API / relation | Location | Name source |
|---|---|---|
| Admin users list | `users/user.service.js::listUsers` (`USER_SELECT`) | `profile.firstName/lastName` |
| Admin user detail | `users/user.service.js::getUser` | `profile.firstName/lastName` |
| Company users list | `companies/company.service.js::getCompanyById` | flattened `firstName/lastName` from `profile` |
| Recent users (admin stats) | `admin/admin.service.js::getStats` | `profile.firstName/lastName` |
| Product `createdBy` | `admin/admin.service.js`, `products/product.service.js` | `profile.firstName/lastName` |
| Product status `changedBy` | `products/product.service.js` | `profile.firstName/lastName` |
| Inquiry status `changedBy` | `inquiries/inquiry.service.js` | `profile.firstName/lastName` |
| Auth `/login`, `/me` | `auth/auth.service.js::buildUserContext` | `profile` object returned |

No dedicated AuditLog model exists in the schema; status-history relations
(`changedBy`) are the audit trail and all resolve names correctly.

### Confirmation (unchanged, re-verified)
- ✅ No personal fields were introduced into AccessProfile.
- ✅ No application selection depends on roles.
- ✅ CUSTOMER users have no AccessProfile; STAFF/COMPANY do.
- ✅ All second-review files pass `node --check` (ALL_OK).

---

## Addendum — Third Review (CustomerProfile → Profile rename)

The personal-profile table was still named `CustomerProfile`, which implied it
belonged only to customers. It has been renamed to `Profile` to match the
architecture (personal profile for EVERY human user), and the auth wire-key
`customerProfile` was renamed to `profile` end-to-end.

**Backend files changed:**
- `backend/prisma/schema.prisma` (`model CustomerProfile` → `model Profile`, `User.profile` relation)
- `backend/src/modules/auth/auth.service.js` (`prisma.profile`, `PROFILE_SELECT`, `profile` key)
- `backend/src/modules/auth/auth.schemas.js` (`profileResponse`)
- `backend/src/modules/auth/auth.controller.js` (`profile` in login/register/me payloads)
- `backend/src/modules/auth/auth.routes.js` (docs/summaries; email-only login)
- `backend/src/modules/users/user.service.js`, `companies/company.service.js`,
  `admin/admin.service.js`, `products/product.service.js`,
  `inquiries/inquiry.service.js`, `settings/settings.service.js`
  (all `prisma.customerProfile`/`customerProfile:` relation references → `profile`)
- Swagger/OpenAPI route docs (`utils/openapi-route-docs.js`) — legacy field cleanup

**Frontend files changed:**
- `packages/auth/store.js` (state, storage key, getters, actions → `profile`)
- `apps/website/src/layouts/PublicLayout.vue` (`authStore.profile`)

**Verification:**
- ✅ Repo-wide search for `customerProfile|CustomerProfile|CUSTOMER_PROFILE` returns
  matches ONLY inside this audit report (documentation), never in source.
- ✅ `prisma generate` succeeds with `model Profile`.
- ✅ All auth responses return `{ user, profile, accessProfile, roles, permissions, tokens }`.
