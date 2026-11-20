# PROJECT-WIDE-AUDIT-AND-REPAIR-2026-11-19

**Status:** FIRST 20 SCOPED SLICES COMPLETE — broader project audit remains IN PROGRESS.  
**Repository:** gameacc2025/martest  
**Integration branch:** main only; lead owns serialized writes/commits/pushes.  
**Latest fully tested code SHA:** c78e6d950b54695030518c8963053f8fc13be6f5

## Exact-main verification

- **CI PASS:** [44655876783](https://github.com/gameacc2025/martest/actions/runs/44655876783) — 69 Frontend/Shared test files / 390 tests, 18 architecture/session tests, 1,775 backend tests and all three production builds.
- **Fresh PostgreSQL migration PASS:** [44655876652](https://github.com/gameacc2025/martest/actions/runs/44655876652) — Prisma validation/client generation, all migrations on a fresh database, model/table parity and migration-state verification.
- **Runtime PASS:** [44655876772](https://github.com/gameacc2025/martest/actions/runs/44655876772) — Compose config/build, PostgreSQL/backend/all panels healthy, migrations/model parity, all seeds run twice, AD-1/AD-3 grants reconciled, 8/8 Playwright smoke tests, teardown succeeded.

## First ten scoped audit slices — 2026-11-20

1. Main baseline and evidence separation.
2. FAQ create/update/delete central transactional AuditLog.
3. Static Page create/update/delete central transactional AuditLog.
4. Article Category mutations: actor forwarding, transactional events and snapshots.
5. Article Tag mutations: actor forwarding, transactional events and snapshots.
6. CMS preview-token issue/consume audit; conditional transactional single-use claim; token secret excluded.
7. Settings profile/password audit; password update and refresh-token revocation atomic.
8. Avatar upload/delete audit; file cleanup after DB success.
9. Product status transition audit alongside existing domain history.
10. Product soft-delete audit plus test alignment and final exact-main CI/migration/runtime reconciliation.

Final code source SHA: `db7b170ff308032053c46f6ff891be9fdac0e800`. Broader audit remains open for Product price/image/document subresources, CMS Article revision/relationships, remaining auth/admin sensitive actions, retention/legal direction, public seller visibility and dashboard/accessibility completeness.


## Second ten scoped audit slices — 2026-11-20

11. Product price-tier create/update/delete: central transactional AuditLog with before/after snapshots.
12. Product image upload/delete/primary/reorder: central transactional AuditLog.
13. Product document upload/delete: central transactional AuditLog.
14. Product Service now checks COMPANY operation permissions and ownership, not just route middleware.
15. CMS Article create/update category assignments now map categoryId and sortOrder as declared by route schema.
16. Article revision restore tests verify categories/tags are restored and audit is transaction-bound.
17. Product uploads validate JPEG/PNG/GIF/WebP/PDF file signatures and reject spoofed MIME/extension content.
18. Upload audit failures reject and clean the stored file; failure behavior is covered by tests.
19. Product create/update now write central transactional AuditLog events with minimized snapshots.
20. Update this task/ACTIVE/WORKLOG evidence to exact tested source SHA.

Exact tested code source SHA: `c78e6d950b54695030518c8963053f8fc13be6f5`. CI: [44655876783](https://github.com/gameacc2025/martest/actions/runs/44655876783); migration: [44655876652](https://github.com/gameacc2025/martest/actions/runs/44655876652); runtime: [44655876772](https://github.com/gameacc2025/martest/actions/runs/44655876772).


## Repairs verified in this audit

- Public CMS article search now combines search terms with the publication-time window using AND; regression tests prevent early exposure of future-dated published records.
- Auth challenge verify/consume ownership checks are regression-tested against cross-user access.
- COMPANY login and refresh now reject inactive, suspended or soft-deleted companies while preserving each user's independent AccessProfile.isActive state.
- User lifecycle AuditLog events cover create/update/role changes/delete/panel access/company transfer. Metadata excludes contact values and credentials; company scope is attached.
- User updates now return 409 for duplicate email/phone; company creation validates the target company.
- Company lifecycle/profile/settings mutations now write transactional AuditLog events; controllers pass the authenticated actor.
- CRM lead create/update/assign/status/convert/merge use the central action registry and transactional AuditLog writer.
- Inquiry create/update/status/reveal and Support ticket create/message/status/assignment now write minimal, redaction-safe central AuditLog events in their existing transactions; focused service tests verify transaction binding and metadata.
- The central audit action registry now has automated immutability, uniqueness, and identifier-format checks.
- Frontend component-test setup now registers the Tooltip directive and stubs RouterLink where required; latest CI has zero unresolved tooltip/router-link warnings.
- Audit metadata redaction normalizes snake_case/kebab-case keys and truncates over-depth objects.
- Product service enforces company ownership for management mutations; public listing and detail both require PUBLISHED + PUBLIC products whose seller is ACTIVE and not soft-deleted. Product service tests cover cross-company reads/writes and inactive/deleted seller visibility.
- Notification reads, unread counts, updates and deletes are scoped to authenticated userId; folder IDs are validated against app scope derived from the verified token, and body/query app overrides are ignored. Service/controller tests cover cross-user IDs and folder scope.
- Notification preferences are user-scoped; SMS is OFF by default and requires explicit per-event opt-in plus a configured provider. Dispatch and preference tests cover opt-in, provider absence and quota failure.
- CMS FAQ/Page/Category/Tag routes require exact STAFF access plus resource-specific cms.* permissions; Article routes use the same STAFF boundary.
- AD-3 wording and the duplicated main-only/publishing instructions were clarified; current task handoff no longer contains literal escaped newline text.

## Remaining work

1. Finish exhaustive Product nested-resource IDOR checks, including cross-company price-tier/image/document mutations and concurrent range-overlap handling; existing service guards and targeted tests are not a full sign-off.
2. Review CMS category activation/deactivation and remaining Article revision/relationship edge cases.
3. Add central AuditLog coverage for remaining roles/settings/Auth/session and sensitive administrative mutations; assess existing domain history before duplicating events.
4. Obtain owner/legal direction for AuditLog retention, archival and deletion policy. Do not invent a retention period.
5. Finish dashboard/reporting completeness and broader visual/accessibility regression.
6. Live SMTP/Twilio/payment-provider delivery and production deployment remain NOT VERIFIED.
7. Owner's Windows working tree, local Docker daemon and developer PostgreSQL remain NOT VERIFIED by GitHub Actions.

## Governance and handoff

- Repository rulesets endpoint returned an empty list; branch-protection read returned 403 to the GitHub integration. Server-side branch protection is NOT VERIFIED. Repository policy documents main-only work; Git refs observed during this audit expose only main.
- Preserve AD-1 through AD-4. Retail, checkout, cart, wishlist and finance/settlement remain dormant pending owner approval.
- **Next action:** continue Product nested-resource IDOR/concurrency review and CMS category/revision edge cases; then audit remaining roles/settings/Auth sensitive operations. Keep retention policy blocked on owner/legal direction.
