const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');

let createdOrder = null;
let orderCreateData = null;
let sellerOrderCalls = [];
let itemCalls = [];
let commissionCalls = [];
let reservationCalls = [];
let auditCalls = [];
let paymentAttemptCalls = [];
let products = [];
let address = null;

const tx = {
  retailOrder: {
    findUnique: async () => createdOrder,
    create: async ({ data }) => {
      orderCreateData = data;
      createdOrder = { id: 900, ...data, buyerUserId: data.buyerUserId, sellerOrders: [] };
      return { id: 900, orderNumber: data.orderNumber, buyerUserId: data.buyerUserId };
    },
  },
  address: { findFirst: async () => address },
  product: { findMany: async () => products },
  inventoryBalance: { findMany: async () => products.map((product) => ({ productId: product.id, onHand: 20, reserved: 0 })) },
  sellerOrder: {
    create: async ({ data }) => {
      const sellerOrder = { id: 100 + sellerOrderCalls.length, ...data };
      sellerOrderCalls.push(sellerOrder);
      return { id: sellerOrder.id, companyId: sellerOrder.companyId };
    },
  },
  commissionSnapshot: { create: async ({ data }) => commissionCalls.push(data) },
  paymentAttempt: { create: async ({ data }) => paymentAttemptCalls.push(data) },
  retailOrderItem: { create: async ({ data }) => itemCalls.push(data) },
};

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
  $transaction: async (callback) => callback(tx),
  retailOrder: {
    findUnique: async () => createdOrder,
    findMany: async () => [],
    count: async () => 0,
  },
});
injectMock('../inventory/inventory.service', {
  reserveStock: async (_tx, input) => { reservationCalls.push(input); return { reservation: { id: reservationCalls.length } }; },
});
injectMock('../audit/audit.service', {
  recordAuditLogExplicit: async (input) => { auditCalls.push(input); },
});
injectMock('../audit/audit.events', { AUDIT_ACTIONS: { RETAIL_ORDER_CREATED: 'RETAIL_ORDER_CREATED' } });
injectMock('./retail.service', {
  RETAIL_CURRENCY: 'IRR',
  normalizeCheckoutItems(items) {
    if (!Array.isArray(items) || !items.length) throw { statusCode: 400, code: 'INVALID_CHECKOUT_ITEMS' };
    return items.map((item) => ({ productId: Number(item.productId), quantity: Number(item.quantity) }));
  },
  selectPriceTier(prices, quantity) {
    return prices.filter((tier) => tier.minQuantity <= quantity && (tier.maxQuantity == null || tier.maxQuantity >= quantity)
      && new Date(tier.validFrom) <= new Date() && (!tier.validTo || new Date(tier.validTo) >= new Date()))
      .sort((a, b) => b.minQuantity - a.minQuantity)[0] || null;
  },
  availableQuantity(balance) { return balance ? balance.onHand - balance.reserved : 0; },
});

const service = require('./retail-order.service');

const policyEnv = {
  RETAIL_ORDER_PLACEMENT_ENABLED: 'true',
  RETAIL_PAYMENT_PROVIDER: 'sandbox',
  RETAIL_SHIPPING_FLAT_AMOUNT: '50000',
  RETAIL_TAX_RATE_BPS: '900',
  RETAIL_TAX_BASE: 'PRODUCT_SUBTOTAL',
  RETAIL_COMMISSION_RATE_BPS: '500',
};

function setPolicyEnv() {
  for (const [key, value] of Object.entries(policyEnv)) process.env[key] = value;
}

function product(id, companyId, price) {
  return {
    id,
    title: 'Product ' + id,
    sku: 'SKU-' + id,
    brand: 'Brand',
    model: 'Model',
    retailEnabled: true,
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
    deletedAt: null,
    companyId,
    company: { id: companyId, name: 'Seller ' + companyId, registrationNumber: 'REG-' + companyId },
    prices: [{ minQuantity: 1, maxQuantity: null, price: String(price), validFrom: new Date('2020-01-01T00:00:00.000Z'), validTo: null, unit: 'عدد' }],
    images: [{ url: '/product.webp', isPrimary: true, sortOrder: 0 }],
  };
}

test.beforeEach(() => {
  createdOrder = null;
  orderCreateData = null;
  sellerOrderCalls = [];
  itemCalls = [];
  commissionCalls = [];
  reservationCalls = [];
  auditCalls = [];
  paymentAttemptCalls = [];
  address = {
    id: 33, recipientName: 'Customer', recipientPhone: '09120000000',
    province: 'Tehran', city: 'Tehran', addressLine: 'Street 1', postalCode: '1111111111',
  };
  products = [product(1, 10, 100000), product(2, 20, 200000)];
  setPolicyEnv();
});

test('order policy fails closed when owner configuration is incomplete', () => {
  assert.throws(
    () => service.readOrderPolicy({ RETAIL_PAYMENT_PROVIDER: 'live' }),
    (error) => error.code === 'RETAIL_ORDERING_NOT_CONFIGURED'
      && error.details.missing.includes('RETAIL_ORDER_PLACEMENT_ENABLED')
      && error.details.missing.includes('RETAIL_SHIPPING_FLAT_AMOUNT')
  );
});

test('normalizes address and checkout lines and rejects invalid addresses', () => {
  assert.deepEqual(service.normalizePlaceOrderInput({
    addressId: '33',
    items: [{ productId: '1', quantity: '2' }],
  }), { addressId: 33, items: [{ productId: 1, quantity: 2 }] });
  assert.throws(() => service.normalizePlaceOrderInput({ addressId: 0, items: [{ productId: 1, quantity: 1 }] }), { code: 'INVALID_ADDRESS_ID' });
});

test('calculates configured tax with decimal-safe rounding', () => {
  const { Prisma } = require('@prisma/client');
  const subtotal = new Prisma.Decimal('1000.00');
  const shipping = new Prisma.Decimal('100.00');
  assert.equal(service.calculateTax(subtotal, shipping, 900, 'PRODUCT_SUBTOTAL').toFixed(2), '90.00');
  assert.equal(service.calculateTax(subtotal, shipping, 900, 'SUBTOTAL_PLUS_SHIPPING').toFixed(2), '99.00');
});

test('places a multi-seller order atomically and reserves the shared inventory', async () => {
  const order = await service.placeOrder(77, {
    addressId: 33,
    items: [{ productId: 1, quantity: 2 }, { productId: 2, quantity: 1 }],
  }, 'customer-checkout-key-001');

  assert.equal(order.id, 900);
  assert.equal(orderCreateData.buyerUserId, 77);
  assert.equal(orderCreateData.status, 'PENDING_PAYMENT');
  assert.equal(orderCreateData.paymentStatus, 'PENDING');
  assert.equal(orderCreateData.subtotal.toFixed(2), '400000.00');
  assert.equal(orderCreateData.shippingTotal.toFixed(2), '50000.00');
  assert.equal(orderCreateData.taxTotal.toFixed(2), '36000.00');
  assert.equal(orderCreateData.grandTotal.toFixed(2), '486000.00');
  assert.equal(sellerOrderCalls.length, 2);
  assert.equal(itemCalls.length, 2);
  assert.equal(commissionCalls.length, 2);
  assert.equal(paymentAttemptCalls.length, 1);
  assert.equal(paymentAttemptCalls[0].provider, 'sandbox');
  assert.equal(paymentAttemptCalls[0].status, 'CREATED');
  assert.ok(paymentAttemptCalls[0].redirectUrl.startsWith('/sandbox-payment/'));
  assert.equal(reservationCalls.length, 2);
  assert.ok(reservationCalls.every((reservation) => reservation.buyerUserId === 77 && reservation.orderId === 900));
  assert.equal(auditCalls.length, 1);
  assert.equal(auditCalls[0].action, 'RETAIL_ORDER_CREATED');
});

test('replays an existing order for the same buyer without reserving stock again', async () => {
  createdOrder = { id: 901, buyerUserId: 77, orderNumber: 'TM-EXISTING', sellerOrders: [] };
  const result = await service.placeOrder(77, {
    addressId: 33,
    items: [{ productId: 1, quantity: 1 }],
  }, 'customer-checkout-key-001');

  assert.equal(result.id, 901);
  assert.equal(reservationCalls.length, 0);
  assert.equal(orderCreateData, null);
});

test('does not disclose an idempotency key owned by another buyer', async () => {
  createdOrder = { id: 902, buyerUserId: 88, orderNumber: 'TM-OTHER', sellerOrders: [] };
  await assert.rejects(
    service.placeOrder(77, { addressId: 33, items: [{ productId: 1, quantity: 1 }] }, 'customer-checkout-key-001'),
    { code: 'IDEMPOTENCY_KEY_CONFLICT' }
  );
});
