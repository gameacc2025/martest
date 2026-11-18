# PROJECT-WIDE-AUDIT-AND-REPAIR-2026-11-18

**Task ID:** PROJECT-WIDE-AUDIT-AND-REPAIR-2026-11-18  
**Status:** IN_PROGRESS — broad source review, staged repairs and CI verification underway  
**Repository:** `gameacc2025/martest`  
**Integration branch:** `main` only  
**Audit baseline:** `cef559d4ffa9dc3c5c3c98967ea08cd4e522060d`  
**Last audited main before this handoff update:** `8fa82417b0176bd14872d5166251e6738acb9ee8`  
**Owner authorization:** project-wide repairs approved on 2026-11-18  
**Owner communication:** Persian

## Scope and execution boundary

Review repository rules, architecture, Prisma schema/migrations/seeds, backend modules, API contracts, Website/Company/Admin apps, shared packages, CI/runtime workflows, tests and operational documentation. Fix verified defects in bounded slices. Preserve accepted business decisions unless aligning implementation to them. Do not invent behavior or claim unrun checks passed.

This session can inspect/update the connected GitHub repository but cannot access the owner's Windows working tree, local Docker daemon, local PostgreSQL or local browser. Those remain **NOT VERIFIED**. All writes are serialized directly on existing `main`; no branches, worktrees, detached checkouts, force-pushes, resets or clean operations.

## Completed implementation slices on main

| Area | Implemented change |
|---|---|
| Audit redaction | Case-insensitive sensitive-key normalization and nested/case-variant tests |
| CRM status | Authenticated actor ID forwarded from route to lead-status service, with route test |
| CRM audit | Lead merge uses transaction-aware central audit writer; request-context and redaction tests |
| Support SLA worker | Exported `runOnce`; removed import-time duplicate worker loop; recipients limited to active STAFF assignees in the same queue; broad all-staff fallback removed |
| Support SLA pause/resume | Pause state derived from events; working-minute duration extends both deadlines on resume; duplicate pause/resume guards; worker/service tests |
| AD-1 | CUSTOMER RFQ creation denied at route and service; seed removes create grants; existing buyer-owned inquiry actions remain ownership checked |
| AD-3 | COMPANY user-management grants removed; seed deletes stale grants from existing databases |
| AD-4 | Website cart/checkout/orders routes and active cart/wishlist UI disabled; future components/stores retained dormant |
| SMS notifications | Event defaults OFF; SMS preference/dispatch require validated Twilio configuration, explicit opt-in and quota; tests and docs updated |
| Database parity | Forward-only migration adds Faq, Page, LeadStatusHistory and CRMFieldAudit; all-model Prisma/PostgreSQL parity script and CI/runtime checks added |

## Verification status

- Local backend/frontend tests, builds, Docker, PostgreSQL and browser runs: **NOT RUN** in this session.
- Latest observed GitHub Actions for SHA `58c8de6102181630903883cf56a2adb8535e21f5`: CI `44227272875`, Database Migration Validation `44227272649`, Runtime Validation `44227272595` were **IN_PROGRESS** at last poll. Frontend/shared tests and Compose configuration were still running; DB migration/parity, backend tests, seeds and browser checks had not completed.
- Documentation-only commits were made after that poll; poll Actions again for the current `main` HEAD. Do not treat the earlier run state as final.
- Fresh PostgreSQL migration, existing-database upgrade, seed-twice, full schema parity, RBAC reconciliation and browser journeys: **NOT VERIFIED** until their current workflows pass.
- Live SMTP/Twilio delivery: **NOT VERIFIED**.
- No production DB, secrets or environment files were accessed.

## Remaining confirmed work

1. **SLA calendar:** `addWorkingMinutes`, `isWorkingDay` and pause accounting still need to honor the configured calendar timezone rather than the host process timezone. The pause implementation currently follows existing calendar arithmetic; validate and correct timezone behavior before production use.
2. **Audit:** search every producer for direct `auditLog.create` bypasses; centralize them; agree an audit retention/archival period with the owner before implementing deletion or archival.
3. **Dashboards:** replace inquiry-as-order counts and sample operational/sales metrics with tenant-scoped real aggregates or clearly labelled unavailable data.
4. **Whole-repository review:** continue auth/session/PKCE, RBAC, catalog, inquiry, subscriptions, CMS, support, CRM, notifications, retail, finance, shared packages, deployment and observability.
5. **Three-app regression:** validate Website, Company and Admin routes, permission boundaries, RTL, accessibility, responsive behavior and real user journeys.
6. **Database:** confirm all 101 non-ignored Prisma models, catalog comments, migration order, fresh DB and upgrade path via current workflows.

## Next action

Poll the three GitHub Actions workflows for the current main SHA, inspect failed job steps/logs and fix failures. Then continue with timezone-aware SLA calculations and the remaining audit-producer review. Update this file and WORKLOG after each independently verified slice.
