# Agent Coordination — Active Board

## Active task

**PROJECT-WIDE-AUDIT-AND-REPAIR-2026-11-19**  
**Lead:** main coordinator  
**Branch:** main only  
**Verified source SHA:** df3e2026b6fa8df8e4a6ad098b9e812d82cb1942

## Exact-main acceptance

| Gate | Result | Evidence |
|---|---|---|
| CI | PASS | [44655876783](https://github.com/gameacc2025/martest/actions/runs/44655876783) — 69 Frontend/Shared files / 390 tests; 18 architecture/session tests; 1,775 backend tests; three app builds |
| Fresh PostgreSQL migration | PASS | [44655876652](https://github.com/gameacc2025/martest/actions/runs/44655876652) — Prisma validation/generation, fresh migrations and model/table parity |
| Runtime | PASS | [44655876772](https://github.com/gameacc2025/martest/actions/runs/44655876772) — services healthy, migrations/seed-twice/AD-1+AD-3 checks, 8/8 Playwright smoke tests and teardown |

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
- Product create/update, price-tier create/update/delete, image upload/delete/primary/reorder, document upload/delete, status transitions and soft deletion now write central AuditLog events within the same Prisma transaction; domain ProductActivityLog/PriceSnapshot/StatusHistory remain intact.
- Product management Service now enforces exact COMPANY operation permissions as well as tenant ownership; direct/internal service calls can no longer rely solely on route Middleware. STAFF permission behavior and STAFF-only context remain unchanged.
- Product image/document uploads now validate file signatures (JPEG, PNG, GIF, WebP and PDF) after streaming to disk; mismatched content is removed and rejected even when extension and MIME are spoofed.
- CMS Article create/update now map category assignment objects through categoryId and preserve sortOrder; revision restoration regression tests cover category/tag relationship restoration and transactional AuditLog.
- Product and upload tests verify central audit failure propagates and uploaded files are cleaned up; no credential/token values or full article/product content are copied into the new event metadata.
- Frontend test mounts register Tooltip and RouterLink stubs; CI no longer emits the previous unresolved component/directive warnings.
- Notification CRUD is userId-scoped; folder scope derives from verified app context; SMS is explicit opt-in and provider-gated. CMS content routes require exact STAFF plus resource-specific cms.* permissions.
- AD-3 decision wording clarified; duplicated Git publishing rules consolidated in AGENTS, PROTOCOL and AI_AGENT_WORKFLOW.

## Remaining queue

1. Finish exhaustive Product nested-resource IDOR review, including all cross-company price-tier/image/document actions and concurrent overlapping price-tier writes; the current service permission and ownership checks are not a complete sign-off.
2. Review CMS category activation/deactivation and remaining Article revision/relationship edge cases; continue central AuditLog coverage for roles, settings, Auth/session and other sensitive administrative mutations.
3. Owner/legal decision required for AuditLog retention and archival; do not invent a retention period.
4. Complete dashboard/reporting and broader visual/accessibility regression.
5. Live external providers, production deployment and local Windows/Docker/PostgreSQL remain NOT VERIFIED.

## Coordination and safety rules

- Only main; no branches, worktrees, detached checkouts, force-pushes or destructive resets/cleanup.
- Writes are serialized. Workers return patches/evidence and never commit or push.
- The lead commits/publishes each reviewed, verified slice and checks the remote SHA.
- Preserve AD-1 through AD-4; do not activate retail/finance or invent commercial/retention policy.

## Handoff

**Next:** continue the remaining Product nested-resource IDOR/concurrency review and CMS category activation/relationship edge cases. Then audit remaining roles/settings/Auth sensitive operations. Retention requires owner/legal direction.
