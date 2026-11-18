# PROJECT-WIDE-AUDIT-AND-REPAIR-2026-11-18

**Task ID:** PROJECT-WIDE-AUDIT-AND-REPAIR-2026-11-18  
**Status:** IN_PROGRESS — source audit and staged repairs underway  
**Repository:** `gameacc2025/martest`  
**Integration branch:** `main` only  
**Audit baseline:** `cef559d4ffa9dc3c5c3c98967ea08cd4e522060d`  
**Latest recorded main SHA:** `eb1511a2efef6325c2e6b392d25b55b86365cdb5`  
**Owner authorization:** broad project-wide repair approved on 2026-11-18  
**Owner communication:** Persian

## Scope and execution boundary

Review project rules, architecture, backend modules, Prisma schema/migrations, seeds, API contracts, all three frontend apps, shared packages, CI/runtime workflows, tests and operational documentation. Fix verified defects in bounded slices. Preserve accepted business decisions unless implementation is being aligned to an already accepted decision. Do not invent behavior or claim unrun checks passed.

This session can inspect and update the connected GitHub repository but cannot access the owner's Windows working tree, local Docker daemon, local PostgreSQL or local browser. Those remain `NOT VERIFIED`. All writes are serialized directly on existing `main`; no branches, worktrees, detached checkouts, force-pushes, resets or clean operations.

## Completed slices on main

| Area | Change | Commit |
|---|---|---|
| Audit redaction | Normalize sensitive-key catalogue before case-insensitive matching | `3cb9f9400d0c43993f6525814d68ceccddd86b03` |
| Audit tests | Cover mixed-case and nested sensitive keys | `2316e5526b7890e56a648a657f3e4ebff150ac75` |
| CRM route | Forward authenticated actor ID to lead status service | `0281b63946e691daaa62bbcab54e5fde705985cc` |
| CRM tests | Assert route forwards actor identity | `849df76593b5f54cb81471ab9241d0ba023f372c` |
| Architecture docs | Correct stale Tailwind stack description to PrimeVue 4 + SCSS | `c4590a27cb6e9ebd1792b0ed04427568924839a9` |
| Database | Add forward-only migration for Faq, Page, LeadStatusHistory and CRMFieldAudit, with indexes, FKs and Persian comments | `784999f1c6bd91b6323b4d6a3e485e78e07b8c0c` |
| DB runbook | Record migration and revised parity acceptance | `3403c0d15d7c0a4f4d59e145eaaa40c54682639a` |
| DB CI | Assert the four previously missing tables exist after migrate deploy | `eb1511a2efef6325c2e6b392d25b55b86365cdb5` |

## Verification status

- Targeted local tests: **NOT RUN** — no local repository runtime is available in this session.
- GitHub CI / migration workflow for the new HEAD: **PENDING / NOT VERIFIED** — current connector exposes no push-triggered run result for this commit.
- Fresh PostgreSQL migration and seed-twice runtime: **NOT VERIFIED** until the corresponding workflows complete.
- Existing development/production database upgrade: **NOT VERIFIED**; do not apply to a persistent database without backup and observed migration result.
- No production data, credentials or environment files were accessed.

## Remaining confirmed work

1. **Support SLA:** `pauseSla` / `resumeSla` currently record events without extending deadlines; worker pause handling is a placeholder. Queue notification fan-out must be scoped to actual queue assignments.
2. **Audit:** add writer/redaction tests, verify all producers use the central writer, and define a retention/archival policy with safe controls.
3. **Notifications:** reconcile `SUPPORT_SLA_ESCALATED` SMS default with explicit consent and the preference API's `smsAvailable` response; align docs, code and tests.
4. **Dashboards:** replace misleading inquiry-as-order counts and sample operational/sales metrics with real scoped aggregates or clearly label unavailable data.
5. **Decision drift:** reconcile implementation with accepted AD-1 (CUSTOMER RFQ), AD-3 (COMPANY user-management permissions) and AD-4 (B2C routes disabled). Preserve the accepted decisions; do not silently rewrite them.
6. **Three-app regression:** inspect and validate Website, Company and Admin routes, permissions, RTL, accessibility, responsive behavior and real user journeys.
7. **Whole-repository review:** continue beyond the above modules across auth, RBAC, catalog, inquiry, subscriptions, CMS, inventory, retail, finance, shared packages, UI and deployment.

## Next action

Inspect the exact Support SLA worker and assignment schema, then implement pause/resume and queue-scoped recipients with focused tests. Continue one independently verifiable slice at a time, update WORKLOG/current-task, and verify CI/remote HEAD after each slice.
