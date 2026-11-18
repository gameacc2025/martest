# PROJECT-WIDE-AUDIT-AND-REPAIR-2026-11-18

**Task ID:** PROJECT-WIDE-AUDIT-AND-REPAIR-2026-11-18  
**Status:** IN_PROGRESS — latest notification/security repair slice passed all three GitHub acceptance workflows; remaining source/security/product audits are queued  
**Repository:** `gameacc2025/martest`  
**Integration branch:** `main` only  
**Latest tested code:** `10c41cf52dc5ba01ab90a4c64e09a4c5fdf96f01`  
**Owner authorization:** project-wide repairs approved on 2026-11-18  
**Owner communication:** Persian

## Scope and execution boundary

Review repository rules, architecture, Prisma schema/migrations/seeds, backend modules, API contracts, Website/Company/Admin apps, shared packages, CI/runtime workflows, tests and operational documentation. Fix source-backed defects in bounded slices. Preserve accepted business decisions; do not invent commercial, financial, legal or data-retention policy.

This session uses the GitHub repository connection. It cannot inspect the owner's Windows working tree, local Docker daemon, local PostgreSQL or local browser. Those remain **NOT VERIFIED**. All writes are serialized directly on existing `main`; no branches, worktrees, detached checkouts, force-pushes, resets or clean operations.

## Repairs committed on main

- **Database parity:** forward-only migration adds `Faq`, `Page`, `LeadStatusHistory`, and `CRMFieldAudit`; Prisma model/table parity checks run in migration and runtime workflows.
- **Support schema:** additive migration adds nullable `SupportTicket.slaPolicyId`, index and FK to preserve the SLA policy applied at ticket creation.
- **CRM:** lead-status route forwards authenticated actor ID; lead merge uses transaction-aware central audit writer.
- **Support:** SLA pause/resume extends both deadlines by working minutes; queue notifications target active STAFF assignments in the ticket queue; worker is import-safe; due-time arithmetic uses configured IANA timezone/local holidays and validates persisted calendar settings.
- **Audit:** recursive case-insensitive sensitive-key redaction; central writer tests; safe socket-derived IP (untrusted forwarding headers ignored); bounded safe correlation IDs; audit API documentation aligned with actual STAFF-only routes and query parameters.
- **AD-1:** CUSTOMER cannot create new RFQs; existing buyer-owned inquiry operations remain ownership checked.
- **AD-3:** COMPANY user-management grants are removed, including stale persisted grants during seed reconciliation.
- **AD-4:** retail/checkout/cart/wishlist and finance/settlement remain dormant; Admin/Company routes and active navigation are disabled until owner-approved domain rules/APIs exist.
- **Notifications:** SMS defaults OFF and queueing requires validated provider configuration, explicit opt-in and quota. If quota verification fails or subscription state changes, SMS is skipped with `quotaCheckFailed`; the business transaction is not aborted and no unmetered SMS row is queued. Live provider delivery remains unverified.
- **Support SLA IDOR:** `GET /tickets/:id/sla` now scopes its ticket lookup to the authenticated CUSTOMER requester, COMPANY requesterCompanyId, or STAFF platform context; service and route regression tests cover the boundary.
- **Company dashboard:** removed fabricated inquiry/product fallback numbers and sample sales chart; unavailable aggregates render as `—`; removed links to disabled retail-order routes.
- **Company statistics contract:** fixed the service to return `inquiries`, `draftInquiries`, and `recentInquiries` instead of incorrectly labelling Inquiry records as orders.
- **Website/UI/tests:** buyer inquiry text, product listing fixtures and text-free loading-screen assertions aligned with current behavior; stale dashboard-menu tests fixed.
- **Routing:** Admin/Company callback-style guards explicitly abort when session restoration fails or navigation leaves for another app.
- **Docker/seed security:** backend image includes parity scripts; production/staging seed requires explicit `SUPER_ADMIN_PASSWORD` of at least 32 characters; env example leaves it blank; CMS synthetic author seed skips Production; admin/demo passwords are not logged; Runtime CI generates and masks ephemeral PostgreSQL/admin/JWT credentials.

## Verified GitHub acceptance

All three workflows passed on the exact main code SHA `9bb73c5735dbf3eddeff35375b381cc7a37586db`.

| Workflow | Run | Result |
|---|---:|---|
| CI — architecture graph, Frontend/Shared, Backend, Website/Company/Admin builds | [44368210815](https://github.com/gameacc2025/martest/actions/runs/44368210815) | **PASS** — 68 frontend/shared test files / 385 tests; 18 architecture/session tests; 1,701 backend tests; all three production builds |
| Fresh PostgreSQL migration + Prisma model/table parity | [44368210798](https://github.com/gameacc2025/martest/actions/runs/44368210798) | **PASS** |
| Docker Compose runtime + seed + RBAC + browser smoke | [44368210958](https://github.com/gameacc2025/martest/actions/runs/44368210958) | **PASS** — all services healthy; migrations/parity pass; all seeds twice; AD-1/AD-3 grants reconciled; **8/8 Playwright tests**; generated credentials masked and not printed |

Documentation-only synchronization commits may follow the tested code SHA; they do not change application source. The tested code SHA is recorded separately from the current documentation HEAD.

## Confirmed remaining work

1. Continue company-owned endpoint tenant/IDOR review; current review is broad but is not an exhaustive security sign-off.
2. Audit retention/archival: keep append-only logs; do not delete/archive until the owner/legal policy sets retention and an approved archival destination/design.
3. Central audit action registry and full producer normalization remain follow-up work; do not claim all action names are standardized.
4. Dashboard/reporting: active Company dashboard no longer shows sample metrics; remaining hardcoded sample values are confined to dormant, unregistered Retail/Finance prototypes and must stay unreachable until owner approval.
5. Continue auth/PKCE, RBAC, catalog, inquiry/subscriptions, CMS, notification, deployment and observability source review.
6. Live SMTP/Twilio/payment-provider delivery and production deployment remain NOT VERIFIED without credentials and a controlled environment.
7. Local Windows working tree, local Docker daemon and developer PostgreSQL remain NOT VERIFIED.

## Next action

Continue bounded source-level tenant/IDOR and dashboard/reporting audits; update the backlog and Worklog only with evidence-backed status. Preserve AD-1 through AD-4 and do not invent retention or commercial policy.
