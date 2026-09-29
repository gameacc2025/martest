TASK: backend coverage for inquiry.service.js / product.service.js (follow-up to the PKCE task)
STATUS: done — PKCE task pushed in fb07777; this coverage pass is uncommitted
CHANGED:
  PKCE task (committed as fb07777 "feat: PKCE cross-app session handoff +
    memory-only access token"): see git show fb07777 / project-context.md.
  This pass (test-only, no source changes):
    - backend/src/modules/inquiries/inquiry.service.test.js: mock Prisma layer
      extended (items/responses/attachments/stats/transactions) and the file
      grown from 17 to 107 tests — every exported service function now covered,
      including real file I/O for response attachments (writes into
      backend/uploads/... and cleans up) and the >20MB streamed size limit.
    - backend/src/modules/products/product.service.test.js: mock extended
      (slug collisions, images, documents, price tiers) and grown from 45 to
      118 tests — spec-template validation (all field types + attributes +
      reserved titles), price-tier rules, review-threshold policy, image and
      document upload/delete including >5MB limit and DB-failure cleanup.
      Grown from 39 to 117 tests.
    - backend/package.json: `test:ci` gate raised 85/85/75 → 95 lines /
      90 branches / 90 functions (per the 2026-08-08 decision in decisions.md
      to raise it once those two files were finished).
    - .ai: project-context.md §10/§14/§15/§16 and decisions.md updated.
TESTS: backend `npm test` 1062/1062; `npm run test:ci` exit 0 at
  97.87% lines / 92.62% branches / 95.88% functions (both target files at
  100% lines). Frontend tests: `node --test packages/auth/sessionHandoff.test.js`
  18/18; the three `vite build`s still pass (unaffected by this pass).
BLOCKERS: none
NEXT: candidates (see project-context.md §15 Known Issues):
  1. Start frontend test coverage (currently only packages/auth/sessionHandoff.test.js)
  2. Resolve the two-apiClient question (packages/api-client vs shared-core/http) — see decisions.md
  3. Commit this coverage pass (test files + package.json gate + .ai docs)
