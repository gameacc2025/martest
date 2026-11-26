import { test, expect } from '@playwright/test';

test('STAFF CRM workspace completes lead conversion, account/contact, opportunity, task, activity and note flows', async ({ browser }) => {
  test.setTimeout(120_000);
  const context = await browser.newContext({ viewport: { width: 1365, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  const stamp = Date.now();
  const leadName = 'CRM E2E Lead ' + stamp;
  const companyName = 'CRM E2E Company ' + stamp;
  const contactName = 'CRM E2E Contact ' + stamp;
  const opportunityTitle = 'CRM E2E Opportunity ' + stamp;
  const taskTitle = 'CRM E2E Follow-up ' + stamp;
  const activitySubject = 'CRM E2E Call ' + stamp;
  const noteBody = 'CRM E2E private note ' + stamp;

  await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });
  await page.getByPlaceholder('شماره تلفن خود را وارد کنید').fill(process.env.E2E_ADMIN_PHONE || '09120000000');
  await page.getByPlaceholder('رمز عبور خود را وارد کنید').fill(process.env.E2E_ADMIN_PASSWORD || 'A123@456');
  await page.getByRole('button', { name: 'ورود' }).click();
  await expect(page).toHaveURL(/http:\/\/localhost:3003\/admin-dashboard(?:[/?#]|$)/, { timeout: 45_000 });

  await page.goto('http://localhost:3003/crm/leads', { waitUntil: 'networkidle' });
  await expect(page.locator('.crm-page')).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'ثبت سرنخ جدید' }).click();
  await page.getByLabel('نام مخاطب *').fill(leadName);
  await page.getByLabel('نام شرکت').fill(companyName);
  await page.getByLabel('ایمیل').fill('crm-e2e-' + stamp + '@example.test');
  await page.getByLabel('تلفن').fill('+1555' + String(stamp).slice(-7));
  await page.getByRole('button', { name: 'ثبت سرنخ', exact: true }).click();

  const leadRow = page.locator('.crm-table tbody tr').filter({ hasText: leadName });
  await expect(leadRow).toBeVisible({ timeout: 20_000 });
  await leadRow.getByRole('button', { name: 'ثبت تماس' }).click();
  await expect(leadRow.getByRole('button', { name: 'واجد شرایط' })).toBeVisible({ timeout: 20_000 });
  await leadRow.getByRole('button', { name: 'واجد شرایط' }).click();
  await expect(leadRow.getByRole('button', { name: 'تبدیل به حساب' })).toBeVisible({ timeout: 20_000 });
  await leadRow.getByRole('button', { name: 'تبدیل به حساب' }).click();
  await expect(leadRow.locator('.crm-status')).toHaveText('تبدیل‌شده', { timeout: 20_000 });

  await page.goto('http://localhost:3003/crm/accounts', { waitUntil: 'networkidle' });
  const accountCard = page.locator('.crm-account-card').filter({ hasText: companyName });
  await expect(accountCard).toBeVisible({ timeout: 20_000 });
  await accountCard.click();
  await expect(page.locator('.crm-modal')).toContainText(companyName);
  await page.getByRole('button', { name: 'افزودن مخاطب' }).click();
  await page.getByLabel('نام *').fill(contactName);
  await page.getByLabel('عنوان').fill('Purchasing manager');
  await page.getByLabel('ایمیل').fill('contact-' + stamp + '@example.test');
  await page.getByLabel('تلفن').fill('+15556667777');
  await page.getByRole('button', { name: 'ایجاد مخاطب' }).click();
  const accountModal = page.locator('.crm-modal-backdrop').filter({ hasText: companyName }).locator('.crm-modal');
  await expect(accountModal).toContainText(contactName, { timeout: 20_000 });
  await page.getByRole('button', { name: 'بستن' }).click();

  await page.goto('http://localhost:3003/crm/pipeline', { waitUntil: 'networkidle' });
  await expect(page.locator('.crm-kanban')).toBeVisible({ timeout: 20_000 });
  await page.locator('.crm-panel-head').filter({ hasText: 'قیف فرصت‌های فروش' }).getByRole('button', { name: 'ایجاد فرصت' }).click();
  await page.getByLabel('حساب CRM *').selectOption({ label: companyName });
  await page.getByLabel('عنوان فرصت *').fill(opportunityTitle);
  await page.getByLabel('مبلغ').fill('1250000');
  await page.getByRole('button', { name: 'ثبت فرصت' }).click();
  const opportunityCard = page.locator('.crm-opportunity').filter({ hasText: opportunityTitle });
  await expect(opportunityCard).toBeVisible({ timeout: 20_000 });

  await page.goto('http://localhost:3003/crm/tasks', { waitUntil: 'networkidle' });
  await page.locator('.crm-panel-head').filter({ hasText: 'برنامه پیگیری‌ها' }).getByRole('button', { name: 'ایجاد وظیفه' }).click();
  await page.getByLabel('عنوان *').fill(taskTitle);
  await page.getByLabel('مرتبط با حساب').selectOption({ label: companyName });
  await page.locator('.crm-modal').getByRole('button', { name: 'ایجاد وظیفه' }).click();
  await expect(page.locator('.crm-task').filter({ hasText: taskTitle })).toBeVisible({ timeout: 20_000 });

  await page.goto('http://localhost:3003/crm/activities', { waitUntil: 'networkidle' });
  await page.locator('.crm-modal').getByRole('button', { name: 'ثبت تعامل' }).click();
  await page.getByLabel('موضوع *').fill(activitySubject);
  await page.getByLabel('توضیحات').fill('Verified by the CRM browser acceptance flow.');
  await page.getByLabel('مرتبط با حساب').selectOption({ label: companyName });
  await page.getByRole('button', { name: 'ثبت تعامل' }).click();
  await expect(page.locator('.crm-activity').filter({ hasText: activitySubject })).toBeVisible({ timeout: 20_000 });

  await page.goto('http://localhost:3003/crm/leads', { waitUntil: 'networkidle' });
  const convertedLeadRow = page.locator('.crm-table tbody tr').filter({ hasText: leadName });
  await convertedLeadRow.getByRole('button', { name: 'جزئیات' }).click();
  await expect(page.locator('.crm-detail-modal')).toBeVisible();
  await page.getByRole('button', { name: 'ایجاد یادداشت' }).click();
  await page.getByLabel('متن *').fill(noteBody);
  await page.getByLabel('مشاهده').selectOption('PRIVATE');
  const noteForm = page.locator('.crm-modal form').filter({ has: page.getByLabel('متن *') });
  await noteForm.getByRole('button', { name: 'ایجاد یادداشت' }).click();
  await expect(page.locator('.crm-modal')).toBeVisible();
  await page.getByRole('button', { name: 'بستن' }).click();
  await convertedLeadRow.getByRole('button', { name: 'جزئیات' }).click();
  await expect(page.locator('.crm-timeline-item').filter({ hasText: noteBody })).toBeVisible({ timeout: 20_000 });

  expect(errors, 'CRM create/update workflows must not emit uncaught browser errors').toEqual([]);
  await context.close();
});
