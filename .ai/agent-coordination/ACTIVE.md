# Agent Coordination — Active Board

## Active task

**PROJECT-WIDE-AUDIT-AND-REPAIR-2026-11-19**  
**Lead:** main coordinator  
**Branch:** main only  
**Verified source SHA:** 4c4bd815c6be81518faae5d6dd871f66428e8e47

## Exact-main acceptance

| Gate | Result | Evidence |
|---|---|---|
| CI | PASS | 44471408709 — 69 test files / 390 Frontend-Shared tests; 18 architecture/session tests; 1,748 Backend tests; three app builds |
| Fresh PostgreSQL migration | PASS | 44471408725 — migrations, Prisma validation/generation and model/table parity |
| Runtime | PASS | 44471408712 — all services healthy, seeds twice, AD-1/AD-3 grants, 8/8 Playwright smoke tests |

## Completed slices

- CMS public article search preserves publication visibility when search is supplied.
- Auth challenge ownership regression coverage; company status checked on login and refresh.
- User lifecycle AuditLog events, duplicate contact conflict handling and company-existence validation.
- Company lifecycle/profile/settings AuditLog events in the same transaction as the mutation.
- CRM lead lifecycle central AuditLog events.
- Audit metadata key normalization and depth-safe redaction.
- AD-3 decision wording clarified; duplicated Git publishing rules consolidated in AGENTS, PROTOCOL and AI_AGENT_WORKFLOW.

## Remaining queue

1. Continue tenant/IDOR review by domain; targeted Support/CMS/Auth/User/Company checks do not equal full sign-off.
2. Add central AuditLog producers for Product, Inquiry, Support, CMS, roles/settings and remaining sensitive operations.
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

**Next:** Product/Inquiry tenant-scope review, then continue central AuditLog producer coverage. Record exact tests and remote SHA in WORKLOG before marking a slice complete.
