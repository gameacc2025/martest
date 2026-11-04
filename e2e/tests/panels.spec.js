import { test, expect } from '@playwright/test';

const viewports = [360, 768, 1366, 1920, 2560];

const panels = [
  { name: 'Website', url: process.env.WEBSITE_URL || 'http://localhost:3001/' },
  { name: 'Company', url: process.env.COMPANY_URL || 'http://localhost:3002/' },
  { name: 'Admin', url: process.env.ADMIN_URL || 'http://localhost:3003/' },
];

for (const panel of panels) {
  test(`${panel.name} SPA renders at desktop and mobile sizes without uncaught errors`, async ({ browser }) => {
    const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
    const uncaughtErrors = [];
    page.on('pageerror', (error) => uncaughtErrors.push(error.message));

    const response = await page.goto(panel.url, { waitUntil: 'networkidle' });
    expect(response, 'navigation should return a response').not.toBeNull();
    expect(response.status(), 'SPA entrypoint should return HTTP 200').toBe(200);
    await expect(page.locator('#app')).toBeAttached({ timeout: 20_000 });
    await expect(page.locator('body')).not.toBeEmpty();
    expect(uncaughtErrors, 'no uncaught JavaScript errors on initial render').toEqual([]);

    for (const width of viewports) {
      await page.setViewportSize({ width, height: 900 });
      await expect(page.locator('#app')).toBeVisible();
      const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        document: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
      }));
      expect(
        dimensions.document,
        `no horizontal overflow at ${width}px (document=${dimensions.document}px)`,
      ).toBeLessThanOrEqual(dimensions.viewport);
      expect(uncaughtErrors, `no uncaught JavaScript errors at ${width}px`).toEqual([]);
    }
    await page.close();
  });

  test(`${panel.name} nginx proxy forwards API requests to backend`, async ({ request }) => {
    const response = await request.get(new URL('/api/v1/auth/me', panel.url).toString());
    // A 401 proves the request reached the protected API route; 404/502/503
    // usually indicate a broken proxy or unavailable backend.
    expect(response.status()).toBe(401);
  });
}


test('Website homepage remains horizontally contained at all required viewport widths', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const response = await page.goto(process.env.WEBSITE_URL || 'http://localhost:3001/', { waitUntil: 'networkidle' });
  expect(response?.status()).toBe(200);
  await expect(page.locator('.home-hero')).toBeVisible({ timeout: 20_000 });

  for (const width of viewports) {
    await page.setViewportSize({ width, height: 900 });
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    }));
    expect(dimensions.document, `homepage must not overflow at ${width}px`).toBeLessThanOrEqual(dimensions.viewport);
  }

  expect(errors).toEqual([]);
  await page.close();
});
