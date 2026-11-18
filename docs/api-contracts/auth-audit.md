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

### 3.1 Implemented endpoints (source of truth)

The module is mounted in `backend/src/app.js` at `/api/v1/audit`. All endpoints below require authentication and exact `STAFF` access type.

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| `GET` | `/api/v1/audit/logs` | STAFF + `audit_logs.read` | Search and paginate audit entries. |
| `GET` | `/api/v1/audit/logs/stats` | STAFF + `audit_logs.read` | Aggregate audit statistics. |
| `GET` | `/api/v1/audit/logs/:id` | STAFF + `audit_logs.read` | Retrieve one audit entry. |
| `GET` | `/api/v1/audit/logs/export` | STAFF + `audit_logs.export` | Export matching rows as JSON or CSV. |

Do not use the obsolete `/api/v1/audit-logs` paths in clients or examples.

### 3.2 Search query parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `action` | string | Exact action filter. Existing producers are not yet governed by a central action registry. |
| `entityType` | string | Target entity type. |
| `entityId` | digit string | Target entity ID. |
| `userId` | digit string | Actor user ID; mapped to `actorUserId`. |
| `ipAddress` | string | IP filter. |
| `severity` | `INFO` / `WARN` / `ERROR` / `CRITICAL` | Severity filter. |
| `dateFrom`, `dateTo` | ISO date-time | Inclusive lower and exclusive upper time bounds in the service query. |
| `page` | integer, default 1 | Page number. |
| `pageSize` | integer, default 50, max 500 | Page size. |
| `sortBy` | enum | `occurredAt`, `action`, `entityType`, `entityId`, `actorUserId`, `ipAddress`, `severity`. |
| `sortOrder` | `asc` / `desc` | Sort direction; defaults to `desc`. |

### 3.3 Response and export behavior

Search returns the controller's `{ success, data, meta }` envelope. `meta` includes `total`, `page`, `pageSize`, and `totalPages`. The serialized DTO uses the API names `userId` and `createdAt` for the stored `actorUserId` and `occurredAt` fields. The stats endpoint returns aggregate counts; export returns JSON or CSV and is capped by the service's `EXPORT_MAX_ROWS` limit (50,000).

Do not copy the legacy example below this section from older API versions: its paths, query names, and response field names do not match the current route schemas.

### 3.4 Redaction rules

Audit writers recursively redact sensitive metadata keys (case-insensitive, including nested objects) to the literal value `[REDACTED]` before persistence. The current sensitive-key set includes password/passwordHash, current/new/confirm password, token/refreshToken/accessToken, secret/secretHash, OTP/code/challenge/verifier, API/private keys, card/CVV, SSN/national ID, bank account and IBAN variants. Redaction applies to `before`, `after`, and `extra` metadata snapshots.

Audit metadata must never be treated as a secret store. Add new sensitive aliases to `SENSITIVE_FIELDS` and tests when a new credential or regulated identifier is introduced.

Client IP is taken from Fastify's `request.ip` (or socket fallback). Forwarding headers are not trusted by the audit service unless a trusted-proxy policy is explicitly configured in Fastify. Correlation IDs are accepted only when bounded and composed of safe characters; invalid IDs are replaced with a UUID. When a producer omits `source`, HTTP and explicit-context writers derive it from actor type (`STAFF` → `ADMIN`, `COMPANY` → `COMPANY`, `CUSTOMER` → `WEBSITE`); anonymous/system contexts retain the `ADMIN` HTTP fallback or `SYSTEM` explicit fallback respectively. Producers may still pass an explicit source when the event originates from a known subsystem.

### 3.5 Action naming convention — not yet centrally enforced

The following lowercase dotted names are the preferred convention for new producers, not a guaranteed registry of every existing audit event:

| Domain | Preferred examples |
|--------|--------------------|
| Auth | `auth.login`, `auth.logout`, `auth.password_reset_consume`, `auth.handoff_redeem` |
| User | `user.create`, `user.update`, `user.role_assign` |
| Company | `company.create`, `company.verify`, `company.settings_change` |
| Product | `product.create`, `product.publish`, `product.status_change` |
| Inquiry | `inquiry.create`, `inquiry.respond`, `inquiry.status_change` |
| Settings | `settings.profile_update`, `settings.password_change` |

Existing producers still include domain-specific or generic action strings. A central event registry and full producer normalization remain follow-up work; do not assume all events already conform.

### 3.6 Internal write API (not an HTTP endpoint)

The implemented writer functions are exported from `backend/src/modules/audit/audit.service.js`:

- `recordAuditLog({ request, action, entityType, entityId, metadata, before, after, outcome, severity, source })` — captures actor and HTTP request context from the authenticated Fastify request.
- `recordAuditLogExplicit({ tx, actorUserId, actorAccessType, companyId, action, entityType, entityId, metadata, before, after, outcome, severity, source, ipAddress, userAgent, requestId })` — supports workers/domain services and an optional Prisma transaction client.
- `buildMetadata()` and `redactSensitiveData()` — shared metadata construction and redaction helpers.

Example:

```javascript
const { recordAuditLog } = require('../audit/audit.service');

await recordAuditLog({
  request,
  action: 'inquiry.status_change',
  entityType: 'Inquiry',
  entityId: inquiry.id,
  before: { status: previousStatus },
  after: { status: inquiry.status },
});
```

The writers await the database insert; they are not fire-and-forget. Use `recordAuditLogExplicit({ tx })` when the audit row must commit or roll back atomically with the domain mutation. Do not write to `prisma.auditLog.create()` directly outside the central audit service.

## 4. Permission Matrix

| Permission Key | Description | Context | Default Roles |
|----------------|-------------|---------|---------------|
| `auth_challenges.request` | Request a challenge for self | CUSTOMER, COMPANY, STAFF | CUSTOMER_USER, COMPANY_MANAGER, STAFF_ADMIN |
| `auth_challenges.verify` | Verify/consume challenge (public) | Public (no auth) | — |
| `audit_logs.read` | Search/view audit logs | STAFF only | STAFF_ADMIN, STAFF_AUDITOR |
| `audit_logs.export` | Export matching audit entries as JSON/CSV | STAFF only | STAFF_ADMIN |

**Notes:**
- `auth_challenges.verify/consume` are public endpoints (no auth required) — authorization is via challenge ownership (challengeId + code).
- `audit_logs.read` requires `STAFF` AccessProfile + permission. COMPANY/CUSTOMER contexts are denied even with permission.
- No `auth_challenges.manage` — users only manage their own challenges via `/me` endpoint.

---

## 5. Access Context & Ownership Rules

| Resource | Owner | STAFF Access | COMPANY Access | CUSTOMER Access |
|----------|-------|--------------|----------------|-----------------|
| AuthChallenge | User (via userId) | Route-specific administrative access | Own company users only where explicitly authorized | Own challenges only |
| AuditLog | System (append-only) | Search, view and export only with the matching `audit_logs.*` permission | Denied | Denied |

- Audit read/stats/detail require exact `STAFF` access plus `audit_logs.read`.
- Audit export requires exact `STAFF` access plus `audit_logs.export`.
- COMPANY and CUSTOMER contexts are denied even if a permission is accidentally present.
- There is no COMPANY tenant-scoped AuditLog API in the current route module. Do not document or build one without an explicit security decision.
- AuditLog database rows are append-only; the database trigger rejects UPDATE and DELETE.

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
| `/admin/security/audit` | Security Event Explorer | UI route; API calls use `/api/v1/audit/logs` (paginated, filterable) |
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
| **Audit log retention/archival** | Owner/legal-approved period and archive destination | **OPEN — do not purge or archive automatically.** AuditLog is append-only and the DB trigger rejects UPDATE/DELETE; retention requires an explicit compliance decision and an approved archive design. |
| **Audit export permission** | Add `audit_logs.export` / Not needed | IMPLEMENTED — export route requires STAFF + `audit_logs.export`. |

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