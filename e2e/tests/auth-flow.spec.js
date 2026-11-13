import { test, expect } from '@playwright/test';

test('STAFF can log in through Website, reach Admin by handoff, and log out', async ({ browser }) => {
  test.setTimeout(90_000);
  const context = await browser.newContext({ viewport: { width: 1365, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });
  await page.getByPlaceholder('شماره تلفن خود را وارد کنید').fill(process.env.E2E_ADMIN_PHONE || '09120000000');
  await page.getByPlaceholder('رمز عبور خود را وارد کنید').fill(process.env.E2E_ADMIN_PASSWORD || 'A123@456');
  await page.getByRole('button', { name: 'ورود' }).click();

  await expect(page).toHaveURL(/http:\/\/localhost:3003\/admin-dashboard(?:[/?#]|$)/, { timeout: 45_000 });
  await expect(page.locator('.dash-layout')).toBeVisible({ timeout: 15_000 });

  await page.goto('http://localhost:3003/crm/leads', { waitUntil: 'networkidle' });
  await expect(page.locator('.crm-page')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole('heading', { name: 'سرنخ‌های فروش' })).toBeVisible();
  await expect(page.locator('.crm-table tbody tr').first()).toBeVisible({ timeout: 20_000 });

  await page.goto('http://localhost:3003/support/tickets', { waitUntil: 'networkidle' });
  await expect(page.locator('.tm-ticket-desk')).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'ایجاد تیکت جدید' }).click();
  const supportSubject = 'E2E Support ticket ' + Date.now();
  const supportMessage = 'Support ticket body created by browser acceptance.';
  await page.getByLabel('موضوع تیکت').fill(supportSubject);
  await page.getByLabel('شرح درخواست').fill(supportMessage);
  await page.getByRole('button', { name: 'ثبت تیکت' }).click();
  const createdTicket = page.locator('.tm-ticket-desk__ticket').filter({ hasText: supportSubject });
  await expect(createdTicket).toBeVisible({ timeout: 20_000 });
  await createdTicket.click();
  await expect(page.locator('.tm-ticket-desk__messages')).toContainText(supportMessage);
  const supportReply = 'Support reply verified by browser acceptance.';
  await page.getByLabel('متن پاسخ').fill(supportReply);
  await page.getByRole('button', { name: 'ارسال پاسخ' }).click();
  await expect(page.locator('.tm-ticket-desk__messages')).toContainText(supportReply, { timeout: 20_000 });

  const categoryName = 'E2E category ' + Date.now();
  await page.goto('http://localhost:3003/cms/categories', { waitUntil: 'networkidle' });
  await expect(page.locator('.category-management')).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'دسته‌بندی جدید' }).click();
  await page.getByLabel('نام *').fill(categoryName);
  await page.getByRole('button', { name: 'ذخیره' }).click();
  const categoryRow = page.locator('.category-table-wrap tbody tr').filter({ hasText: categoryName });
  await expect(categoryRow).toBeVisible({ timeout: 20_000 });
  await categoryRow.getByRole('button', { name: 'حذف دسته‌بندی' }).click();
  await page.getByRole('button', { name: 'بله، حذف شود' }).click();
  await expect(categoryRow).toHaveCount(0, { timeout: 20_000 });

  const tagName = 'E2E tag ' + Date.now();
  await page.goto('http://localhost:3003/cms/tags', { waitUntil: 'networkidle' });
  await expect(page.locator('.tag-management')).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'برچسب جدید' }).click();
  await page.getByLabel('نام *').fill(tagName);
  await page.getByRole('button', { name: 'ذخیره' }).click();
  const tagRow = page.locator('.tag-table-wrap tbody tr').filter({ hasText: tagName });
  await expect(tagRow).toBeVisible({ timeout: 20_000 });
  await tagRow.getByRole('button', { name: 'حذف برچسب' }).click();
  await page.getByRole('button', { name: 'بله، حذف شود' }).click();
  await expect(tagRow).toHaveCount(0, { timeout: 20_000 });

  const faqQuestion = 'E2E FAQ ' + Date.now();
  await page.goto('http://localhost:3003/cms/faqs', { waitUntil: 'networkidle' });
  await expect(page.locator('.faq-management')).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'سوال جدید' }).click();
  await page.getByLabel('سوال *').fill(faqQuestion);
  await page.getByLabel('پاسخ *').fill('پاسخ آزمایشی برای آزمون مرورگری.');
  await page.getByRole('button', { name: 'ذخیره' }).click();
  const faqRow = page.locator('.faq-table-wrap tbody tr').filter({ hasText: faqQuestion });
  await expect(faqRow).toBeVisible({ timeout: 20_000 });
  await faqRow.getByRole('button', { name: 'حذف سوال' }).click();
  await page.getByRole('button', { name: 'بله، حذف شود' }).click();
  await expect(faqRow).toHaveCount(0, { timeout: 20_000 });

  const pageTitle = 'E2E page ' + Date.now();
  const pageSlug = 'custom-e2e-' + Date.now();
  await page.goto('http://localhost:3003/cms/pages', { waitUntil: 'networkidle' });
  await expect(page.locator('.page-management')).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'صفحه جدید' }).click();
  await page.getByLabel('عنوان *').fill(pageTitle);
  await page.getByLabel('اسلاگ *').fill(pageSlug);
  await page.locator('.ql-editor').fill('محتوای آزمایشی صفحه سفارشی.');
  await page.getByRole('button', { name: 'ذخیره' }).click();
  const pageRow = page.locator('.page-table-wrap tbody tr').filter({ hasText: pageTitle });
  await expect(pageRow).toBeVisible({ timeout: 20_000 });
  await pageRow.getByRole('button', { name: 'حذف صفحه' }).click();
  await page.getByRole('button', { name: 'بله، حذف شود' }).click();
  await expect(pageRow).toHaveCount(0, { timeout: 20_000 });

  await page.locator('button.dash-header-user').click();
  await page.getByText('خروج', { exact: true }).click();
  await expect(page).toHaveURL(/http:\/\/localhost:3001\/login(?:[/?#]|$)/, { timeout: 20_000 });
  expect(errors, 'no uncaught JavaScript errors through login/handoff/logout').toEqual([]);
  await context.close();
});
