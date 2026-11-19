# Agent Coordination — Active Board

**Updated:** 2026-11-19  
**Repository:** `gameacc2025/martest`  
**Integration branch:** `main` only  
**Latest tested code baseline:** `2f9643ceb7cba299d2f9ffe95e64da0d59cedd62`  
**Coordinator:** Lead  
**Owner communication:** Persian

## Active task

**PROJECT-WIDE-AUDIT-AND-REPAIR-2026-11-18 — IN_PROGRESS**

The owner authorized project-wide review and corrections. Work is performed on existing `main` only. Read-only inspection may be parallel; all writes are serialized by the lead. No worker commits/pushes, branches, worktrees, detached checkouts, force-pushes, resets or destructive cleanup.

## Verified slice status

| Slice | Status | Evidence |
|---|---|---|
| CI | PASS | [44462840522](https://github.com/gameacc2025/martest/actions/runs/44460407273): 69 Frontend/Shared test files, 390 Frontend/Shared tests, 18 architecture/session tests, 1,731 Backend tests, all three app builds |
| Prisma migration parity | PASS | [44462840673](https://github.com/gameacc2025/martest/actions/runs/44460407198): fresh PostgreSQL migration and all Prisma model/table checks |
| Runtime + browser | PASS | [44462840477](https://github.com/gameacc2025/martest/actions/runs/44460407552): Compose health, migrations, parity, seeds twice, AD-1/AD-3 grants, 8/8 Playwright tests |
| Support SLA | IMPLEMENTED + VERIFIED | Pause/resume, queue-scoped recipients, import-safe worker, timezone-aware calendar, input validation, applied-policy FK |
| CRM audit/status | IMPLEMENTED + VERIFIED | Actor ID forwarded; transaction-aware central audit writer |
| Audit hardening | IMPLEMENTED + TESTED | Recursive case-insensitive redaction; safe IP; bounded correlation IDs; writer tests |
| Seed credential hardening | VERIFIED | Strong explicit password outside development; no known production fallback; no seed password logs; masked ephemeral runtime secrets |
| AD-1 | PASS | CUSTOMER RFQ creation denied; existing buyer-owned inquiry actions preserved |
| AD-3 | PASS | COMPANY user-management grants revoked/reconciled |
| AD-4 | ENFORCED | Retail/checkout and finance routes/navigation dormant pending owner-approved decisions |
| SMS | HARDENED + VERIFIED | Defaults OFF; explicit opt-in/provider/quota gates; quota uncertainty skips SMS without aborting business transaction; live delivery NOT VERIFIED |
| OTP abuse controls | HARDENED + VERIFIED | Atomic failed-attempt limits, atomic one-time consume, per-IP verify/consume limits, spoofed forwarding headers ignored |

## Main repairs in this audit

- Added forward-only migrations for missing CMS/CRM tables and the Support ticket applied-SLA relation.
- Inquiry buyer-side mutations now require `leads.update`/`inquiries.update` for COMPANY context at both route and service layers; read-only COMPANY_USER denial has route/service tests. CUSTOMER legacy owner-checked actions remain unchanged.
- Admin active-inquiry KPI now reads `received.new` / `received.byStatus.OPEN`; 5 helper tests prevent the old total-count fallback. OperationsHub is clearly marked sample-only and remains unregistered.
- Read-only source review covered Product visibility/tenant checks, Notification user ownership/app-scoped folders and CMS route visibility/STAFF management; no new issue confirmed in those selected files.
- Fixed Support SLA pause/resume, queue scoping, worker import behavior, timezone/holiday arithmetic and validation.
- Centralized CRM merge audit writes; hardened redaction, client IP and correlation IDs.
- Hardened paid SMS quota handling: quota/subscription uncertainty fails closed for SMS without rolling back the business operation; added regression tests.
- Hardened OTP challenges against concurrent brute-force attempts; verify/consume use atomic attempt state and route-level rate limits; trusted IP comes from Fastify, not raw forwarding headers.
- Reconciled AD-1/AD-3 grants and disabled AD-4 retail/finance navigation/routes.
- Fixed Website test expectations and Admin/Company router abort behavior.
- Removed known admin password from env example; require 32+ character explicit password outside development; prevent production CMS demo author seeding; stop logging demo/admin passwords.
- Generated and masked ephemeral runtime database/admin/JWT secrets.
- Disabled the unapproved LOGIN_MFA challenge purpose in service and HTTP schemas while retaining the enum value; corrected the Auth Challenge API contract.
- Replaced the flaky shared-fixture OTP cooldown test with an isolated checkRateLimits test; 1,725 Backend tests now pass on the verified baseline.
- Closed Support SLA detail IDOR by scoping `getSlaDetails` to the authenticated ticket owner/context; added CUSTOMER, COMPANY, STAFF and route-forwarding regression tests.
- Removed fabricated Company dashboard KPI fallbacks and sample sales chart; unavailable values now show a dash, and gated retail-order links are absent.
- Corrected Company statistics response keys so inquiry counts and recent inquiry rows are not mislabeled as orders.

## Remaining queue

- **Targeted Company/User tenant review (2026-11-18):** Company route guards and tests enforce own-company scoping and STAFF-only settings/lifecycle actions; User service has context and role-scope guards. No new defect confirmed in the reviewed paths; this is not a full sign-off.

1. Continue resource-specific tenant/IDOR review across Support, CMS, Auth and remaining Product surfaces. Targeted review confirms Support ticket/SLA reads are scoped and Auth Challenge verify/consume checks challenge ownership; no exhaustive security sign-off yet.
2. Decide AuditLog retention/archival with owner/legal input. Keep append-only protection; do not purge or invent a period.
3. Add central audit action registry and normalize remaining producers.
4. Active Company dashboard sample values have been removed; hardcoded samples remain only in dormant, unregistered Retail/Finance prototypes, which must stay unreachable until owner approval.
5. Continue auth/PKCE, RBAC, catalog, inquiry/subscriptions, CMS, notifications, deployment and observability review.
6. Live SMTP/Twilio/payment providers and production deployment are NOT VERIFIED.
7. Owner's Windows working tree, local Docker and developer PostgreSQL are NOT VERIFIED by the GitHub connection.

## Coordination and safety rules

- Canonical repository/branch: `gameacc2025/martest` / `main` only.
- Lead owns shared hotspots: app registration, Prisma schema/migrations, permission registry, seed orchestrator, manifests, shared API exports and global design tokens.
- Workers receive exact non-overlapping file ownership and return scoped evidence; workers never commit or push.
- Preserve existing local edits, untracked files, stashes and DB data. Do not use destructive Git or database operations.
- Browser automation is authorized for acceptance; run sequentially when resource constraints require it and record exact evidence.
- GitHub connection cannot inspect the owner's Windows workspace, local Docker daemon or developer PostgreSQL.
- Never claim external SMTP, Twilio, payment or production deployment success without live provider/environment evidence.

## Handoff

Read `.ai/current-task.md` for the detailed repair inventory and next action. Append verified outcomes to `.ai/WORKLOG.md`; keep this board limited to active ownership, status, evidence and next actions.
