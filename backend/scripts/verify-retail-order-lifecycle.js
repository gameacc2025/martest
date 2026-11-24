const crypto = require('node:crypto');
const prisma = require('../src/config/db');
const retailService = require('../src/modules/retail/retail.service');
const orderService = require('../src/modules/retail/retail-order.service');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  process.env.RETAIL_ORDER_PLACEMENT_ENABLED = 'true';
  process.env.RETAIL_PAYMENT_PROVIDER = 'sandbox';
  process.env.RETAIL_SHIPPING_FLAT_AMOUNT = '0';
  process.env.RETAIL_TAX_RATE_BPS = '0';
  process.env.RETAIL_TAX_BASE = 'PRODUCT_SUBTOTAL';
  process.env.RETAIL_COMMISSION_RATE_BPS = '0';

  const suffix = crypto.randomUUID().replace(/-/g, '');
  const buyer = await prisma.user.create({
    data: {
      email: 'retail-probe-' + suffix + '@example.invalid',
      phone: '+1999' + Date.now() + Math.floor(Math.random() * 1000),
      passwordHash: 'runtime-only-not-a-login-credential',
      status: 'ACTIVE',
    },
    select: { id: true },
  });
  const address = await prisma.address.create({
    data: {
      userId: buyer.id,
      label: 'Runtime probe',
      recipientName: 'Runtime Retail Buyer',
      recipientPhone: '+19990000000',
      province: 'Runtime',
      city: 'Runtime',
      addressLine: 'Disposable CI address',
      postalCode: '0000000000',
      isDefault: true,
    },
    select: { id: true },
  });

  const catalog = await retailService.listCatalog({ skip: 0, take: 50, filters: {} });
  const product = catalog.items.find((item) => item.inStock);
  assert(product, 'No in-stock retail fixture is available for the order lifecycle probe.');
  const beforeBalance = await prisma.inventoryBalance.findUnique({
    where: { productId: product.id },
    select: { onHand: true, reserved: true },
  });
  const idempotencyKey = 'runtime-retail-order-' + suffix;

  const order = await orderService.placeOrder(buyer.id, {
    addressId: address.id,
    items: [{ productId: product.id, quantity: 1 }],
  }, idempotencyKey);
  assert(order.status === 'PENDING_PAYMENT' && order.paymentStatus === 'PENDING',
    'Order placement did not create a pending-payment order.');
  assert(order.sellerOrders.length === 1, 'Single-seller cart did not create exactly one seller order.');
  assert(order.sellerOrders[0].items.length === 1, 'Order item snapshot was not persisted.');
  assert(order.paymentAttempts.length === 1 && order.paymentAttempts[0].provider === 'sandbox',
    'Order placement did not create a sandbox payment attempt.');

  const replay = await orderService.placeOrder(buyer.id, {
    addressId: address.id,
    items: [{ productId: product.id, quantity: 1 }],
  }, idempotencyKey);
  assert(replay.id === order.id, 'Idempotent replay created a second order.');
  assert(await prisma.retailOrder.count({ where: { idempotencyKey } }) === 1,
    'Idempotency key is not unique for the buyer order.');

  const activeReservation = await prisma.inventoryReservation.findFirst({
    where: { orderId: order.id, status: 'ACTIVE' },
    select: { id: true },
  });
  assert(activeReservation, 'Order placement did not reserve inventory.');
  const pendingBalance = await prisma.inventoryBalance.findUnique({
    where: { productId: product.id },
    select: { onHand: true, reserved: true },
  });
  assert(pendingBalance.reserved === beforeBalance.reserved + 1,
    'Order placement did not increase the shared reserved inventory balance.');

  const attempt = await prisma.paymentAttempt.findFirst({
    where: { orderId: order.id, provider: 'sandbox' },
    select: { id: true, authority: true, status: true },
  });
  const paidOrder = await orderService.confirmSandboxPayment(buyer.id, attempt.authority);
  assert(paidOrder.status === 'PAID' && paidOrder.paymentStatus === 'PAID',
    'Sandbox confirmation did not transition the order to PAID.');
  const consumedReservation = await prisma.inventoryReservation.findUnique({
    where: { id: activeReservation.id },
    select: { status: true },
  });
  assert(consumedReservation.status === 'CONSUMED', 'Successful sandbox payment did not consume its reservation.');
  const paidBalance = await prisma.inventoryBalance.findUnique({
    where: { productId: product.id },
    select: { onHand: true, reserved: true },
  });
  assert(paidBalance.onHand === beforeBalance.onHand - 1
    && paidBalance.reserved === beforeBalance.reserved,
  'Paid order did not atomically consume onHand and release reserved quantity.');
  assert(await prisma.paymentTransaction.count({ where: { orderId: order.id, status: 'SUCCEEDED' } }) === 1,
    'Sandbox payment confirmation did not persist exactly one successful transaction.');

  let ownerIsolationVerified = false;
  try {
    await orderService.getCustomerOrder(buyer.id + 1000000, order.id);
  } catch (error) {
    ownerIsolationVerified = error?.code === 'RETAIL_ORDER_NOT_FOUND';
  }
  assert(ownerIsolationVerified, 'A different buyer could retrieve this order by ID.');

  const expiringKey = 'runtime-retail-expiry-' + suffix;
  const expiringOrder = await orderService.placeOrder(buyer.id, {
    addressId: address.id,
    items: [{ productId: product.id, quantity: 1 }],
  }, expiringKey);
  const expiringAttempt = await prisma.paymentAttempt.findFirst({
    where: { orderId: expiringOrder.id, provider: 'sandbox' },
    select: { id: true },
  });
  await prisma.paymentAttempt.update({
    where: { id: expiringAttempt.id },
    data: { expiresAt: new Date(Date.now() - 1000) },
  });
  const expiredCount = await orderService.expirePendingSandboxPayments({ limit: 20 });
  assert(expiredCount >= 1, 'Expired sandbox payment was not picked up by the expiry worker.');
  const expiredOrder = await prisma.retailOrder.findUnique({
    where: { id: expiringOrder.id },
    select: { status: true, paymentStatus: true },
  });
  const expiredAttempt = await prisma.paymentAttempt.findUnique({
    where: { id: expiringAttempt.id },
    select: { status: true },
  });
  const releasedReservation = await prisma.inventoryReservation.findFirst({
    where: { orderId: expiringOrder.id },
    select: { status: true },
  });
  assert(expiredOrder.status === 'PAYMENT_EXPIRED' && expiredOrder.paymentStatus === 'FAILED',
    'Expired sandbox payment did not expire the order.');
  assert(expiredAttempt.status === 'EXPIRED', 'Expired sandbox payment attempt was not marked EXPIRED.');
  assert(releasedReservation?.status === 'RELEASED', 'Expired sandbox payment did not release its stock reservation.');

  console.log('PASS: PostgreSQL B2C order placement, multi-entity snapshots, idempotent replay, buyer IDOR isolation, sandbox confirmation, stock consumption and payment-expiry release.');
}

main()
  .catch((error) => {
    console.error('Retail order lifecycle validation failed:', {
      code: error?.code || null,
      message: error?.message || 'Unknown error',
    });
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
