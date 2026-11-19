# Agent Coordination — Active Board

## Active task

**PROJECT-WIDE-AUDIT-AND-REPAIR-2026-11-19**  
**Lead:** main coordinator  
**Branch:** main only  
**Verified source SHA:** 0f6d846280c879c6f107bbeb45f4b18a8a45e330

## Exact-main acceptance

| Gate | Result | Evidence |
|---|---|---|
| CI | PASS | 44532646173 — 69 test files / 390 Frontend-Shared tests; 18 architecture/session tests; 1,753 Backend tests; three app builds |
| Fresh PostgreSQL migration | PASS | 44532646116 — migrations, Prisma validation/generation and model/table parity |
| Runtime | PASS | 44532645796 — all services healthy, seeds twice, AD-1/AD-3 grants, 8/8 Playwright smoke tests |

## Completed slices

- CMS public article search preserves publication visibility when search is supplied.
- Auth challenge ownership regression coverage; company status checked on login and refresh.
- User lifecycle AuditLog events, duplicate contact conflict handling and company-existence validation.
- Company lifecycle/profile/settings AuditLog events in the same transaction as the mutation.
- CRM lead lifecycle central AuditLog events.
- Inquiry create/update/status/reveal and Support ticket/message/status/assignment central AuditLog events, transaction-bound and covered by service tests.
- Central audit action registry uniqueness/format tests; Audit metadata key normalization and depth-safe redaction.
- Frontend test mounts register Tooltip and RouterLink stubs; CI no longer emits the previous unresolved component/directive warnings.
- Notification CRUD is userId-scoped; folder scope derives from verified app context; SMS is explicit opt-in and provider-gated. CMS content routes require exact STAFF plus resource-specific cms.* permissions.
- AD-3 decision wording clarified; duplicated Git publishing rules consolidated in AGENTS, PROTOCOL and AI_AGENT_WORKFLOW.

## Remaining queue

1. Continue Product nested-resource/status and CMS service-mutation tenant/authorization review; targeted Product/Inquiry/Support/Notifications/User/Company checks do not equal full sign-off.
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

**Next:** inspect Product price/image/document subresources and CMS revision/FAQ/Page mutation transaction boundaries; add central audit producers where domain-specific history is insufficient. Retention requires owner/legal direction. Record exact tests and remote SHA in WORKLOG before marking a slice complete.
