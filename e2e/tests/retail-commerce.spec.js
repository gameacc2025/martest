import { test, expect } from '@playwright/test';

const websiteUrl = process.env.WEBSITE_URL || 'http://localhost:3001/';
const companyUrl = process.env.COMPANY_URL || 'http://localhost:3002/';
const demoPassword = process.env.DEMO_USER_PASSWORD || 'A123@456';

async function loginThroughWebsite(page, phone) {
  await page.goto(new URL('/login', websiteUrl).toString(), { waitUntil: 'networkidle' });
  await page.getByPlaceholder('شماره تلفن خود را وارد کنید').fill(phone);
  await page.getByPlaceholder('رمز عبور خود را وارد کنید').fill(demoPassword);
  await page.getByRole('button', { name: 'ورود' }).click();
}

test('B2C customer order and sandbox payment coexist with B2B company RFQ creation', async ({ browser }) => {
  test.setTimeout(180_000);

  // B2C: a dedicated synthetic CUSTOMER fixture performs a real browser journey.
  const customerContext = await browser.newContext({ viewport: { width: 1365, height: 900 } });
  const customerPage = await customerContext.newPage();
  const customerErrors = [];
  customerPage.on('pageerror', error => customerErrors.push(error.message));

  await loginThroughWebsite(customerPage, process.env.E2E_CUSTOMER_PHONE || '09912000001');
  await expect(customerPage).toHaveURL(new RegExp('^' + websiteUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\/$/, '') + '/?$'), { timeout: 30_000 });

  const catalogResponsePromise = customerPage.waitForResponse(response =>
    response.url().includes('/api/v1/retail/catalog') && response.request().method() === 'GET'
  );
  await customerPage.goto(new URL('/products?retail=1', websiteUrl).toString(), { waitUntil: 'networkidle' });
  const catalogResponse = await catalogResponsePromise;
  const catalogBody = await catalogResponse.json();
  const catalogItems = Array.isArray(catalogBody?.data) ? catalogBody.data : [];
  console.log('[retail-e2e] catalog status/items/sample:', catalogResponse.status(), catalogItems.length,
    catalogItems[0] ? {
      retailEnabled: catalogItems[0].retailEnabled,
      inStock: catalogItems[0].inStock,
      retailPrice: catalogItems[0].retailPrice,
      prices: catalogItems[0].prices?.length,
    } : null);
  const retailCards = customerPage.locator('.prods article.p');
  await expect(retailCards.first()).toBeVisible({ timeout: 25_000 });
  const firstRetailProduct = retailCards.filter({
    has: customerPage.getByRole('button', { name: 'افزودن به سبد' }),
  }).first();
  const selectedProductTitle = await firstRetailProduct.locator('h3').innerText();
  const addToCartButton = firstRetailProduct.getByRole('button', { name: 'افزودن به سبد' });
  await expect(addToCartButton).toBeEnabled({ timeout: 10_000 });
  await addToCartButton.click();
  await expect(customerPage.locator('.catalog-cart-feedback')).toContainText('محصول به سبد خرید اضافه شد');

  await customerPage.goto(new URL('/profile/addresses', websiteUrl).toString(), { waitUntil: 'networkidle' });
  await customerPage.getByRole('button', { name: 'افزودن آدرس جدید' }).click();
  await customerPage.locator('input[name="addressLabel"]').fill('آدرس آزمون B2C');
  await customerPage.locator('input[name="recipientName"]').fill('مشتری آزمون');
  await customerPage.locator('input[name="recipientPhone"]').fill('09121112233');
  await customerPage.locator('input[name="province"]').fill('تهران');
  await customerPage.locator('input[name="city"]').fill('تهران');
  await customerPage.locator('input[name="postalCode"]').fill('1234567890');
  await customerPage.locator('textarea[name="addressLine"]').fill('خیابان آزمون، پلاک ۱۰، واحد ۲');
  await customerPage.locator('input[name="isDefault"]').check();
  await customerPage.getByRole('button', { name: 'ذخیره آدرس' }).click();
  await expect(customerPage.getByRole('status')).toContainText('آدرس جدید ذخیره شد.');

  await customerPage.goto(new URL('/checkout', websiteUrl).toString(), { waitUntil: 'networkidle' });
  const placeOrder = customerPage.getByRole('button', { name: 'ثبت سفارش و ادامه به پرداخت آزمایشی' });
  await expect(placeOrder).toBeEnabled({ timeout: 25_000 });
  await placeOrder.click();
  await expect(customerPage).toHaveURL(/\/sandbox-payment\//, { timeout: 30_000 });
  await expect(customerPage.getByText('محیط آزمایشی — بدون تراکنش بانکی واقعی')).toBeVisible();
  await customerPage.getByRole('button', { name: 'تأیید پرداخت آزمایشی' }).click();
  await expect(customerPage).toHaveURL(/\/orders\/\d+/, { timeout: 30_000 });
  await expect(customerPage.locator('body')).toContainText(selectedProductTitle);
  const orderNumber = await customerPage.locator('.order-summary-card > div:first-child strong').innerText();
  expect(orderNumber.startsWith('TM-')).toBe(true);
  await customerPage.goto(new URL('/orders', websiteUrl).toString(), { waitUntil: 'networkidle' });
  await expect(customerPage.locator('body')).toContainText(orderNumber);
  expect(customerErrors, 'B2C browser journey must not produce uncaught JavaScript errors').toEqual([]);
  await customerContext.close();

  // B2B: a separate COMPANY manager creates an RFQ without disabling retail.
  const companyContext = await browser.newContext({ viewport: { width: 1365, height: 900 } });
  const companyPage = await companyContext.newPage();
  const companyErrors = [];
  companyPage.on('pageerror', error => companyErrors.push(error.message));

  await loginThroughWebsite(companyPage, process.env.E2E_COMPANY_PHONE || '09911000001');
  await expect(companyPage).toHaveURL(/http:\/\/localhost:3002\/company-dashboard(?:[/?#]|$)/, { timeout: 45_000 });
  await companyPage.goto(new URL('/inquiries/create', companyUrl).toString(), { waitUntil: 'networkidle' });
  await expect(companyPage.locator('.inquiry-create-page')).toBeVisible({ timeout: 20_000 });

  const inquiryTitle = 'E2E B2B RFQ ' + Date.now();
  await companyPage.locator('#inquiry-title').fill(inquiryTitle);
  await companyPage.locator('#inquiry-description').fill('RFQ regression created alongside active B2C retail checkout.');
  await companyPage.getByRole('button', { name: 'بعدی' }).click();

  const productSelect = companyPage.locator('#inquiry-product');
  await expect(productSelect).toBeVisible();
  await productSelect.click();
  await companyPage.getByRole('option').first().click();
  await companyPage.getByRole('button', { name: 'افزودن', exact: true }).click();
  await expect(companyPage.locator('.inquiry-progress-item-count')).toContainText('۱ قلم انتخاب شده');
  await companyPage.getByRole('button', { name: 'بعدی' }).click();
  await companyPage.getByRole('button', { name: 'بعدی' }).click();
  await companyPage.getByRole('button', { name: 'بعدی' }).click();
  await companyPage.getByRole('button', { name: 'ثبت استعلام' }).click();

  await expect(companyPage).toHaveURL(/http:\/\/localhost:3002\/inquiries(?:[/?#]|$)/, { timeout: 30_000 });
  await expect(companyPage.locator('body')).toContainText(inquiryTitle, { timeout: 25_000 });
  expect(companyErrors, 'B2B inquiry regression must not produce uncaught JavaScript errors').toEqual([]);
  await companyContext.close();
});
