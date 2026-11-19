# PROJECT-WIDE-AUDIT-AND-REPAIR-2026-11-18

**Task ID:** PROJECT-WIDE-AUDIT-AND-REPAIR-2026-11-18  
**Status:** IN_PROGRESS — 2026-11-19 latest main `2f9643c` passes CI, fresh PostgreSQL migration validation and Docker runtime/seed/RBAC/8-of-8 browser smoke; resource-by-resource tenant/IDOR and audit governance review continues  
**Repository:** `gameacc2025/martest`  
**Integration branch:** `main` only  
**Latest tested code:** `d4ce6dcfb63a3009e2be69759e69d232d82184c2`  
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
- **OTP brute-force protection:** `verify`/`consume` routes have per-IP limits; failed-attempt increments use compare-and-swap (`updateMany`) so concurrent requests cannot exceed `maxAttempts`; successful consumption atomically increments and sets `consumedAt`; valid verification does not consume a failed-attempt allowance.
- **OTP IP rate-limit integrity:** `getClientIp` now uses Fastify's resolved `request.ip`/socket address and ignores untrusted `X-Forwarded-For` / `X-Real-IP` headers; added regression tests.
- **OTP resend cooldown test isolation:** the resend-cooldown test now calls `checkRateLimits` with an isolated local Prisma mock rather than shared mutable fixtures; this removed cross-test state leakage that caused a false RATE_LIMITED result.
- **Deferred login MFA:** `LOGIN_MFA` remains in the database enum for forward compatibility but is excluded from the active challenge-purpose map and HTTP request schemas until an approved login-MFA enforcement flow exists; added service regression coverage.
- **Auth contract accuracy:** corrected challenge paths, authentication/ownership requirements, exact six-digit code format, actual route-level IP limits, separate public password-recovery routes and the deferred MFA policy.
- **Support SLA IDOR:** `GET /tickets/:id/sla` now scopes its ticket lookup to the authenticated CUSTOMER requester, COMPANY requesterCompanyId, or STAFF platform context; service and route regression tests cover the boundary.
- **Company dashboard:** removed fabricated inquiry/product fallback numbers and sample sales chart; unavailable aggregates render as `—`; removed links to disabled retail-order routes.
- **Company statistics contract:** fixed the service to return `inquiries`, `draftInquiries`, and `recentInquiries` instead of incorrectly labelling Inquiry records as orders.
- **Website/UI/tests:** buyer inquiry text, product listing fixtures and text-free loading-screen assertions aligned with current behavior; stale dashboard-menu tests fixed.
- **Routing:** Admin/Company callback-style guards explicitly abort when session restoration fails or navigation leaves for another app.
- **Agent governance:** deduplicated repeated direct-to-main, worker ownership, commit/push, and handoff rules across `AGENTS.md`, `.ai/PROTOCOL.md`, and `docs/AI_AGENT_WORKFLOW.md` without changing policy. Corrected a malformed conflict-order sentence in `.ai/UI_SKILLS.md`; skill recommendations remain subordinate to owner/product and repository rules.
- **Inquiry least privilege:** COMPANY buyer-side lifecycle and item mutations now require `leads.update` or `inquiries.update` in both Route and Service; `COMPANY_USER` with only `inquiries.read` is denied. Existing CUSTOMER owner-checked actions and customer cancellation behavior remain unchanged. Added route/service regression coverage.
- **Admin dashboard KPI:** active inquiry count now reads the actual nested `InquiryStats.received.new` / `received.byStatus.OPEN` contract and never substitutes the total inquiry count. Added 5 focused dashboard-metric tests.
- **Prototype isolation:** `OperationsHub.vue` is unregistered and explicitly marked as a sample-only dormant prototype; a visible warning prevents its hard-coded CRM/Support/Retail/Finance values being mistaken for live metrics if reused accidentally.
- **Additional read-only review:** Product service ownership and public visibility rules; Notification per-user ownership and app-scoped folder membership; CMS STAFF-only management and published-only public article/page routes. No new defect confirmed in these selected paths; review remains non-exhaustive.
- **Instruction audit:** reviewed `AGENTS.md`, `.ai/PROTOCOL.md`, `CLAUDE.md`, Copilot instructions, `docs/AI_AGENT_WORKFLOW.md`, and both legacy prompt archives. Active main-only/lead-only/Persian rules agree; prompt archives are explicitly marked historical, not policy.
- **Docker/seed security:** backend image includes parity scripts; production/staging seed requires explicit `SUPER_ADMIN_PASSWORD` of at least 32 characters; env example leaves it blank; CMS synthetic author seed skips Production; admin/demo passwords are not logged; Runtime CI generates and masks ephemeral PostgreSQL/admin/JWT credentials.

## Verified GitHub acceptance

All three workflows passed on the exact application-code SHA `d4ce6dcfb63a3009e2be69759e69d232d82184c2`.

| Workflow | Run | Result |
|---|---:|---|
| CI — architecture graph, Frontend/Shared, Backend, Website/Company/Admin builds | [44468714009](https://github.com/gameacc2025/martest/actions/runs/44460407273) | **PASS** — 69 Frontend/Shared test files; 390 Frontend/Shared tests; 18 architecture/session tests; 1,736 Backend tests; all three production builds |
| Fresh PostgreSQL migration + Prisma model/table parity | [44468713969](https://github.com/gameacc2025/martest/actions/runs/44460407198) | **PASS** — schema validation/generation, fresh migrations and full model/table parity |
| Docker Compose runtime + seed + RBAC + browser smoke | [44468714094](https://github.com/gameacc2025/martest/actions/runs/44460407552) | **PASS** — all services healthy; migrations/parity pass; all seeds twice; AD-1/AD-3 grants reconciled; **8/8 Playwright tests** |

Documentation-only synchronization commits may follow the tested code SHA; they do not change application source. The tested code SHA is recorded separately from the current documentation HEAD.

## Confirmed remaining work

- **Targeted tenant review (2026-11-18/19):** inspected Company route guards and route tests for profile, product listing, statistics, logo, settings and lifecycle operations; COMPANY context is constrained to its own company, STAFF-only controls are blocked to COMPANY even with wildcard/SUPER_ADMIN role. Reviewed User service role-scope and cross-company guards/tests; Support ticket and SLA detail reads are scoped by requester user/company, and Auth Challenge verify/consume handlers explicitly compare challenge.userId with the authenticated user. No new defect confirmed in these selected paths. This is not exhaustive tenant/IDOR sign-off.

1. Continue resource-specific tenant/IDOR review across Products, Inquiry, Support, CMS, Notifications and Auth; selected Product/Inquiry/Company/User/Notification/CMS paths are reviewed but this is not an exhaustive security sign-off.
2. Audit retention/archival: keep append-only logs; do not delete/archive until the owner/legal policy sets retention and an approved archival destination/design.
3. Central audit action registry and full producer normalization remain follow-up work; do not claim all action names are standardized.
4. Dashboard/reporting: Company dashboard uses real API data; Admin active-inquiry KPI now maps the nested stats contract. `OperationsHub.vue` remains an unregistered sample-only prototype.
5. Continue auth/PKCE, RBAC, catalog, inquiry/subscriptions, CMS, notification, deployment and observability source review.
6. Live SMTP/Twilio/payment-provider delivery and production deployment remain NOT VERIFIED without credentials and a controlled environment.
7. Local Windows working tree, local Docker daemon and developer PostgreSQL remain NOT VERIFIED.

## GitHub-side governance visibility — 2026-11-19\n\n- The repository rulesets endpoint returned an empty list. The branch-protection endpoint returned HTTP 403 (`Resource not accessible by integration`), so server-side branch protection is **NOT VERIFIED**; do not claim that main-only rules are enforced by GitHub settings. The repository files and workflows document main-only policy, and the Git refs endpoint currently shows only `refs/heads/main`.\n- Upgraded `.github/workflows/ci.yml`, `database-migration-validation.yml`, and `runtime-validation.yml` from Node 20 action majors to `actions/checkout@v7`, `actions/setup-node@v7`, and `pnpm/action-setup@v6` (Node 24). On the latest run, action setup succeeded and the former Node 20 deprecation warning did not recur.\n- Added controller-level regression tests proving another authenticated user cannot verify or consume someone else's OTP challenge, and that the owner can reach the service.\n\n## Next action

Continue the remaining backend tenant/IDOR audit by resource (Support, CMS, Auth and remaining product surfaces), then review AuditLog producer/action consistency, the central action registry, and retention/archival decision. Update docs only with evidence-backed status. Preserve AD-1 through AD-4 and do not invent retention or commercial policy.
