# API-1 Domain Contract: Auth Challenges & Audit Log

**Status:** DRAFT — awaiting review/freeze before implementation  
**Document ID:** API-1-AUTH-AUDIT-CONTRACT  
**Last Updated:** 2026-11-09  
**Base main SHA:** (to be recorded at freeze)

---

## 1. Overview

This contract defines the complete API surface, data models, permission matrix, state machines, and UI contracts for the **Auth Challenges** and **Audit Log** domains. The database foundations (Prisma models `AuthChallenge` and `AuditLog`, enums `AuthChallengePurpose`, `AuthChallengeChannel`) were merged in PR #90 (migration `20261108000100_auth_audit`). No new migration is expected unless `LOGIN_MFA` is approved.

### 1.1 Scope

| Domain | Purpose |
|--------|---------|
| **Auth Challenges** | One-time, hashed OTP/challenge codes for password reset, phone verification, email verification, and (optionally) login MFA. Request → verify → consume lifecycle with abuse controls. |
| **Audit Log** | Immutable, append-only record of security-relevant actions across all three apps (Website, Company, Admin). Staff-only search API with redaction. |

### 1.2 Out of Scope

- Core login/refresh/logout (already implemented in `auth` module).
- PKCE handoff (already implemented in `auth/handoff.service`).
- User/role/permission CRUD (already in `users`, `roles`, `permissions` modules).
- Support ticketing (API-2), CMS (API-3), CRM (API-4), Retail (API-5), Finance (API-6).

---

## 2. Auth Challenges — API Contract

### 2.1 Endpoints

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| `POST` | `/api/v1/auth/challenges/request` | Authenticated (any context) | Request a new challenge (OTP) for the current user. |
| `POST` | `/api/v1/auth/challenges/verify` | Public (no auth) | Verify a challenge code without consuming it (e.g., check OTP before password reset). |
| `POST` | `/api/v1/auth/challenges/consume` | Public (no auth) | Verify AND consume a challenge code (finalizes password reset, phone/email verification). |
| `GET` | `/api/v1/auth/challenges/me` | Authenticated (any context) | List current user's active/pending challenges (for session management UI). |

### 2.2 Request/Response Schemas

#### 2.2.1 Request Challenge

```json
POST /api/v1/auth/challenges/request
{
  "purpose": "PASSWORD_RESET" | "PHONE_VERIFICATION" | "EMAIL_VERIFICATION" | "LOGIN_MFA",
  "channel": "SMS" | "EMAIL",
  "destination": "string (phone or email, max 320 chars)"
}
```

**Response (201):**
```json
{
  "data": {
    "challengeId": "integer",
    "expiresIn": "integer (seconds)",
    "resendCooldown": "integer (seconds)"
  }
}
```

**Errors:**
- `400 VALIDATION_ERROR` — missing/invalid fields
- `400 INVALID_PURPOSE` — purpose not allowed for current context (e.g., LOGIN_MFA not approved)
- `400 INVALID_CHANNEL` — channel/purpose mismatch (SMS only for PHONE_VERIFICATION/LOGIN_MFA)
- `400 DESTINATION_MISMATCH` — destination does not match user's verified phone/email
- `429 RATE_LIMITED` — resend cooldown active or hourly/daily limit exceeded
- `403 ACCESS_DISABLED` — user's AccessProfile.isActive = false (STAFF/COMPANY)

#### 2.2.2 Verify Challenge (non-consuming)

```json
POST /api/v1/auth/challenges/verify
{
  "challengeId": "integer",
  "code": "string (6-8 digits)"
}
```

**Response (200):**
```json
{
  "data": {
    "valid": true,
    "purpose": "PASSWORD_RESET",
    "remainingAttempts": 3
  }
}
```

**Errors:**
- `400 VALIDATION_ERROR`
- `404 CHALLENGE_NOT_FOUND`
- `400 CHALLENGE_EXPIRED`
- `400 CHALLENGE_CONSUMED`
- `400 CHALLENGE_INVALIDATED`
- `400 MAX_ATTEMPTS_EXCEEDED`

#### 2.2.3 Consume Challenge

```json
POST /api/v1/auth/challenges/consume
{
  "challengeId": "integer",
  "code": "string (6-8 digits)"
}
```

**Response (200):**
```json
{
  "data": {
    "consumed": true,
    "purpose": "PASSWORD_RESET",
    "userId": 123
  }
}
```

**Errors:** Same as verify + `400 CHALLENGE_ALREADY_CONSUMED`

#### 2.2.4 List My Challenges

```json
GET /api/v1/auth/challenges/me
```

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "purpose": "PASSWORD_RESET",
      "channel": "SMS",
      "destinationMasked": "+98 9XX XXX XXXX",
      "expiresAt": "2026-11-09T12:00:00Z",
      "attemptCount": 0,
      "maxAttempts": 5,
      "status": "PENDING" | "CONSUMED" | "EXPIRED" | "INVALIDATED"
    }
  ]
}
```

### 2.3 Business Rules

1. **Purpose/Channel Matrix**
   - `PASSWORD_RESET` → `SMS` or `EMAIL`
   - `PHONE_VERIFICATION` → `SMS` only
   - `EMAIL_VERIFICATION` → `EMAIL` only
   - `LOGIN_MFA` → `SMS` or `EMAIL` (requires policy approval)

2. **Destination Validation**
   - For `PHONE_VERIFICATION`/`LOGIN_MFA` via SMS: destination must match user's `phone` (normalized).
   - For `EMAIL_VERIFICATION`/`LOGIN_MFA`/`PASSWORD_RESET` via EMAIL: destination must match user's `email`.
   - Generic error if mismatch (no enumeration).

3. **Rate Limits & Abuse Controls**
   - Per-user, per-purpose, per-channel: max 3 requests / 15 minutes.
   - Per-destination (phone/email): max 5 requests / hour.
   - Global IP-based: max 20 requests / 15 minutes (in addition to route-level rate limit).
   - Resend cooldown: 60 seconds (returned in `resendCooldown`).
   - Max attempts per challenge: 5 (configurable via `maxAttempts`).
   - On max attempts exceeded: challenge auto-invalidated (`invalidatedAt` set).

4. **Challenge Lifecycle**
   - `PENDING` → `CONSUMED` (on successful consume)
   - `PENDING` → `EXPIRED` (when `expiresAt` passes)
   - `PENDING` → `INVALIDATED` (on max attempts, manual revoke, or new challenge for same purpose)
   - Creating a new challenge for same (user, purpose, channel) invalidates previous pending ones.

5. **Security**
   - Only `secretHash` stored (bcrypt/argon2). Raw code never logged or returned.
   - Generic error messages — no enumeration of valid challenge IDs.
   - `verify` does not consume; `consume` is idempotent (returns success if already consumed by same caller).

---

## 3. Audit Log — API Contract

### 3.1 Endpoints

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| `GET` | `/api/v1/audit-logs` | STAFF + `audit_logs.read` | Search/filter audit log entries. |
| `GET` | `/api/v1/audit-logs/:id` | STAFF + `audit_logs.read` | Get single audit entry with full metadata. |

### 3.2 Query Parameters (Search)

| Parameter | Type | Description |
|-----------|------|-------------|
| `from` | ISO8601 datetime | Start of `occurredAt` range (inclusive) |
| `to` | ISO8601 datetime | End of `occurredAt` range (inclusive) |
| `actorUserId` | integer | Filter by actor user ID |
| `actorAccessType` | STAFF\|COMPANY\|CUSTOMER | Filter by actor's access context |
| `companyId` | integer | Filter by company (tenant scope) |
| `action` | string | Exact action match (e.g., `user.login`, `product.publish`) |
| `entityType` | string | Target entity type (e.g., `User`, `Product`, `Company`) |
| `entityId` | string | Target entity ID |
| `outcome` | SUCCESS\|FAILURE\|ERROR | Filter by outcome |
| `requestId` | string | Correlation ID for request tracing |
| `page` | integer (default 1) | Page number |
| `limit` | integer (default 50, max 200) | Page size |

### 3.3 Response Schema

```json
GET /api/v1/audit-logs
{
  "data": [
    {
      "id": "12345",
      "actorUserId": 10,
      "actorAccessType": "STAFF",
      "companyId": 5,
      "action": "user.login",
      "entityType": "User",
      "entityId": "10",
      "requestId": "req_abc123",
      "source": "admin",
      "outcome": "SUCCESS",
      "ipAddress": "203.0.113.45",
      "userAgent": "Mozilla/5.0...",
      "metadata": { "loginApp": "admin", "mfaUsed": false },
      "occurredAt": "2026-11-09T10:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 1234,
    "totalPages": 25
  }
}
```

### 3.4 Redaction Rules

The following fields MUST be redacted (set to `null` or omitted) in API responses:
- `metadata.passwordHash`, `metadata.currentPassword`, `metadata.newPassword`
- `metadata.otp`, `metadata.code`, `metadata.secret`, `metadata.token`
- `metadata.refreshToken`, `metadata.accessToken`
- `metadata.creditCard`, `metadata.bankAccount`
- Any field matching `/secret|password|token|otp|code|key/i` in metadata keys

Redaction is applied in the service layer before serialization; the database stores full metadata for forensic integrity.

### 3.5 Action Taxonomy (Standardized)

| Domain | Action Format | Examples |
|--------|---------------|----------|
| Auth | `auth.{login,logout,refresh,password_change,password_reset_request,password_reset_consume,phone_verify_request,phone_verify_consume,email_verify_request,email_verify_consume,mfa_request,mfa_consume,handoff_create,handoff_redeem}` | `auth.login`, `auth.password_reset_consume` |
| User | `user.{create,update,delete,activate,deactivate,role_assign,role_revoke}` | `user.create`, `user.role_assign` |
| Company | `company.{create,update,delete,activate,deactivate,verify,settings_change}` | `company.activate` |
| Product | `product.{create,update,delete,publish,hide,archive,approve,reject,feature,status_change}` | `product.publish` |
| Inquiry | `inquiry.{create,respond,status_change,reveal,item_add,item_update}` | `inquiry.respond` |
| Settings | `settings.{profile_update,password_change,notification_prefs_update,avatar_upload,avatar_delete}` | `settings.profile_update` |
| Admin | `admin.{role_create,role_update,role_delete,permission_assign,system_setting_change}` | `admin.system_setting_change` |

### 3.6 Audit Service — Write Path (Internal)

Other modules call `auditService.log({ ... })` — NOT a public API.

```javascript
await auditService.log({
  actorUserId: request.user?.id ?? null,
  actorAccessType: request.user?.accessType ?? null, // 'STAFF' | 'COMPANY' | 'CUSTOMER'
  companyId: request.user?.companyId ?? null,
  action: 'auth.login',
  entityType: 'User',
  entityId: String(request.user?.id ?? 'anonymous'),
  requestId: request.id, // Fastify request ID
  source: 'admin' | 'company' | 'website' | 'api',
  outcome: 'SUCCESS' | 'FAILURE' | 'ERROR',
  ipAddress: request.ip,
  userAgent: request.headers['user-agent'],
  metadata: { /* safe, serializable context */ }
});
```

- Fire-and-forget (non-blocking): failures logged but don't break primary operation.
- `actorUserId` nullable for unauthenticated actions (e.g., public registration attempt).
- `companyId` derived from actor's AccessProfile for tenant scoping.

---

## 4. Permission Matrix

| Permission Key | Description | Context | Default Roles |
|----------------|-------------|---------|---------------|
| `auth_challenges.request` | Request a challenge for self | CUSTOMER, COMPANY, STAFF | CUSTOMER_USER, COMPANY_MANAGER, STAFF_ADMIN |
| `auth_challenges.verify` | Verify/consume challenge (public) | Public (no auth) | — |
| `audit_logs.read` | Search/view audit logs | STAFF only | STAFF_ADMIN, STAFF_AUDITOR |
| `audit_logs.export` | Bulk export (if approved) | STAFF only | STAFF_ADMIN |

**Notes:**
- `auth_challenges.verify/consume` are public endpoints (no auth required) — authorization is via challenge ownership (challengeId + code).
- `audit_logs.read` requires `STAFF` AccessProfile + permission. COMPANY/CUSTOMER contexts are denied even with permission.
- No `auth_challenges.manage` — users only manage their own challenges via `/me` endpoint.

---

## 5. Access Context & Ownership Rules

| Resource | Owner | STAFF Access | COMPANY Access | CUSTOMER Access |
|----------|-------|--------------|----------------|-----------------|
| AuthChallenge | User (via userId) | Full (any user in system) | Own company users only | Own challenges only |
| AuditLog | System (append-only) | Full (all tenants) | Own company only (via companyId filter) | Denied |

- **AuthChallenge**: STAFF can view any user's challenges via admin user management. COMPANY users can only see challenges for users in their company (via AccessProfile.companyId). CUSTOMER users see only their own.
- **AuditLog**: STAFF sees all. COMPANY sees only entries where `companyId` matches their company. CUSTOMER denied entirely.

---

## 6. State Transitions

### 6.1 AuthChallenge

```
CREATED (PENDING)
    │
    ├── verify() → remains PENDING (attemptCount++)
    ├── consume() → CONSUMED (consumedAt set)
    ├── expire (expiresAt passed) → EXPIRED
    ├── maxAttempts exceeded → INVALIDATED (invalidatedAt set)
    ├── new challenge same purpose → INVALIDATED (previous)
    └── manual revoke (admin) → INVALIDATED
```

### 6.2 AuditLog

**Immutable.** No state transitions. Append-only at DB level (trigger prevents UPDATE/DELETE).

---

## 7. Transaction Boundaries

| Operation | Transaction Scope |
|-----------|-------------------|
| Request challenge | Single: create AuthChallenge, invalidate previous same-purpose |
| Verify challenge | Read-only (no transaction) |
| Consume challenge | Single: update AuthChallenge (consumedAt, attemptCount), plus domain action (password reset, phone verify, etc.) |
| Audit log write | Autonomous (fire-and-forget, own transaction or async queue) |
| Audit log read | Read-only |

---

## 8. UI Routes & Screens

### 8.1 Admin (STAFF)

| Route | Screen | States |
|-------|--------|--------|
| `/admin/security/audit` | Security Event Explorer | Loading, Empty, Error, Results (paginated, filterable) |
| `/admin/security/audit/:id` | Event Detail | Loading, Error, Detail (with safe metadata diff) |
| `/admin/users/:id/sessions` | User Session Management | Loading, Empty, Error, Active Sessions (with revoke) |

### 8.2 Company (COMPANY)

| Route | Screen | States |
|-------|--------|--------|
| `/company/security` | Personal Security Settings | Loading, Error, Form (password, 2FA, sessions) |
| `/company/security/sessions` | Active Sessions | Loading, Empty, Error, Sessions (with revoke) |

### 8.3 Website (CUSTOMER)

| Route | Screen | States |
|-------|--------|--------|
| `/security` | Security Settings | Loading, Error, Form (password, phone/email verify) |
| `/security/sessions` | Active Sessions | Loading, Empty, Error, Sessions (with revoke) |
| `/verify/phone` | Phone Verification | Loading, Error, Success, Resend Cooldown |
| `/verify/email` | Email Verification | Loading, Error, Success, Resend Cooldown |
| `/password/reset` | Password Reset Request | Loading, Error, Success (check phone/email) |
| `/password/reset/confirm` | Password Reset Confirm | Loading, Error, Success |

---

## 9. Prisma Models Reused (No New Migration)

| Model | Source Migration |
|-------|-----------------|
| `AuthChallenge` | `20261108000100_auth_audit` |
| `AuditLog` | `2061108000100_auth_audit` |
| `AuthChallengePurpose` (enum) | Same |
| `AuthChallengeChannel` (enum) | Same |

**Migration Required:** `NONE` — unless `LOGIN_MFA` is added to `AuthChallengePurpose` enum (additive enum value migration).

---

## 10. Seed Scenarios (`backend/prisma/seeds/auth-audit.js`)

### 10.1 Users & Sessions

- 3 STAFF users (1 admin, 1 auditor, 1 support) with active sessions
- 5 COMPANY users across 3 companies with active/inactive sessions
- 10 CUSTOMER users with various session states
- 2 revoked sessions (logout-all) per context
- 1 expired refresh token per context

### 10.2 Auth Challenges

| User | Purpose | Channel | Status |
|------|---------|---------|--------|
| CUSTOMER_1 | PASSWORD_RESET | SMS | CONSUMED |
| CUSTOMER_2 | PASSWORD_RESET | EMAIL | PENDING (2 attempts) |
| CUSTOMER_3 | PHONE_VERIFICATION | SMS | CONSUMED |
| CUSTOMER_4 | EMAIL_VERIFICATION | EMAIL | EXPIRED |
| COMPANY_1 | PASSWORD_RESET | SMS | INVALIDATED (max attempts) |
| STAFF_1 | LOGIN_MFA | SMS | PENDING (if approved) |

### 10.3 Audit Logs

- 50 entries across all action categories
- 20 SUCCESS, 10 FAILURE, 5 ERROR outcomes
- 30 STAFF, 15 COMPANY, 5 CUSTOMER actors
- 10 with `requestId` for correlation tracing
- 5 with redacted metadata (password, token fields)
- Date range: last 30 days

### 10.4 Production Guard

```javascript
if (process.env.NODE_ENV === 'production' && !process.env.SEED_DEMO_DATA) {
  console.log('[seed:auth-audit] Skipped in production');
  return;
}
```

---

## 11. Tests & Acceptance Criteria

### 11.1 Backend (Service + Route)

| Test | Command | Expected |
|------|---------|----------|
| Challenge request rate limit | `pnpm --filter backend test auth-challenges.rate-limit` | 429 after 3 requests/15min |
| Challenge verify consumes attempt | `pnpm --filter backend test auth-challenges.verify-attempts` | attemptCount increments |
| Challenge consume invalidates | `pnpm --filter backend test auth-challenges.consume-invalidates` | Challenge status = CONSUMED |
| Challenge expiry | `pnpm --filter backend test auth-challenges.expiry` | 400 CHALLENGE_EXPIRED |
| Max attempts → invalidated | `pnpm --filter backend test auth-challenges.max-attempts` | status = INVALIDATED |
| Cross-context denial (audit) | `pnpm --filter backend test audit-logs.company-denied` | 403 for COMPANY |
| Audit redaction | `pnpm --filter backend test audit-logs.redaction` | No secrets in response |
| Audit tenant isolation | `pnpm --filter backend test audit-logs.tenant-isolation` | COMPANY sees only own companyId |

### 11.2 UI Component/Page

| Test | Command |
|------|---------|
| Admin audit explorer filters | `pnpm --filter admin test SecurityEventExplorer` |
| Admin session revoke confirmation | `pnpm --filter admin test UserSessionManagement` |
| Company security form validation | `pnpm --filter company test SecuritySettings` |
| Website phone verify flow | `pnpm --filter website test PhoneVerification` |
| Website password reset flow | `pnpm --filter website test PasswordReset` |

### 11.3 Seed

| Test | Command |
|------|---------|
| Idempotency (2x run) | `pnpm --filter backend test seed:auth-audit:idempotent` |
| Production guard | `pnpm --filter backend test seed:auth-audit:production-guard` |
| Referential integrity | `pnpm --filter backend test seed:auth-audit:integrity` |

---

## 12. Open Decisions (Must Resolve Before Freeze)

| Decision | Options | Recommendation |
|----------|---------|----------------|
| **LOGIN_MFA purpose** | Add to enum + implement / Defer to later | Defer — no policy approval yet |
| **Concurrent devices** | Allow multiple (add device metadata to RefreshToken) / Single active session (current behavior) | Keep single-session for now; add device metadata in follow-up |
| **MFA mandatory for STAFF** | Yes / No / Opt-in | Opt-in (configurable per-role later) |
| **Audit log retention** | Infinite (current) / 2 years / Configurable | Infinite (append-only, compliance) |
| **Audit export permission** | Add `audit_logs.export` / Not needed | Not needed for MVP |

---

## 13. Integration Checklist (Per Roadmap §3)

- [ ] Contract reviewed and frozen (this document)
- [ ] Backend validation, authorization, ownership and service tests pass
- [ ] API-client/store uses real API, no mock response in production UI
- [ ] UI has complete loading/empty/error/success states and follows Website palette
- [ ] Synthetic seed is realistic, idempotent, production-guarded and tested
- [ ] Domain docs, WORKLOG and current-task updated
- [ ] Coordinator reviews patch against latest main; no conflicting changes
- [ ] Targeted tests/builds run and exact outcomes recorded
- [ ] Direct-to-main commit created; main SHA recorded
- [ ] No live database migration without baseline/status/backup/runbook verification

---

## 14. File Ownership (Per ACTIVE.md)

| Path | Owner |
|------|-------|
| `backend/src/modules/auth-challenges/**` | Auth/Audit agent |
| `backend/src/modules/audit/**` | Auth/Audit agent |
| `packages/api-client/src/authChallenges.js` | Auth/Audit agent |
| `packages/api-client/src/auditLogs.js` | Auth/Audit agent |
| `apps/admin/src/pages/admin/security/**` | Auth/Audit agent |
| `apps/company/src/pages/company/security/**` | Auth/Audit agent |
| `apps/website/src/pages/public/security/**` | Auth/Audit agent |
| `backend/prisma/seeds/auth-audit.js` | Auth/Audit agent |
| `backend/src/app.js` | INT (coordinator) — registration only |
| `packages/permissions/index.js` | INT (coordinator) — permission registry only |

---

**End of Contract**