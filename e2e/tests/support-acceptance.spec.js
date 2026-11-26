import { test, expect } from '@playwright/test';

const websiteUrl = process.env.WEBSITE_URL || 'http://localhost:3001/';
const companyUrl = process.env.COMPANY_URL || 'http://localhost:3002/';
const adminUrl = process.env.ADMIN_URL || 'http://localhost:3003/';
const demoPassword = process.env.DEMO_USER_PASSWORD || 'A123@456';

async function login(page, phone, password = demoPassword) {
  await page.goto(new URL('/login', websiteUrl).toString(), { waitUntil: 'networkidle' });
  await page.getByPlaceholder('شماره تلفن خود را وارد کنید').fill(phone);
  await page.getByPlaceholder('رمز عبور خود را وارد کنید').fill(password);
  await page.getByRole('button', { name: 'ورود' }).click();
}

async function createTicket(page, subject, body) {
  await page.getByRole('button', { name: 'ایجاد تیکت جدید' }).click();
  await page.getByLabel('موضوع تیکت').fill(subject);
  await page.getByLabel('دسته‌بندی').selectOption({ label: 'عمومی' });
  await page.getByLabel('شرح درخواست').fill(body);
  await page.getByRole('button', { name: 'ثبت تیکت', exact: true }).click();
  const ticket = page.locator('.tm-ticket-desk__ticket').filter({ hasText: subject });
  await expect(ticket).toBeVisible({ timeout: 20_000 });
  return ticket;
}

test('Support enforces CUSTOMER/COMPANY tenant boundaries and STAFF-only internal notes', async ({ browser }) => {
  test.setTimeout(150_000);
  const stamp = Date.now();
  const customerSubject = 'SUPPORT CUSTOMER E2E ' + stamp;
  const companySubject = 'SUPPORT COMPANY E2E ' + stamp;
  const customerBody = 'Customer ticket created by the Support browser acceptance flow.';
  const internalNote = 'STAFF-only internal note ' + stamp;
  const errors = [];

  const customerContext = await browser.newContext({ viewport: { width: 1365, height: 900 } });
  const customerPage = await customerContext.newPage();
  customerPage.on('pageerror', error => errors.push('customer: ' + error.message));
  await login(customerPage, process.env.E2E_CUSTOMER_PHONE || '09912000001');
  await expect(customerPage).toHaveURL(new RegExp('^' + websiteUrl.replace(/[.*+?^\u0024{}()|[\]\\\\]/g, '\\$&').replace(/\/$/, '') + '/?$'), { timeout: 45_000 });
  await customerPage.goto(new URL('/support/tickets', websiteUrl).toString(), { waitUntil: 'networkidle' });
  await expect(customerPage.locator('.tm-ticket-desk')).toBeVisible({ timeout: 20_000 });
  await createTicket(customerPage, customerSubject, customerBody);

  const adminContext = await browser.newContext({ viewport: { width: 1365, height: 900 } });
  const adminPage = await adminContext.newPage();
  adminPage.on('pageerror', error => errors.push('admin: ' + error.message));
  await login(adminPage, process.env.E2E_ADMIN_PHONE || '09120000000', process.env.E2E_ADMIN_PASSWORD || demoPassword);
  await expect(adminPage).toHaveURL(/http:\/\/localhost:3003\/admin-dashboard(?:[/?#]|$)/, { timeout: 45_000 });
  await adminPage.goto(new URL('/support/tickets', adminUrl).toString(), { waitUntil: 'networkidle' });
  await expect(adminPage.locator('.tm-ticket-desk')).toBeVisible({ timeout: 20_000 });
  const staffTicket = adminPage.locator('.tm-ticket-desk__ticket').filter({ hasText: customerSubject });
  await expect(staffTicket).toBeVisible({ timeout: 20_000 });
  await staffTicket.click();
  await expect(adminPage.locator('.tm-ticket-desk__conversation')).toContainText(customerBody);
  await adminPage.locator('.tm-ticket-desk__internal-toggle input').check();
  await adminPage.locator('[aria-label="متن پاسخ"]').fill(internalNote);
  await adminPage.getByRole('button', { name: 'ثبت یادداشت داخلی' }).click();
  await expect(adminPage.locator('.tm-ticket-desk__message.internal').filter({ hasText: internalNote })).toBeVisible({ timeout: 20_000 });

  await customerPage.reload({ waitUntil: 'networkidle' });
  await expect(customerPage.locator('.tm-ticket-desk__ticket').filter({ hasText: customerSubject })).toBeVisible({ timeout: 20_000 });
  await expect(customerPage.locator('.tm-ticket-desk__message').filter({ hasText: internalNote })).toHaveCount(0);

  const companyContext = await browser.newContext({ viewport: { width: 1365, height: 900 } });
  const companyPage = await companyContext.newPage();
  companyPage.on('pageerror', error => errors.push('company: ' + error.message));
  await login(companyPage, process.env.E2E_COMPANY_PHONE || '09911000001');
  await expect(companyPage).toHaveURL(/http:\/\/localhost:3002\/company-dashboard(?:[/?#]|$)/, { timeout: 45_000 });
  await companyPage.goto(new URL('/support/tickets', companyUrl).toString(), { waitUntil: 'networkidle' });
  await expect(companyPage.locator('.tm-ticket-desk')).toBeVisible({ timeout: 20_000 });
  await expect(companyPage.locator('.tm-ticket-desk__ticket').filter({ hasText: customerSubject })).toHaveCount(0);
  await createTicket(companyPage, companySubject, 'Company ticket created by the Support browser acceptance flow.');

  await customerPage.reload({ waitUntil: 'networkidle' });
  await expect(customerPage.locator('.tm-ticket-desk__ticket').filter({ hasText: companySubject })).toHaveCount(0);

  expect(errors, 'Support customer/company/staff flows must not emit uncaught browser errors').toEqual([]);
  await customerContext.close();
  await adminContext.close();
  await companyContext.close();
});
