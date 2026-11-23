# Agent Coordination — Active Board

## Active task

**PROJECT-WIDE-AUDIT-AND-REPAIR-2026-11-19**  
**Lead:** main coordinator  
**Branch:** `main` only  
**Latest fully verified code SHA:** `78083a871eda33a361d53b740af9242cd55c3225`

## Exact-main acceptance evidence

| Gate | Result | Evidence |
|---|---|---|
| CI | **PASS** | [Run 45107167075](https://github.com/gameacc2025/martest/actions/runs/45107167075) — 1,851 backend tests, 395 frontend/shared tests, 18 architecture/session tests, all three production builds |
| Fresh PostgreSQL migrations | **PASS** | [Run 45107166974](https://github.com/gameacc2025/martest/actions/runs/45107166974) — 19 migrations, Prisma model/table parity |
| Docker Runtime + E2E | **PASS** | [Run 45107167028](https://github.com/gameacc2025/martest/actions/runs/45107167028) — all services healthy, seeds twice, real PostgreSQL Price Tier concurrency/max-Int probe, exclusive notification delivery claim probe, AD-1/AD-3 grant checks, 8/8 Playwright tests |

## Completed executable work

- **A — Product security:** cross-company ownership, nested Price Tier/Image/Document authorization, direct-service permission parity, parent-child mismatch and cleanup coverage.
- **B — Price Tier integrity:** non-overlap database exclusion, inclusive max-Int boundary, HTTP 409 consistency and real concurrent PostgreSQL verification.
- **C — CMS lifecycle:** category activation/deactivation, article category/tag integrity, revision restore, public filters, Persian slug generation and route-length limits.
- **D — AuditLog:** CMS, Product, Auth/session/PKCE, notification lifecycle/preferences, roles/permissions, settings/admin, addresses/contact and related sensitive mutations; actor propagation, transaction binding and PII minimization.
- **Notification delivery:** email/SMS workers now claim rows atomically with a recoverable five-minute lease; PostgreSQL verifies that only one concurrent claim wins. Delivery remains at-least-once across the unavoidable provider-accepted/process-crash window unless the provider supports idempotency.
- **Dashboard foundations:** inaccurate service-health states and recent-product ordering corrected; shared design tokens match the approved palette; cross-panel accessibility-name, keyboard-focus and responsive smoke checks run in Playwright.
- **Runtime reliability:** seed import/runtime failure fixed; all seeds execute twice; migrations and schema parity pass.

## Remaining work / blockers

1. **F1–F2 — Dashboard/reporting:** finish the KPI/API contract matrix, date/time boundaries, export/pagination reconciliation and tenant-scoped reporting tests. Do not redefine KPIs without owner approval.
2. **F3–F5 — UI verification:** broader component-level empty/error-state coverage, full light/dark screen audit, contrast/zoom/reduced-motion checks and dialog/dropdown/accordion keyboard testing remain incomplete. Existing Playwright checks cover accessible names, visible focus, JS errors and responsive overflow at 360/768/1366/1920/2560px.
3. **B4 / G1 — Existing owner environment:** GitHub-hosted Docker/PostgreSQL validation is green; the owner's Windows workspace and any already-deployed/shared database migration preflight have not been accessed or verified.
4. **E2–E3 — AuditLog retention:** E1 decision brief is prepared in `.ai/decisions.md`; retention period, archive location, legal hold and deletion/anonymization require explicit owner/legal approval. No automated purge is authorized.
5. **AD-1–AD-4:** commercial decisions for dormant retail/cart/checkout/order/finance/settlement scope remain owner-dependent. No dormant feature was activated.
6. **G2–G8 — External/Production:** real SMTP/Twilio delivery, payment sandbox/live validation, production backup/restore, deployment/rollback and post-deployment smoke tests remain unverified. No production deployment or live charge/message was performed.

## Git governance

- Only existing `main` is used.
- No branches, worktrees, detached checkouts, force-pushes or history rewrites.
- Only the lead creates commits and pushes.
- Each completed slice is committed directly to `main`; no destructive cleanup or user-change discard.
- The exact final remote SHA and its CI/migration/runtime evidence must be rechecked after documentation synchronization.
