import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // E2E scenarios share the seeded STAFF account and exercise login rate limits.
  // Run serially in CI to avoid concurrent sessions invalidating one another.
  fullyParallel: false,
  workers: process.env.CI ? 1 : undefined,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  timeout: 30_000,
  use: {
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
