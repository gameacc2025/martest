# Database Migration Runbook — DB-0 to DB-6

**Scope:** additive PostgreSQL/Prisma schema expansion.  
**Baseline:** `20261106000000_init`.  
**Migration order:** DB-1 through DB-6, followed by the documentation-only PostgreSQL catalog comments migration.  
**Prisma:** 7.10.1.  
**Important:** this runbook does not authorize enabling B2C checkout, payment, seller payout, or any new API.

## 1. Migration inventory

| Order | Migration directory | Domain |
|---:|---|---|
| 0 | `20261106000000_init` | Existing 42-model marketplace baseline |
| 1 | `20261108000100_auth_audit` | AuthChallenge, AuditLog |
| 2 | `20261108000200_support` | Support tickets, messages, assignments, SLA |
| 3 | `20261108000300_cms` | Articles, categories, tags, revisions, media |
| 4 | `20261108000400_crm` | Accounts, contacts, leads, pipelines, opportunities, activities, tasks |
| 5 | `20261108000500_retail` | Inventory, retail orders, payment records, shipments, returns |
| 6 | `20261108000600_finance` | Ledger, commissions, payables, settlements, payouts, reconciliation, invoices |
| 7 | `20261108000700_database_comments` | Persian PostgreSQL comments for all 97 tables and 962 physical columns; no schema/data changes |

All six new migrations are additive. They do not drop or rename existing core tables and do not backfill/alter existing marketplace records.

## 2. Before applying to any shared or production database

1. Confirm the deployed application revision contains the exact migrations listed above.
2. Confirm `DATABASE_URL` points to the intended database. Never paste its credential into logs or chat.
3. Run `prisma migrate status` and inspect `_prisma_migrations`. The existing baseline must be recognized as applied before applying the six incremental migrations.
4. If the database does not recognize `20261106000000_init`, stop. Do not run `migrate resolve`, `db push`, or a reset as a shortcut. Reconcile the actual database history first.
5. Take a tested, restorable PostgreSQL backup/snapshot and verify free disk space.
6. Apply and verify on a staging database with a representative data copy before production.
7. Schedule the deployment window and ensure the application version is compatible with a schema that contains unused new tables.

## 3. Local development — Docker Compose

From the repository root in PowerShell:

```powershell
docker compose -f docker-compose.dev.yml ps
docker compose -f docker-compose.dev.yml exec backend npx prisma migrate status
docker compose -f docker-compose.dev.yml exec backend npx prisma migrate deploy
docker compose -f docker-compose.dev.yml exec backend npx prisma generate
docker compose -f docker-compose.dev.yml exec backend npx prisma migrate status
```

The development backend entrypoint already runs `prisma migrate deploy` before starting the API. Therefore, starting/recreating the backend after pulling the branch may apply pending migrations automatically:

```powershell
docker compose -f docker-compose.dev.yml up -d backend
docker compose -f docker-compose.dev.yml logs --tail=200 backend
```

Check the backend startup logs and then run `migrate status`. Do not run `db:reset:dev` for this task; it deletes the local development database.

## 4. Fresh local database

On a truly empty disposable development database only, `prisma migrate deploy` applies the baseline first and then DB-1 through DB-6 in timestamp order. Run the normal project seed only after migrations succeed:

```powershell
docker compose -f docker-compose.dev.yml exec backend npx prisma migrate deploy
docker compose -f docker-compose.dev.yml exec backend npx prisma generate
docker compose -f docker-compose.dev.yml exec backend npx prisma migrate status
docker compose -f docker-compose.dev.yml exec backend npm test
```

Do not use `prisma db push` to create these tables; the SQL migrations contain PostgreSQL CHECK constraints, partial indexes and triggers that are not fully represented by Prisma Schema Language.

## 5. Production/staging command sequence

Run from the backend application directory in the deployment environment after the backup and compatibility checks:

```bash
npx prisma migrate status
npx prisma migrate deploy
npx prisma generate
npx prisma migrate status
```

Use the deployment's configured `DATABASE_URL` and Prisma config. Never use `prisma migrate dev`, `prisma migrate reset`, `prisma db push`, or a destructive reset against staging/production. Do not edit a migration that has already been applied; fix mistakes with a new forward migration.

## 6. Post-migration verification

- [ ] `prisma migrate status` reports no pending migrations.
- [ ] `_prisma_migrations` contains the baseline and all six DB-1..DB-6 migration names with successful completion.
- [ ] `prisma validate` and `prisma generate` succeed.
- [ ] Confirm expected new schema counts: 97 Prisma models and 58 enums.
- [ ] Verify critical PostgreSQL constraints/triggers exist: AuditLog append-only; one outstanding AuthChallenge per user/purpose/channel; support message/history immutability, no physical SupportTicket deletion and one active assignment per ticket; inventory nonnegative/reservation checks; order/SellerOrder composite ownership FK; immutable inventory movements/tracking events; balanced posted journal entries; settlement maker-checker.
- [ ] Run backend tests and application builds.
- [ ] Confirm existing auth, company, product, inquiry, subscription, notification and address flows still work.
- [ ] Confirm no Retail/Payment/Finance API or public checkout action has been enabled by this database-only change.

## 7. Failure and recovery

- If a migration fails before it is marked applied, preserve the database and migration logs; identify the exact failing statement before retrying.
- Never manually delete rows from `_prisma_migrations` or mark a migration applied without proving every statement's effect.
- Do not edit an already-applied migration. Create a new forward migration to correct an applied schema.
- If data integrity is uncertain, stop writes and restore the verified backup according to the deployment's recovery plan.
- The migrations are not a substitute for application-level transaction logic: inventory reservation, order state transitions, payment verification, ledger posting and tenant authorization must be implemented and tested in the API stage.

## 8. Seed data policy

No business defaults are seeded by these migrations. Support queues/categories/SLA, CRM lead sources and pipelines, and the finance chart of accounts/commission rules require explicit operational configuration. Add them through a reviewed seed or Admin setup workflow in the API stage; do not insert assumed commercial defaults into schema migrations.

## 9. Activation gates

The schema alone does not enable a feature. Keep the following disabled until the next stage:
- Self-service password recovery until challenge issuance, rate limiting and notification delivery are implemented.
- Support/CMS/CRM UI until permission-checked APIs and real workflow tests exist.
- Retail checkout, payment, refunds and seller payouts until AD-4 is explicitly revisited and the commercial, legal, currency, provider, shipping, commission and returns policies are approved.

## Verified execution result — 2026-11-08
- Fresh PostgreSQL 18.4 CI run applied baseline `20261106000000_init` and all six DB-1..DB-6 migrations successfully; `prisma migrate status` passed.
- Compose runtime health and database migration verification passed.
- Backend tests and all three app builds passed. Frontend/shared tests remain red (23 failures across 9 files); browser smoke is 6/8 with two pre-existing Website selector/viewport failures. No frontend source was changed in this DB PR.
- PR #90 is intentionally not merged while unrelated frontend/browser checks remain red. Do not run the migration against a persistent user DB until its baseline state is confirmed and the owner applies the runbook.


## 10. Database comments and data dictionary — 2026-11-08

The additive migration `20261108000700_database_comments` adds PostgreSQL catalog descriptions only:
- 97 `COMMENT ON TABLE` statements (one for every Prisma model/table).
- 962 `COMMENT ON COLUMN` statements (one for every physical scalar/enum column).
- The Prisma source has `///` documentation on all 97 models and all 1,294 model fields, including 332 relation fields. Relation fields are Prisma-level navigation properties and do not create PostgreSQL columns.
- Full field-by-field Persian descriptions and Prisma types are published in `docs/DATABASE_DATA_DICTIONARY.md`.
- Safe to apply to an already migrated database with `prisma migrate deploy`; comments are metadata and do not alter application data or schema structure. Existing comments on these objects, if any, are replaced by the new descriptions.
- No reset, backfill, data rewrite or application downtime is required by the SQL statements themselves; normal deployment/backup policy still applies.

