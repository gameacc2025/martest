# PROJECT-WIDE-AUDIT-AND-REPAIR-2026-11-18

**Task ID:** PROJECT-WIDE-AUDIT-AND-REPAIR-2026-11-18  
**Status:** IN_PROGRESS — source repairs committed; full runtime/browser acceptance still running  
**Repository:** `gameacc2025/martest`  
**Integration branch:** `main` only  
**Latest audited main:** `10e0e9ef6bf215b66afa5c0eac571bc9d4e9faaa`  
**Owner authorization:** project-wide repairs approved on 2026-11-18  
**Owner communication:** Persian

## Scope and execution boundary

Review repository rules, architecture, Prisma schema/migrations/seeds, backend modules, API contracts, Website/Company/Admin apps, shared packages, CI/runtime workflows, tests and operational documentation. Fix source-backed defects in bounded slices. Preserve accepted business decisions; do not invent commercial, financial, legal or data-retention policy.

This session uses the GitHub repository connection. It cannot inspect the owner's Windows working tree, local Docker daemon, local PostgreSQL or local browser. Those remain **NOT VERIFIED**. All writes are serialized directly on existing `main`; no branches, worktrees, detached checkouts, force-pushes, resets or clean operations.

## Repairs committed on main

- **Database parity:** forward-only migration adds `Faq`, `Page`, `LeadStatusHistory`, and `CRMFieldAudit`; Prisma model/table parity checks run in migration and runtime workflows.
- **CRM:** lead-status route forwards authenticated actor ID; lead merge uses transaction-aware central audit writer.
- **Support:** SLA pause/resume extends both deadlines by working minutes; queue notifications target active STAFF assignments in the ticket queue; worker no longer starts a duplicate loop when imported; due-time arithmetic uses configured IANA timezone and local holidays; invalid calendar settings fail safely.
- **Support schema:** `SupportTicket.slaPolicyId` persists the SLA policy applied at creation through an additive migration and nullable FK.
- **Audit:** sensitive-key redaction is case-insensitive and recursive; writer tests cover explicit/HTTP writers; direct service-layer writes are routed through the central writer; untrusted forwarding headers no longer control stored IP; inbound correlation IDs are validated and bounded.
- **AD-1:** CUSTOMER cannot create new RFQs; existing buyer-owned inquiry operations remain ownership checked.
- **AD-3:** COMPANY user-management grants are removed, including stale persisted grants during seed reconciliation.
- **AD-4:** retail/checkout/cart/wishlist and finance/settlement remain dormant; Admin/Company routes and active navigation are disabled until owner-approved domain rules/APIs exist.
- **Notifications:** SMS defaults OFF and queueing requires validated provider configuration, explicit opt-in and quota; live provider delivery remains unverified.
- **Website UI/tests:** buyer inquiry text, product listing test fixtures and text-free loading-screen assertions aligned with current behavior.
- **Routing:** stale retail/finance dashboard-menu tests updated; Admin/Company callback-style guards explicitly abort when session restoration fails or navigation leaves for another app.
- **Docker:** runtime image includes backend parity scripts.

## Latest GitHub verification

| Workflow | Run | Result |
|---|---:|---|
| CI — architecture graph, Frontend/Shared tests, Backend tests, three app builds | [44301790110](https://github.com/gameacc2025/martest/actions/runs/44301790110) | **PASS** |
| Fresh PostgreSQL migration + all Prisma model/table parity | [44301790094](https://github.com/gameacc2025/martest/actions/runs/44301790094) | **PASS** |
| Docker Compose + runtime + seeds + browser smoke | [44301790032](https://github.com/gameacc2025/martest/actions/runs/44301790032) | **IN PROGRESS** — Docker build, health checks, migrations, model parity, seed twice, and AD-1/AD-3 grant checks passed; browser smoke across all panels/API proxies is running |

Local Windows workspace, local Docker and developer PostgreSQL: **NOT VERIFIED**. Live SMTP/Twilio/payment providers: **NOT VERIFIED**.

## Confirmed remaining work

1. Finish browser smoke; inspect failures and repair them before claiming runtime acceptance.
2. Reconcile stale API/domain documents with current source, beginning with `docs/api-contracts/auth-audit.md` (its AuditLog URLs, query fields, write API, access matrix and retention text do not match implementation).
3. Audit remaining company-owned endpoints for tenant/IDOR boundaries; current review is broad but not an exhaustive security sign-off.
4. Dashboard/reporting: use tenant-scoped persisted aggregates or clearly labelled unavailable/sample values; do not show retail/finance prototypes as live operations.
5. Audit retention/archival: keep append-only logs; do not delete/archive until the owner/legal policy sets retention and approved archival storage.
6. Continue source review of authentication/PKCE, RBAC, catalog, inquiry/subscriptions, CMS, notifications, deployment and observability.

## Next action

Poll Runtime Validation run `44301790032`; fix any browser/API proxy failures. Then reconcile the Audit API contract and refresh WORKLOG/ACTIVE with final run evidence. Keep every claim tied to an observed workflow or source check.
