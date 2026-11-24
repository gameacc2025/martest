const prisma = require('../../config/db');

const ADMIN_RETAIL_ORDER_LIST_SELECT = {
  id: true,
  orderNumber: true,
  status: true,
  paymentStatus: true,
  currency: true,
  subtotal: true,
  shippingTotal: true,
  taxTotal: true,
  grandTotal: true,
  placedAt: true,
  createdAt: true,
  recipientName: true,
  recipientPhone: true,
  city: true,
  province: true,
  sellerOrders: {
    select: {
      id: true,
      companyId: true,
      sellerOrderNumber: true,
      companyNameSnapshot: true,
      status: true,
      sellerNetTotal: true,
    },
    orderBy: { id: 'asc' },
  },
  paymentAttempts: {
    select: { id: true, provider: true, status: true, amount: true, currency: true, expiresAt: true, completedAt: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  },
};

const ADMIN_RETAIL_ORDER_DETAIL_SELECT = {
  ...ADMIN_RETAIL_ORDER_LIST_SELECT,
  recipientName: true,
  recipientPhone: true,
  province: true,
  city: true,
  addressLine: true,
  postalCode: true,
  buyerUserId: true,
  sellerOrders: {
    select: {
      id: true,
      companyId: true,
      sellerOrderNumber: true,
      companyNameSnapshot: true,
      status: true,
      currency: true,
      subtotal: true,
      shippingTotal: true,
      taxTotal: true,
      sellerNetTotal: true,
      acceptedAt: true,
      shippedAt: true,
      deliveredAt: true,
      items: {
        select: {
          id: true,
          productId: true,
          productTitleSnapshot: true,
          skuSnapshot: true,
          quantity: true,
          unitPrice: true,
          lineTotal: true,
          currency: true,
        },
        orderBy: { id: 'asc' },
      },
      shipments: {
        select: {
          id: true,
          carrier: true,
          trackingNumber: true,
          status: true,
          shippedAt: true,
          deliveredAt: true,
          trackingEvents: {
            select: { id: true, eventCode: true, description: true, location: true, occurredAt: true },
            orderBy: { occurredAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { id: 'asc' },
  },
  paymentAttempts: {
    select: { id: true, provider: true, status: true, amount: true, currency: true, expiresAt: true, completedAt: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  },
  paymentTransactions: {
    select: { id: true, provider: true, providerTransactionId: true, transactionType: true, status: true, amount: true, currency: true, verifiedAt: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  },
  inventoryReservations: {
    select: { id: true, productId: true, buyerUserId: true, quantity: true, status: true, expiresAt: true, consumedAt: true, releasedAt: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  },
};

function buildWhere({ status, paymentStatus, search } = {}) {
  const where = {};
  if (status) where.status = status;
  if (paymentStatus) where.paymentStatus = paymentStatus;
  if (search) {
    const term = String(search).trim();
    if (term) {
      where.OR = [
        { orderNumber: { contains: term, mode: 'insensitive' } },
        { recipientName: { contains: term, mode: 'insensitive' } },
        { recipientPhone: { contains: term } },
      ];
    }
  }
  return where;
}

async function listAdminRetailOrders({ skip = 0, take = 20, status, paymentStatus, search } = {}) {
  const where = buildWhere({ status, paymentStatus, search });
  const [items, total] = await Promise.all([
    prisma.retailOrder.findMany({
      where,
      skip,
      take,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: ADMIN_RETAIL_ORDER_LIST_SELECT,
    }),
    prisma.retailOrder.count({ where }),
  ]);
  return { items, total };
}

async function getAdminRetailOrder(orderId) {
  const id = Number(orderId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw { statusCode: 400, code: 'INVALID_RETAIL_ORDER_ID', message: 'A valid retail order ID is required.' };
  }
  const order = await prisma.retailOrder.findUnique({
    where: { id },
    select: ADMIN_RETAIL_ORDER_DETAIL_SELECT,
  });
  if (!order) throw { statusCode: 404, code: 'RETAIL_ORDER_NOT_FOUND', message: 'Retail order not found.' };
  return order;
}

module.exports = {
  ADMIN_RETAIL_ORDER_LIST_SELECT,
  ADMIN_RETAIL_ORDER_DETAIL_SELECT,
  buildWhere,
  listAdminRetailOrders,
  getAdminRetailOrder,
};
