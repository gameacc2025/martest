# PROJECT-WIDE-AUDIT-AND-REPAIR-2026-11-19

**Status:** IN PROGRESS — source and exact-main acceptance verified; tenant/audit coverage review continues.  
**Repository:** gameacc2025/martest  
**Integration branch:** main only; lead owns serialized writes/commits/pushes.  
**Current main / latest fully tested SHA:** ee81257b18424554ccf4b31dbdc2c93fa2581a85

## Exact-main verification

- **CI PASS:** 44531746720 — 69 Frontend/Shared test files, 390 Frontend/Shared tests, 18 architecture/session tests, 1,753 Backend tests; Website, Company and Admin production builds.
- **Fresh PostgreSQL migration PASS:** 44531746798 — Prisma validation/client generation, all migrations on a fresh database, Prisma model/table parity and migration-state verification.
- **Runtime PASS:** 44531746905 — Compose config/build, PostgreSQL/backend/all panels healthy, migrations and model/table parity, all development seeds run twice, AD-1/AD-3 grants reconciled, 8/8 Playwright smoke tests, teardown succeeded.

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
- AD-3 wording and the duplicated main-only/publishing instructions were clarified; current task handoff no longer contains literal escaped newline text.

## Remaining work

1. Continue resource-by-resource tenant/IDOR review across Product, Inquiry, Support, CMS, Auth, Notifications and administrative modules. Targeted checks are not an exhaustive sign-off.
2. Expand central AuditLog producers to CMS, Product lifecycle (in addition to its existing ProductActivityLog), roles/settings and remaining security-sensitive operations; assess transaction boundaries before instrumenting each service.
3. Obtain owner/legal direction for AuditLog retention, archival and deletion policy. Do not invent a retention period.
4. Continue resource-specific Product IDOR checks for price tiers, images, documents, and status transitions; baseline ownership guards and cross-company tests already exist.
5. Finish dashboard/reporting completeness and broader visual/accessibility regression.
6. Live SMTP/Twilio/payment-provider delivery and production deployment remain NOT VERIFIED.
7. Owner's Windows working tree, local Docker daemon and developer PostgreSQL remain NOT VERIFIED by GitHub Actions.

## Governance and handoff

- Repository rulesets endpoint returned an empty list; branch-protection read returned 403 to the GitHub integration. Server-side branch protection is NOT VERIFIED. Repository policy documents main-only work; Git refs observed during this audit expose only main.
- Preserve AD-1 through AD-4. Retail, checkout, cart, wishlist and finance/settlement remain dormant pending owner approval.
- **Next action:** continue Product/CMS tenant and authorization review; then add central AuditLog coverage where a domain-specific immutable history is insufficient. Keep retention policy blocked on owner/legal direction.
