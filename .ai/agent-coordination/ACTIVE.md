# Agent Coordination — Active Board

## Active task

**PROJECT-WIDE-AUDIT-AND-REPAIR-2026-11-19**  
**Lead:** main coordinator  
**Branch:** main only  
**Verified source SHA:** db7b170ff308032053c46f6ff891be9fdac0e800

## Exact-main acceptance

| Gate | Result | Evidence |
|---|---|---|
| CI | PASS | [44653371166](https://github.com/gameacc2025/martest/actions/runs/44653371166) — 18 architecture/session tests; 1,763 backend tests; Frontend/Shared tests and three app builds |
| Fresh PostgreSQL migration | PASS | [44653371112](https://github.com/gameacc2025/martest/actions/runs/44653371112) — Prisma validation/generation, fresh migrations and model/table parity |
| Runtime | PASS | [44653371107](https://github.com/gameacc2025/martest/actions/runs/44653371107) — all services healthy, seeds twice, AD-1/AD-3 grants, browser smoke tests and teardown |

## Completed slices

- CMS public article search preserves publication visibility when search is supplied.
- Auth challenge ownership regression coverage; company status checked on login and refresh.
- User lifecycle AuditLog events, duplicate contact conflict handling and company-existence validation.
- Company lifecycle/profile/settings AuditLog events in the same transaction as the mutation.
- CRM lead lifecycle central AuditLog events.
- Inquiry create/update/status/reveal and Support ticket/message/status/assignment central AuditLog events, transaction-bound and covered by service tests.
- Central audit action registry uniqueness/format tests; Audit metadata key normalization and depth-safe redaction.
- CMS FAQ, static Page, Article Category and Article Tag create/update/delete mutations now write central AuditLog events in the same Prisma transaction; actor IDs flow from controllers and before/after snapshots are tested.
- CMS preview-token issuance and single-use consumption now have central AuditLog events; consumption uses a conditional update inside a transaction to prevent two concurrent successful consumers. Token values are never written to audit metadata.
- User profile, password and avatar lifecycle mutations now write transactional AuditLog events; password/token secrets are excluded and password change continues to revoke refresh tokens atomically.
- Product status transitions and soft deletion now write central AuditLog events alongside existing ProductStatusHistory/ProductActivityLog records.
- Frontend test mounts register Tooltip and RouterLink stubs; CI no longer emits the previous unresolved component/directive warnings.
- Notification CRUD is userId-scoped; folder scope derives from verified app context; SMS is explicit opt-in and provider-gated. CMS content routes require exact STAFF plus resource-specific cms.* permissions.
- AD-3 decision wording clarified; duplicated Git publishing rules consolidated in AGENTS, PROTOCOL and AI_AGENT_WORKFLOW.

## Remaining queue

1. Continue Product nested-resource tenant/authorization review for price tiers, images and documents; current Product status/archive audit additions do not equal full sign-off.
2. Review remaining CMS revision, article/category/tag relationships and role/settings/auth sensitive mutations for central AuditLog coverage; do not duplicate domain histories without assessing their coverage.
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

**Next:** inspect Product price/image/document subresources and CMS revision/article relationship boundaries. Retention requires owner/legal direction. Owner Windows/Docker/PostgreSQL and live providers remain NOT VERIFIED.
