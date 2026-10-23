# Frontend testing

## Commands

| Command | Where it runs | What it does |
| --- | --- | --- |
| `pnpm test` | repo root | Runs every Vitest project listed in `vitest.config.js` |
| `pnpm test:watch` | repo root | Same projects, watch mode |
| `pnpm test:shared-ui` | repo root | `pnpm --filter @telecom/shared-ui test` |
| `pnpm --filter <pkg> test` | any workspace package | That package's own `test` script |
| `node --test packages/auth/sessionHandoff.test.js` | repo root | The existing `node:test` suite (kept as-is) |

A failing test exits non-zero (verified), so these commands are CI-safe.

## Tooling decision: Vitest

The frontend had **no** test framework. Requested "smallest compatible setup" for
Vue 3 + Vite + JavaScript, the choice was:

- **Vitest 5** — it reuses the toolchain that already exists (`vite@8`,
  `@vitejs/plugin-vue@6`), so `.vue` single-file components are compiled in tests
  by the *same* plugin the production build uses. No second compiler, no babel,
  no jest config to keep in sync.
- **@vue/test-utils** — the official Vue 3 mounting/interaction helper.
- **happy-dom** — browser surface (`window`, `document`, DOM events) as a pure
  Node dependency; no headless browser to download.

Rejected: Jest (needs `jest` + `babel-jest`/`ts-jest` + `vue-jest`/`@vue/vue-jest`
and a second transform pipeline), and Playwright component tests (browser
downloads, far heavier than unit-level needs).

Backend stays on `node --test` — untouched. `packages/auth/sessionHandoff.test.js`
stays on `node:test` and is **not** part of the Vitest run (drawing from two
runners for one file would double-report); it keeps its own command.

## Layout

- `vitest.config.js` (root) — wires the per-package projects together
  (`test.projects`) so `pnpm test` is one command.
- Each package that has tests owns a `vitest.config.js` declaring its own
  environment and file globs. Packages are listed in the root config only once
  they actually contain tests, so a green run can never mean "zero files ran".
- Shared tooling (`vitest`, `@vue/test-utils`, `happy-dom`) is declared at the
  workspace root; packages declare what they compile with (e.g. `shared-ui`
  declares `vite` + `@vitejs/plugin-vue`).

## What is covered so far

Coverage inventory and the smoke-test scope (what it does and does *not*
verify) are documented in Stage 3 of this work — see below.