const prisma = require('../../config/db');
const { Prisma } = require('@prisma/client');
const { recordAuditLogExplicit } = require('../audit/audit.service');
const { AUDIT_ACTIONS } = require('../audit/audit.events');

const SELLER_ORDER_SELECT = {
  id: true,
  orderId: true,
  companyId: true,
  sellerOrderNumber: true,
  status: true,
  currency: true,
  subtotal: true,
  discountTotal: true,
  shippingTotal: true,
  taxTotal: true,
  sellerNetTotal: true,
  acceptedAt: true,
  shippedAt: true,
  deliveredAt: true,
  createdAt: true,
  updatedAt: true,
  order: {
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      placedAt: true,
      recipientName: true,
      recipientPhone: true,
      province: true,
      city: true,
      addressLine: true,
      postalCode: true,
    },
  },
  items: {
    select: {
      id: true,
      productId: true,
      productTitleSnapshot: true,
      skuSnapshot: true,
      imageUrlSnapshot: true,
      quantity: true,
      unitPrice: true,
      taxAmount: true,
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
};

function assertCompanyContext(companyId) {
  const value = Number(companyId);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw { statusCode: 403, code: 'COMPANY_CONTEXT_REQUIRED', message: 'A valid company access context is required.' };
  }
  return value;
}

function normalizeTransition(input = {}) {
  const action = String(input.action || '').trim().toUpperCase();
  const allowed = ['ACCEPT', 'START_PROCESSING', 'READY_TO_SHIP', 'SHIP', 'DELIVER'];
  if (!allowed.includes(action)) {
    throw { statusCode: 400, code: 'INVALID_SELLER_ORDER_ACTION', message: 'Unsupported seller order action.' };
  }
  const carrier = typeof input.carrier === 'string' ? input.carrier.trim() : '';
  const trackingNumber = typeof input.trackingNumber === 'string' ? input.trackingNumber.trim() : '';
  const location = typeof input.location === 'string' ? input.location.trim() : '';
  const description = typeof input.description === 'string' ? input.description.trim() : '';
  if (action === 'SHIP' && (!carrier || !trackingNumber)) {
    throw { statusCode: 400, code: 'SHIPMENT_DETAILS_REQUIRED', message: 'Carrier and trackingNumber are required before marking an order as shipped.' };
  }
  return { action, carrier, trackingNumber, location, description };
}

async function runSerializable(callback, retries = 3) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.$transaction(callback, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 15000,
      });
    } catch (error) {
      const retryable = ['P2034', '40001', '40P01'].includes(error?.code)
        || ['40001', '40P01'].includes(error?.meta?.code);
      if (!retryable || attempt >= retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, 20 * (attempt + 1)));
    }
  }
}

async function listCompanySellerOrders(companyId, { skip = 0, take = 20, status } = {}) {
  const scopedCompanyId = assertCompanyContext(companyId);
  const where = {
    companyId: scopedCompanyId,
    order: { paymentStatus: 'PAID' },
  };
  if (status) where.status = status;
  const [items, total] = await Promise.all([
    prisma.sellerOrder.findMany({
      where,
      skip,
      take,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: SELLER_ORDER_SELECT,
    }),
    prisma.sellerOrder.count({ where }),
  ]);
  return { items, total };
}

async function getCompanySellerOrder(companyId, sellerOrderId) {
  const scopedCompanyId = assertCompanyContext(companyId);
  const id = Number(sellerOrderId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw { statusCode: 400, code: 'INVALID_SELLER_ORDER_ID', message: 'A valid seller order ID is required.' };
  }
  const order = await prisma.sellerOrder.findFirst({
    where: { id, companyId: scopedCompanyId, order: { paymentStatus: 'PAID' } },
    select: SELLER_ORDER_SELECT,
  });
  if (!order) throw { statusCode: 404, code: 'SELLER_ORDER_NOT_FOUND', message: 'Seller order not found.' };
  return order;
}

async function transitionCompanySellerOrder(companyId, actorUserId, sellerOrderId, input) {
  const scopedCompanyId = assertCompanyContext(companyId);
  const id = Number(sellerOrderId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw { statusCode: 400, code: 'INVALID_SELLER_ORDER_ID', message: 'A valid seller order ID is required.' };
  }
  const transition = normalizeTransition(input);

  return runSerializable(async (tx) => {
    const sellerOrder = await tx.sellerOrder.findFirst({
      where: { id, companyId: scopedCompanyId },
      select: {
        id: true,
        orderId: true,
        companyId: true,
        status: true,
        order: { select: { paymentStatus: true, status: true, orderNumber: true } },
        shipments: { select: { id: true, status: true } },
      },
    });
    if (!sellerOrder) throw { statusCode: 404, code: 'SELLER_ORDER_NOT_FOUND', message: 'Seller order not found.' };
    if (sellerOrder.order.paymentStatus !== 'PAID') {
      throw { statusCode: 409, code: 'ORDER_NOT_PAID', message: 'Seller fulfillment is available only after verified payment.' };
    }

    const transitions = {
      ACCEPT: { from: 'PENDING_ACCEPTANCE', to: 'ACCEPTED' },
      START_PROCESSING: { from: 'ACCEPTED', to: 'PROCESSING' },
      READY_TO_SHIP: { from: 'PROCESSING', to: 'READY_TO_SHIP' },
      SHIP: { from: 'READY_TO_SHIP', to: 'SHIPPED' },
      DELIVER: { from: 'SHIPPED', to: 'DELIVERED' },
    };
    const rule = transitions[transition.action];
    if (sellerOrder.status !== rule.from) {
      throw {
        statusCode: 409,
        code: 'INVALID_SELLER_ORDER_TRANSITION',
        message: 'Seller order cannot perform this action from its current status.',
        details: { currentStatus: sellerOrder.status, action: transition.action, requiredStatus: rule.from },
      };
    }

    const now = new Date();
    const updateData = { status: rule.to };
    if (transition.action === 'ACCEPT') updateData.acceptedAt = now;
    if (transition.action === 'SHIP') updateData.shippedAt = now;
    if (transition.action === 'DELIVER') updateData.deliveredAt = now;

    let shipmentId = null;
    if (transition.action === 'SHIP') {
      const activeShipment = sellerOrder.shipments.find((shipment) => !['DELIVERED', 'FAILED', 'RETURNED'].includes(shipment.status));
      if (activeShipment) {
        throw { statusCode: 409, code: 'ACTIVE_SHIPMENT_EXISTS', message: 'An active shipment already exists for this seller order.' };
      }
      const shipment = await tx.shipment.create({
        data: {
          sellerOrderId: sellerOrder.id,
          carrier: transition.carrier,
          trackingNumber: transition.trackingNumber,
          status: 'IN_TRANSIT',
          shippedAt: now,
          trackingEvents: {
            create: {
              eventCode: 'SHIPPED',
              description: transition.description || 'مرسوله توسط فروشنده ارسال شد.',
              location: transition.location || null,
              occurredAt: now,
            },
          },
        },
        select: { id: true },
      });
      shipmentId = shipment.id;
    }

    if (transition.action === 'DELIVER') {
      const activeShipments = sellerOrder.shipments.filter((shipment) => shipment.status === 'IN_TRANSIT' || shipment.status === 'READY_FOR_PICKUP');
      if (!activeShipments.length) {
        throw { statusCode: 409, code: 'ACTIVE_SHIPMENT_REQUIRED', message: 'A shipment in transit is required before delivery confirmation.' };
      }
      for (const shipment of activeShipments) {
        await tx.shipment.update({
          where: { id: shipment.id },
          data: {
            status: 'DELIVERED',
            deliveredAt: now,
            trackingEvents: {
              create: {
                eventCode: 'DELIVERED',
                description: transition.description || 'مرسوله به گیرنده تحویل شد.',
                location: transition.location || null,
                occurredAt: now,
              },
            },
          },
        });
      }
    }

    await tx.sellerOrder.update({ where: { id: sellerOrder.id }, data: updateData });

    const allSellerOrders = await tx.sellerOrder.findMany({
      where: { orderId: sellerOrder.orderId },
      select: { status: true },
    });
    const statuses = allSellerOrders.map((item) => item.status);
    let aggregateStatus = 'PAID';
    const shippedOrDelivered = statuses.filter((status) => ['SHIPPED', 'DELIVERED'].includes(status)).length;
    if (statuses.length && statuses.every((status) => status === 'DELIVERED')) aggregateStatus = 'COMPLETED';
    else if (statuses.length && statuses.every((status) => ['SHIPPED', 'DELIVERED'].includes(status))) aggregateStatus = 'FULFILLED';
    else if (shippedOrDelivered > 0) aggregateStatus = 'PARTIALLY_FULFILLED';
    else if (statuses.some((status) => ['ACCEPTED', 'PROCESSING', 'READY_TO_SHIP'].includes(status))) aggregateStatus = 'PROCESSING';
    if (aggregateStatus !== 'PAID') {
      await tx.retailOrder.update({ where: { id: sellerOrder.orderId }, data: { status: aggregateStatus } });
    }

    await recordAuditLogExplicit({
      tx,
      actorUserId: Number(actorUserId),
      actorAccessType: 'COMPANY',
      companyId: scopedCompanyId,
      action: AUDIT_ACTIONS.RETAIL_SELLER_ORDER_STATUS_CHANGED,
      entityType: 'SellerOrder',
      entityId: sellerOrder.id,
      before: { status: sellerOrder.status },
      after: { status: rule.to, shipmentId },
      metadata: { orderId: sellerOrder.orderId, action: transition.action },
    });

    return tx.sellerOrder.findFirst({
      where: { id: sellerOrder.id, companyId: scopedCompanyId },
      select: SELLER_ORDER_SELECT,
    });
  });
}

module.exports = {
  SELLER_ORDER_SELECT,
  normalizeTransition,
  listCompanySellerOrders,
  getCompanySellerOrder,
  transitionCompanySellerOrder,
};
