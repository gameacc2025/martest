import { defineConfig } from 'vitest/config'

/**
 * Root Vitest configuration for the frontend workspace.
 *
 * Tests are declared per workspace package (each package that has
 * tests owns a `vitest.config.js`), and this root file only wires them together
 * so a single `pnpm test` runs every package in one pass.
 *
 * Why Vitest (see TESTING.md for the full decision):
 *   the frontend already ships Vite 8 + `@vitejs/plugin-vue`, and Vitest reuses
 *   that exact transform pipeline for `.vue` single-file components. A second
 *   runner (Jest + babel/ts-jest + vue-jest) would need its own compiler.
 *
 * `projects` is a list of directories, each resolved through its own Vitest /
 * Vite config. Packages without tests are not listed, so `vitest run` never
 * exits 0 while silently running zero test files.
 *
 * Run:            pnpm test            (all listed projects)
 * One package:    pnpm test:shared-ui  (or `pnpm --filter <pkg> test`)
 * Watch mode:     pnpm test:watch
 */
export default defineConfig({
  test: {
    projects: ['packages/shared-ui'],
  },
})