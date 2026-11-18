# Agent Coordination — Active Board

**Updated:** 2026-11-18  
**Repository:** `gameacc2025/martest`  
**Integration branch:** `main` only  
**Latest tested code baseline:** `24be9b53af92ca1d37f3dd7cf2fd2fc17e47e4f3`  
**Coordinator:** Lead  
**Owner communication:** Persian

## Active task

**PROJECT-WIDE-AUDIT-AND-REPAIR-2026-11-18 — IN_PROGRESS**

The owner authorized project-wide review and corrections. Work is performed on existing `main` only. Read-only inspection may be parallel; all writes are serialized by the lead. No worker commits/pushes, branches, worktrees, detached checkouts, force-pushes, resets or destructive cleanup.

## Verified slice status

| Slice | Status | Evidence |
|---|---|---|
| CI | PASS | [44305796094](https://github.com/gameacc2025/martest/actions/runs/44305796094): 385 Frontend/Shared tests, 18 architecture/session tests, 1,689 Backend tests, all three app builds |
| Prisma migration parity | PASS | [44305796146](https://github.com/gameacc2025/martest/actions/runs/44305796146): fresh PostgreSQL migration and all Prisma model/table checks |
| Runtime + browser | PASS | [44305795993](https://github.com/gameacc2025/martest/actions/runs/44305795993): Compose health, migrations, parity, seeds twice, AD-1/AD-3 grants, 8/8 Playwright tests |
| Support SLA | IMPLEMENTED + VERIFIED | Pause/resume, queue-scoped recipients, import-safe worker, timezone-aware calendar, input validation, applied-policy FK |
| CRM audit/status | IMPLEMENTED + VERIFIED | Actor ID forwarded; transaction-aware central audit writer |
| Audit hardening | IMPLEMENTED + TESTED | Recursive case-insensitive redaction; safe IP; bounded correlation IDs; writer tests |
| Seed credential hardening | VERIFIED | Strong explicit password outside development; no known production fallback; no seed password logs; masked ephemeral runtime secrets |
| AD-1 | PASS | CUSTOMER RFQ creation denied; existing buyer-owned inquiry actions preserved |
| AD-3 | PASS | COMPANY user-management grants revoked/reconciled |
| AD-4 | ENFORCED | Retail/checkout and finance routes/navigation dormant pending owner-approved decisions |
| SMS | GATED | Defaults OFF; explicit opt-in/provider/quota gates; live delivery NOT VERIFIED |

## Main repairs in this audit

- Added forward-only migrations for missing CMS/CRM tables and the Support ticket applied-SLA relation.
- Fixed Support SLA pause/resume, queue scoping, worker import behavior, timezone/holiday arithmetic and validation.
- Centralized CRM audit writes; hardened redaction, client IP and correlation IDs.
- Reconciled AD-1/AD-3 grants and disabled AD-4 retail/finance navigation/routes.
- Fixed Website test expectations and Admin/Company router abort behavior.
- Removed known admin password from env example; require 32+ character explicit password outside development; prevent production CMS demo author seeding; stop logging demo/admin passwords.
- Generated and masked ephemeral runtime database/admin/JWT secrets.

## Remaining queue

1. Continue company-owned endpoint tenant/IDOR review; no exhaustive security sign-off yet.
2. Decide AuditLog retention/archival with owner/legal input. Keep append-only protection; do not purge or invent a period.
3. Add central audit action registry and normalize remaining producers.
4. Replace remaining sample dashboard metrics with tenant-scoped aggregates or clearly labelled unavailable values; keep retail/finance dormant.
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
