# Agent Coordination — Active Board

## Active task

**PROJECT-WIDE-AUDIT-AND-REPAIR-2026-11-19**  
**Lead:** main coordinator  
**Branch:** main only  
**Verified source SHA:** c662b87ac30f5d4300598b2f73bc8e57b26dc2e3

## Exact-main acceptance

| Gate | Result | Evidence |
|---|---|---|
| CI | PASS | [45045151898](https://github.com/gameacc2025/martest/actions/runs/45045151898) — 1,825 backend tests, 18 architecture/session tests, 390 frontend/shared tests, three production builds |
| Fresh PostgreSQL migration | PASS | [45045151757](https://github.com/gameacc2025/martest/actions/runs/45045151757) — Prisma validation/generation, all migrations on fresh PostgreSQL and model/table parity |
| Runtime | PASS | [45045151713](https://github.com/gameacc2025/martest/actions/runs/45045151713) — services healthy, migrations, all seeds twice, actual PostgreSQL overlap race and max-Int boundary, AD-1/AD-3 role-grant checks, 8/8 Playwright smoke tests and teardown |

## Completed slices

- All previously documented CMS, Auth, Company, CRM, Inquiry, Support, Product, upload-signature and AuditLog slices remain in place.
- Fixed Price Tier unbounded upper-range migration using int8range with a genuinely unbounded NULL upper bound; the 2147483647 inclusive boundary no longer overflows.
- Fixed the runtime Seed failure and verified all seeds twice on fresh PostgreSQL; the former ProductPriceTier P2020 failure is resolved.
- Added a real PostgreSQL concurrency probe to Runtime Validation. Two simultaneous overlapping inserts produce exactly one success and one exclusion-constraint rejection; the max-Int inclusive boundary is accepted.
- Prisma P2039/SQLSTATE 23P01 for the named Price Tier exclusion constraint now maps consistently to HTTP 409 PRICE_TIER_OVERLAP.
- Address AuditLog snapshots now omit recipient and delivery PII.
- Notification read/unread, bulk read/unread, delete, bulk delete, copy and move mutations now bind AuditLog writes to the same transaction; notification message/title content is excluded from audit snapshots.
- Category/Subcategory and Permission mutations now bind AuditLog writes to their mutation transactions; permission controllers forward the authenticated actor.
- Admin review/monetization settings, inquiry plan create/update and notification-folder create/update now bind audit events to the same transaction; controllers forward the authenticated actor.
- Fixed the normalized self-name Permission update edge case.
- CI, fresh-PostgreSQL migration validation and full runtime validation all pass on the exact source SHA above.

## Remaining queue

1. Complete the exhaustive Product nested-resource IDOR inventory and cross-company tests for every Price Tier/Image/Document read, download, upload, delete, primary and reorder operation. Price Tier concurrency and boundary integrity are verified; this does not replace the full authorization sign-off.
2. Finish CMS category activation/deactivation semantics and remaining Article revision/relationship/public-cache edge cases.
3. Finish the global AuditLog coverage matrix, especially Auth/session and outbound admin notification dispatch/idempotency semantics. Category, Permission, notification mutations, settings and inquiry-plan/folder mutations received additional transaction/actor hardening.
4. Owner/legal decision required for AuditLog retention, archival and deletion policy; do not invent a retention period.
5. Complete dashboard/reporting correctness and broader visual, keyboard, accessibility and responsive regression.
6. Live SMTP/Twilio/payment-provider delivery, production deployment, backup/restore and rollback remain NOT VERIFIED.
7. Owner's Windows working tree, local Docker daemon and developer PostgreSQL remain NOT VERIFIED by GitHub Actions.
8. Preserve AD-1 through AD-4; retail/checkout/cart/wishlist/finance behavior remains dormant until the owner supplies the required commercial decisions.

## Coordination and safety rules

- Only the existing main branch; no branches, worktrees, detached checkouts, force-pushes or destructive resets/cleanup.
- Writes are serialized. Workers return patches/evidence and never commit or push.
- The lead reviews, tests, commits and pushes each independently verified slice; verify the remote SHA after each push.
- Preserve user changes and existing migration history. Never rewrite an applied migration or deploy to production without explicit authorization.
- Repository branch-protection/required-check enforcement remains a separate setting to review; do not introduce PR-only rules that conflict with the agreed main-only publishing workflow.

## Handoff

**Next:** finish Product nested-resource IDOR and CMS category/revision/public-cache edge cases, then complete the remaining Auth/session and outbound-notification AuditLog review. Dashboard/accessibility and external/local/production gates follow. Retention and AD-1..AD-4 remain owner-dependent.
