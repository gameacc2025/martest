const prisma = require('../src/config/db');
const retailService = require('../src/modules/retail/retail.service');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const buyer = await prisma.user.findFirst({
    where: { status: 'ACTIVE' },
    select: { id: true },
  });
  if (!buyer) throw new Error('No active user exists for the checkout preview probe.');

  const catalog = await retailService.listCatalog({
    skip: 0,
    take: 24,
    filters: {},
  });
  assert(catalog.total > 0 && catalog.items.length > 0,
    'The public retail catalog returned no eligible seeded products.');

  const product = catalog.items.find((item) => item.inStock);
  assert(product, 'No in-stock retail product exists in the demo catalog.');
  assert(product.retailEnabled === true, 'Catalog returned a product without retail enablement.');
  assert(Number(product.retailPrice) > 0, 'Catalog returned a non-positive retail price.');
  assert(product.currency === 'IRR', 'Catalog returned an unexpected platform currency.');
  assert(product.inStock === true, 'Catalog in-stock state is inconsistent.');
  assert(!Object.prototype.hasOwnProperty.call(product, 'availableQuantity'),
    'Public catalog must not expose exact supplier stock quantities.');

  const balance = await prisma.inventoryBalance.findUnique({
    where: { productId: product.id },
    select: { onHand: true, reserved: true },
  });
  const available = Math.max(0, balance.onHand - balance.reserved);
  assert(available > 0, 'Selected product has no available inventory.');

  const before = {
    orders: await prisma.retailOrder.count(),
    reservations: await prisma.inventoryReservation.count(),
    payments: await prisma.paymentAttempt.count(),
    movements: await prisma.inventoryMovement.count({ where: { productId: product.id } }),
  };

  const preview = await retailService.previewCheckout(buyer.id, [
    { productId: product.id, quantity: 1 },
  ]);
  assert(preview.items.length === 1, 'Checkout preview did not return the requested product.');
  assert(preview.items[0].unitPrice === product.retailPrice,
    'Catalog and checkout preview disagree on the current unit price.');
  assert(preview.items[0].availableQuantity === available,
    'Checkout preview did not calculate available stock from the database.');
  assert(preview.subtotal === product.retailPrice,
    'Checkout preview subtotal does not reconcile with its item line.');
  assert(preview.fees.shipping === null && preview.fees.tax === null && preview.fees.total === null,
    'Checkout preview must not invent shipping, tax or grand-total values.');
  assert(preview.orderPlacementEnabled === false
    && preview.blockers.includes('RETAIL_ORDER_PLACEMENT_DISABLED'),
  'Checkout preview must clearly indicate that order placement remains disabled without explicit owner configuration.');

  const after = {
    orders: await prisma.retailOrder.count(),
    reservations: await prisma.inventoryReservation.count(),
    payments: await prisma.paymentAttempt.count(),
    movements: await prisma.inventoryMovement.count({ where: { productId: product.id } }),
  };
  assert(JSON.stringify(before) === JSON.stringify(after),
    'Checkout preview mutated orders, reservations, payments or inventory movement history.');

  console.log(`PASS: public retail catalog exposed ${catalog.items.length} eligible products without exact stock; checkout preview reconciled price/stock and made no order/payment/reservation mutations.`);
}

main()
  .catch((error) => {
    console.error('Retail catalog/checkout preview validation failed:', {
      code: error?.code || null,
      message: error?.message || 'Unknown error',
    });
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
