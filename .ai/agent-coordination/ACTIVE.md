# Agent Coordination — Active Board

## Active task

**PROJECT-WIDE-AUDIT-AND-REPAIR-2026-11-19**  
**Lead:** main coordinator  
**Branch:** main only  
**Verified source SHA:** ee81257b18424554ccf4b31dbdc2c93fa2581a85

## Exact-main acceptance

| Gate | Result | Evidence |
|---|---|---|
| CI | PASS | 44531746720 — 69 test files / 390 Frontend-Shared tests; 18 architecture/session tests; 1,753 Backend tests; three app builds |
| Fresh PostgreSQL migration | PASS | 44531746798 — migrations, Prisma validation/generation and model/table parity |
| Runtime | PASS | 44531746905 — all services healthy, seeds twice, AD-1/AD-3 grants, 8/8 Playwright smoke tests |

## Completed slices

- CMS public article search preserves publication visibility when search is supplied.
- Auth challenge ownership regression coverage; company status checked on login and refresh.
- User lifecycle AuditLog events, duplicate contact conflict handling and company-existence validation.
- Company lifecycle/profile/settings AuditLog events in the same transaction as the mutation.
- CRM lead lifecycle central AuditLog events.
- Inquiry create/update/status/reveal and Support ticket/message/status/assignment central AuditLog events, transaction-bound and covered by service tests.
- Central audit action registry uniqueness/format tests; Audit metadata key normalization and depth-safe redaction.
- Frontend test mounts register Tooltip and RouterLink stubs; CI no longer emits the previous unresolved component/directive warnings.
- AD-3 decision wording clarified; duplicated Git publishing rules consolidated in AGENTS, PROTOCOL and AI_AGENT_WORKFLOW.

## Remaining queue

1. Continue tenant/IDOR review by domain; targeted Support/CMS/Auth/User/Company checks do not equal full sign-off.
2. Add central AuditLog producers for CMS, roles/settings and remaining sensitive operations; assess ProductActivityLog coverage before duplicating Product events.
3. Owner/legal decision required for AuditLog retention and archival.
4. Confirm public product visibility when the owning company is inactive, suspended or soft-deleted.
5. Complete dashboard/reporting and broader visual/accessibility regression.
6. Live external providers, production deployment and local Windows/Docker/PostgreSQL remain NOT VERIFIED.

## Coordination and safety rules

- Only main; no branches, worktrees, detached checkouts, force-pushes or destructive resets/cleanup.
- Writes are serialized. Workers return patches/evidence and never commit or push.
- The lead commits/publishes each reviewed, verified slice and checks the remote SHA.
- Preserve AD-1 through AD-4; do not activate retail/finance or invent commercial/retention policy.

## Handoff

**Next:** continue Product/CMS tenant and authorization review; add central audit producers where domain-specific history is insufficient. Retention requires owner/legal direction. Record exact tests and remote SHA in WORKLOG before marking a slice complete.
