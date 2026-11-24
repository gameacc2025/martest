const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

const productsById = new Map();
let listedProducts = [];
let balancesByProduct = new Map();
let listArgs = null;

function injectMock(relativePath, exportsObj) {
  const resolved = require.resolve(path.join(__dirname, relativePath));
  const original = require.cache[resolved];
  const mockModule = new Module(resolved);
  mockModule.filename = resolved;
  mockModule.loaded = true;
  mockModule.exports = exportsObj;
  require.cache[resolved] = mockModule;
  test.after(() => {
    if (original) require.cache[resolved] = original;
    else delete require.cache[resolved];
  });
}

injectMock('../../config/db', {
  inventoryBalance: {
    findMany: async ({ where }) => [...balancesByProduct.values()].filter((balance) => where.productId.in.includes(balance.productId)),
    findUnique: async ({ where }) => balancesByProduct.get(where.productId) || null,
  },
});

injectMock('../products/product.service', {
  listProducts: async (args) => {
    listArgs = args;
    return { items: listedProducts, total: listedProducts.length };
  },
  getProductById: async (id) => productsById.get(Number(id)) || null,
});

const service = require('./retail.service');

function priceTier(minQuantity, price, maxQuantity = null, overrides = {}) {
  return {
    minQuantity,
    maxQuantity,
    price: String(price),
    unit: 'عدد',
    validFrom: new Date('2026-01-01T00:00:00.000Z'),
    validTo: null,
    ...overrides,
  };
}

function product(id, overrides = {}) {
  return {
    id,
    title: `Retail product ${id}`,
    sku: `R-${id}`,
    retailEnabled: true,
    companyId: 10,
    company: { id: 10, name: 'Demo Seller' },
    prices: [priceTier(1, 1000)],
    ...overrides,
  };
}

test.beforeEach(() => {
  productsById.clear();
  listedProducts = [];
  balancesByProduct = new Map();
  listArgs = null;
});

test('selectPriceTier chooses the most specific current tier for the requested quantity', () => {
  const tiers = [
    priceTier(1, 1000, 9),
    priceTier(10, 900),
    priceTier(1, 500, 9, { validFrom: new Date('2027-01-01T00:00:00.000Z') }),
    priceTier(1, 400, 9, { validTo: new Date('2026-01-01T00:00:00.000Z') }),
  ];
  assert.equal(service.selectPriceTier(tiers, 5).price, '1000');
  assert.equal(service.selectPriceTier(tiers, 12).price, '900');
  assert.equal(service.selectPriceTier(tiers, 20).price, '900');
});

test('listCatalog requires the purchasable public price tier and derives stock availability', async () => {
  listedProducts = [product(1)];
  balancesByProduct.set(1, { productId: 1, onHand: 10, reserved: 3 });

  const result = await service.listCatalog({
    skip: 0,
    take: 24,
    filters: { search: 'router' },
  });

  assert.equal(listArgs.filters.retailEnabled, true);
  assert.equal(listArgs.filters.retailPurchasable, true);
  assert.equal(listArgs.publicOnly, true);
  assert.equal(result.total, 1);
  assert.equal(result.items[0].retailPrice, '1000.00');
  assert.equal(result.items[0].currency, 'IRR');
  assert.equal(result.items[0].inStock, true);
  assert.equal(Object.hasOwn(result.items[0], 'availableQuantity'), false);
});

test('getCatalogProduct hides products without an active retail price', async () => {
  productsById.set(2, product(2, { prices: [priceTier(1, 1000, null, { validTo: new Date('2026-01-01T00:00:00.000Z') })] }));
  assert.equal(await service.getCatalogProduct(2), null);

  productsById.set(3, product(3, { retailEnabled: false }));
  assert.equal(await service.getCatalogProduct(3), null);
});

test('checkout policy status rejects malformed rates and shipping values instead of enabling placement', () => {
  const status = service.checkoutPolicyStatus({
    RETAIL_SHIPPING_FLAT_AMOUNT: 'not-a-number',
    RETAIL_TAX_RATE_BPS: '900.5',
    RETAIL_TAX_BASE: 'UNKNOWN',
    RETAIL_COMMISSION_RATE_BPS: '10001',
    RETAIL_PAYMENT_PROVIDER: 'sandbox',
    RETAIL_ORDER_PLACEMENT_ENABLED: 'true',
  });
  assert.equal(status.shipping, 'NOT_CONFIGURED');
  assert.equal(status.tax, 'NOT_CONFIGURED');
  assert.equal(status.taxBase, 'NOT_CONFIGURED');
  assert.equal(status.commission, 'NOT_CONFIGURED');
  assert.equal(status.payment, 'SANDBOX_ONLY');
  assert.equal(status.orderPlacement, 'ENABLED');
});

test('normalizeCheckoutItems rejects duplicate IDs and unsafe quantities', () => {
  assert.throws(
    () => service.normalizeCheckoutItems([{ productId: 1, quantity: 1 }, { productId: '1', quantity: 2 }]),
    { code: 'DUPLICATE_CHECKOUT_PRODUCT' }
  );
  assert.throws(
    () => service.normalizeCheckoutItems([{ productId: 1, quantity: 0 }]),
    { code: 'INVALID_CHECKOUT_ITEM' }
  );
});

test('previewCheckout validates live stock and calculates seller subtotals without inventing fees', async () => {
  productsById.set(4, product(4));
  productsById.set(5, product(5, { companyId: 11, company: { id: 11, name: 'Second Seller' }, prices: [priceTier(1, 250)] }));
  balancesByProduct.set(4, { productId: 4, onHand: 10, reserved: 2 });
  balancesByProduct.set(5, { productId: 5, onHand: 4, reserved: 0 });

  const preview = await service.previewCheckout(77, [
    { productId: 4, quantity: 2 },
    { productId: 5, quantity: 3 },
  ]);

  assert.equal(preview.currency, 'IRR');
  assert.equal(preview.subtotal, '2750.00');
  assert.equal(preview.items[0].availableQuantity, 8);
  assert.equal(preview.sellers.length, 2);
  assert.equal(preview.sellers[0].subtotal, '2000.00');
  assert.equal(preview.sellers[1].subtotal, '750.00');
  assert.equal(preview.fees.shipping, null);
  assert.equal(preview.fees.tax, null);
  assert.equal(preview.fees.total, null);
  assert.equal(preview.orderPlacementEnabled, false);
  assert.ok(preview.blockers.includes('RETAIL_ORDER_PLACEMENT_DISABLED'));
  assert.equal(preview.orderPlacementEnabled, false);
});

test('previewCheckout rejects a quantity above the current available balance', async () => {
  productsById.set(6, product(6));
  balancesByProduct.set(6, { productId: 6, onHand: 5, reserved: 3 });
  await assert.rejects(
    service.previewCheckout(77, [{ productId: 6, quantity: 3 }]),
    { code: 'INSUFFICIENT_STOCK' }
  );
});
