import { test, expect } from '@playwright/test';

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

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('#app')).toBeVisible();
    expect(uncaughtErrors, 'no uncaught JavaScript errors after viewport change').toEqual([]);
    await page.close();
  });

  test(`${panel.name} nginx proxy forwards API requests to backend`, async ({ request }) => {
    const response = await request.get(new URL('/api/v1/auth/me', panel.url).toString());
    // A 401 proves the request reached the protected API route; 404/502/503
    // usually indicate a broken proxy or unavailable backend.
    expect(response.status()).toBe(401);
  });
}
