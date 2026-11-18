# Agent Coordination — Active Board

**Updated:** 2026-11-18  
**Repository:** `gameacc2025/martest`  
**Integration branch:** `main` only  
**Latest code baseline tested:** `10e0e9ef6bf215b66afa5c0eac571bc9d4e9faaa`  
**Latest documentation HEAD:** `e8e3190a416d8c9c766f0139ad365e12a78b7bcd`  
**Coordinator:** Lead  
**Owner communication:** Persian

## Active task

**PROJECT-WIDE-AUDIT-AND-REPAIR-2026-11-18 — IN_PROGRESS**

The owner authorized project-wide review and corrections. Work is performed on existing `main` only. Read-only inspection may be parallel; all writes are serialized by the lead. No worker commits/pushes, branches, worktrees, detached checkouts, force-pushes, resets or destructive cleanup.

## Current slice status

| Slice | Status | Evidence |
|---|---|---|
| Prisma migration parity | PASS | Fresh PostgreSQL migration and every Prisma model/table parity check |
| CI | PASS | Architecture graph, Frontend/Shared tests, Backend tests, Website/Company/Admin builds |
| Support SLA | IMPLEMENTED | Pause/resume, queue-scoped recipients, import-safe worker, timezone-aware calendar, validation/tests |
| CRM audit/status | IMPLEMENTED | Actor ID forwarded; transaction-aware audit writer and tests |
| Audit hardening | IMPLEMENTED | Recursive case-insensitive redaction; writer tests; safe IP and bounded correlation IDs |
| Support SLA policy relation | IMPLEMENTED | Nullable `SupportTicket.slaPolicyId` FK + additive migration |
| AD-1 | PASS | CUSTOMER RFQ create denied; existing buyer-owned inquiry actions preserved |
| AD-3 | PASS | COMPANY user-management grants revoked/reconciled |
| AD-4 | ENFORCED | Retail/checkout and finance routes/navigation dormant pending owner-approved domain decisions |
| SMS consent/provider gates | IMPLEMENTED | Defaults OFF; explicit opt-in, provider validation and quota required; live delivery NOT VERIFIED |
| Runtime + Browser | IN PROGRESS | Docker, health, migrations, schema parity, seeds twice and AD-1/AD-3 checks passed; browser smoke running |

## Latest workflow evidence

- CI: [44301790110](https://github.com/gameacc2025/martest/actions/runs/44301790110) — **PASS**
- Database Migration Validation: [44301790094](https://github.com/gameacc2025/martest/actions/runs/44301790094) — **PASS**
- Runtime Validation: [44301790032](https://github.com/gameacc2025/martest/actions/runs/44301790032) — **IN PROGRESS**, browser smoke step only remains after successful Docker/health/migration/parity/seed/RBAC steps.

These workflows ran against code SHA `10e0e9e`; the current HEAD may be later due to documentation-only commits. Do not describe the docs HEAD as separately code-tested.

## Remaining queue

1. Finish and inspect all-panel browser smoke/API proxy results.
2. Reconcile stale Audit API contract at `docs/api-contracts/auth-audit.md` with actual routes, query parameters, writer API, STAFF-only access and append-only retention behavior.
3. Continue company-owned endpoint tenant/IDOR review; no exhaustive security sign-off yet.
4. Replace dashboard sample data with scoped real aggregates or clearly marked unavailable values. Keep retail/finance prototype screens dormant.
5. Audit retention/archival needs owner/legal approval; never bypass the append-only trigger or invent a retention period.
6. Continue auth/PKCE, RBAC, catalog, inquiry/subscriptions, CMS, notification, deployment and observability review.

## Coordination and safety rules

- Canonical repository/branch: `gameacc2025/martest` / `main` only.
- Lead owns shared hotspots: app registration, Prisma schema/migrations, permission registry, seed orchestrator, manifests, shared API exports and global design tokens.
- Workers receive exact non-overlapping file ownership and return scoped evidence; workers never commit or push.
- Preserve existing local changes, untracked files, stashes and DB data. Do not use destructive Git or database operations.
- Browser automation is authorized for acceptance; run sequentially when resource constraints require it and record exact evidence.
- GitHub connection cannot inspect the owner's Windows workspace, local Docker daemon or developer PostgreSQL; these remain **NOT VERIFIED**.
- Do not claim external SMTP, Twilio, payment or production deployment success without live provider/environment evidence.

## Handoff

Read `.ai/current-task.md` for the detailed repair inventory and next action. Append verified outcomes to `.ai/WORKLOG.md`; keep this board limited to active ownership, status, evidence and next actions.
