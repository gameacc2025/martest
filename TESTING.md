# Testing and verification

## Automated checks

| Command | Coverage |
|---|---|
| `pnpm test` | Root Vitest projects and the auth handoff node:test suite |
| `pnpm --dir backend test` | Backend unit/service/route tests using Node's test runner |
| `pnpm build` | Production builds for Website, Company and Admin |
| `node scripts/generate-architecture-graph.mjs --check` | Verifies the committed architecture graph matches workspace manifests and registered backend modules |
| `docker compose config --quiet` | Validates Compose configuration after required env files are prepared |
| `docker compose up -d --build` | Builds and starts PostgreSQL, backend and all three nginx-served SPAs |
| `docker compose exec -T backend npx prisma migrate status` | Verifies the applied migration state of the runtime database |
| `cd e2e && npm install --no-package-lock && npx playwright install chromium && npm test` | Browser smoke tests for all three panels and their API proxies |

The GitHub Actions workflows run unit/build checks and runtime validation. See [CI](.github/workflows/ci.yml) and [Runtime Validation](.github/workflows/runtime-validation.yml).

## Runtime validation

The runtime workflow prepares disposable root/backend environment files, starts a fresh PostgreSQL volume through Compose, waits for backend and panel health endpoints, checks Prisma migration status, then runs Playwright in Chromium. It destroys the disposable Compose volume at the end. Never point this workflow at a production database.

The current Playwright suite checks:
- Website, Company and Admin SPA entrypoint returns HTTP 200 and mounts the Vue root.
- Initial desktop render and mobile viewport change do not produce uncaught browser JavaScript errors.
- Each panel's nginx proxy forwards an unauthenticated `GET /api/v1/auth/me` to the backend and receives the expected 401 rather than a proxy error.

These are browser/runtime smoke tests, not full business-flow acceptance tests. They do not yet prove successful login/logout, role-specific route denial, product create/approval/publication, inquiry response ownership, notification folder/count behavior, or visual parity across all pages. Those flows need seeded test fixtures and dedicated assertions before release sign-off.

## Database migrations

`prisma generate` validates client generation but does not execute migration SQL. The runtime workflow exercises migrations by starting the backend against a newly created PostgreSQL volume, then runs `prisma migrate status`. To reproduce locally:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
# Replace sample credentials with disposable local values.
docker compose up -d --build
docker compose exec -T backend npx prisma migrate status
docker compose down -v
```

Only use `down -v` with disposable test data.

## SMTP

The automated workflow does not have a real SMTP provider's credentials and therefore cannot assert external email delivery. Unit tests and configuration checks are not equivalent to a successful send/receive against the configured provider. To verify production SMTP, configure credentials in a protected environment and send a controlled test message while inspecting provider response and delivery logs. SMS is not implemented by the current dispatch service.

## Bundle warnings and limitations

Production build warnings are recorded from CI output. A successful build does not by itself establish acceptable real-user performance. Review bundle analyzer output and route/store imports before changing chunking. Avoid raising the warning threshold merely to silence an oversized chunk.
