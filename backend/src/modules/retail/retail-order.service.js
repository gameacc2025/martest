const crypto = require('node:crypto');
const prisma = require('../../config/db');
const { Prisma } = require('@prisma/client');
const inventoryService = require('../inventory/inventory.service');
const { recordAuditLogExplicit } = require('../audit/audit.service');
const { AUDIT_ACTIONS } = require('../audit/audit.events');
const retailService = require('./retail.service');

const ORDER_RESERVATION_TTL_MINUTES = 15;
const ORDER_SELECT = {
  id: true,
  orderNumber: true,
  buyerUserId: true,
  status: true,
  paymentStatus: true,
  currency: true,
  subtotal: true,
  discountTotal: true,
  shippingTotal: true,
  taxTotal: true,
  grandTotal: true,
  recipientName: true,
  recipientPhone: true,
  province: true,
  city: true,
  addressLine: true,
  postalCode: true,
  placedAt: true,
  paidAt: true,
  completedAt: true,
  cancelledAt: true,
  paymentAttempts: {
    select: { id: true, provider: true, status: true, redirectUrl: true, expiresAt: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  },
  sellerOrders: {
    select: {
      id: true,
      sellerOrderNumber: true,
      companyId: true,
      companyNameSnapshot: true,
      status: true,
      currency: true,
      subtotal: true,
      shippingTotal: true,
      taxTotal: true,
      sellerNetTotal: true,
      items: {
        select: {
          id: true,
          productId: true,
          productTitleSnapshot: true,
          skuSnapshot: true,
          brandSnapshot: true,
          modelSnapshot: true,
          imageUrlSnapshot: true,
          quantity: true,
          unitPrice: true,
          lineTotal: true,
          currency: true,
        },
      },
    },
  },
};

function configurationError(missing) {
  return {
    statusCode: 503,
    code: 'RETAIL_ORDERING_NOT_CONFIGURED',
    message: 'Retail order placement is not enabled until all owner-approved commercial and sandbox settings are configured.',
    details: { missing },
  };
}

function readOrderPolicy(env = process.env) {
  const missing = [];
  if (env.RETAIL_ORDER_PLACEMENT_ENABLED !== 'true') missing.push('RETAIL_ORDER_PLACEMENT_ENABLED');
  if (env.RETAIL_PAYMENT_PROVIDER !== 'sandbox') missing.push('RETAIL_PAYMENT_PROVIDER=sandbox');

  const parseNonNegativeDecimal = (key) => {
    const raw = env[key];
    if (raw === undefined || raw === '') {
      missing.push(key);
      return null;
    }
    try {
      const value = new Prisma.Decimal(raw);
      if (!value.isFinite() || value.isNegative()) throw new Error('invalid');
      return value;
    } catch {
      missing.push(key + ':valid_non_negative_decimal');
      return null;
    }
  };
  const parseRate = (key) => {
    const raw = env[key];
    if (raw === undefined || raw === '') {
      missing.push(key);
      return null;
    }
    const value = Number(raw);
    if (!Number.isSafeInteger(value) || value < 0 || value > 10000) {
      missing.push(key + ':integer_0_to_10000');
      return null;
    }
    return value;
  };

  const shippingFlatAmount = parseNonNegativeDecimal('RETAIL_SHIPPING_FLAT_AMOUNT');
  const taxRateBps = parseRate('RETAIL_TAX_RATE_BPS');
  const commissionRateBps = parseRate('RETAIL_COMMISSION_RATE_BPS');
  if (!['PRODUCT_SUBTOTAL', 'SUBTOTAL_PLUS_SHIPPING'].includes(env.RETAIL_TAX_BASE)) {
    missing.push('RETAIL_TAX_BASE=PRODUCT_SUBTOTAL|SUBTOTAL_PLUS_SHIPPING');
  }
  if (missing.length) throw configurationError([...new Set(missing)]);

  return {
    shippingFlatAmount,
    taxRateBps,
    commissionRateBps,
    taxBase: env.RETAIL_TAX_BASE,
    reservationTtlMinutes: Math.min(60, Math.max(5, Number(env.RETAIL_ORDER_RESERVATION_TTL_MINUTES) || ORDER_RESERVATION_TTL_MINUTES)),
  };
}

function normalizePlaceOrderInput(input = {}) {
  const addressId = Number(input.addressId);
  if (!Number.isSafeInteger(addressId) || addressId <= 0) {
    throw { statusCode: 400, code: 'INVALID_ADDRESS_ID', message: 'A valid customer addressId is required.' };
  }
  const items = retailService.normalizeCheckoutItems(input.items);
  return { addressId, items };
}

function makeOrderNumber(prefix = 'TM') {
  return prefix + '-' + Date.now().toString(36).toUpperCase() + '-' + crypto.randomBytes(5).toString('hex').toUpperCase();
}

function decimal(value) {
  return new Prisma.Decimal(value);
}

function calculateTax(subtotal, shipping, rateBps, taxBase) {
  const base = taxBase === 'SUBTOTAL_PLUS_SHIPPING' ? subtotal.plus(shipping) : subtotal;
  return base.mul(rateBps).div(10000).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}

function allocateTax(lines, taxTotal, subtotal) {
  if (!lines.length) return lines;
  let allocated = decimal(0);
  const allocations = lines.map((line) => {
    const exact = taxTotal.mul(line.baseLineTotal).div(subtotal);
    const roundedDown = exact.toDecimalPlaces(2, Prisma.Decimal.ROUND_DOWN);
    allocated = allocated.plus(roundedDown);
    return { line, amount: roundedDown, remainder: exact.minus(roundedDown) };
  });
  let remainingCents = taxTotal.minus(allocated).mul(100).toNumber();
  allocations.sort((a, b) => b.remainder.comparedTo(a.remainder));
  for (let index = 0; remainingCents > 0; index++, remainingCents--) {
    allocations[index % allocations.length].amount = allocations[index % allocations.length].amount.plus('0.01');
  }
  for (const allocation of allocations) {
    const line = allocation.line;
    line.taxAmount = allocation.amount;
    line.lineTotal = line.baseLineTotal.plus(allocation.amount);
    line.seller.taxTotal = line.seller.taxTotal.plus(allocation.amount);
  }
  return lines;
}

async function runSerializableTransaction(callback, maxRetries = 3) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.$transaction(callback, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 20000,
      });
    } catch (error) {
      const retryable = ['P2034', '40001', '40P01'].includes(error?.code)
        || ['40001', '40P01'].includes(error?.meta?.code);
      if (!retryable || attempt >= maxRetries) throw error;
      await new Promise((resolve) => setTimeout(resolve, 25 * (attempt + 1)));
    }
  }
}

async function placeOrder(buyerUserId, input, idempotencyKey) {
  const buyerId = Number(buyerUserId);
  if (!Number.isSafeInteger(buyerId) || buyerId <= 0) {
    throw { statusCode: 401, code: 'CUSTOMER_REQUIRED', message: 'A customer identity is required.' };
  }
  if (typeof idempotencyKey !== 'string' || idempotencyKey.trim().length < 8 || idempotencyKey.trim().length > 160) {
    throw { statusCode: 400, code: 'IDEMPOTENCY_KEY_REQUIRED', message: 'A valid Idempotency-Key header (8–160 characters) is required.' };
  }
  const key = idempotencyKey.trim();
  const normalized = normalizePlaceOrderInput(input);
  const policy = readOrderPolicy();

  try {
    return await runSerializableTransaction(async (tx) => {
      const existing = await tx.retailOrder.findUnique({
        where: { idempotencyKey: key },
        select: { ...ORDER_SELECT, buyerUserId: true },
      });
      if (existing) {
        if (existing.buyerUserId !== buyerId) {
          throw { statusCode: 409, code: 'IDEMPOTENCY_KEY_CONFLICT', message: 'This idempotency key belongs to another customer.' };
        }
        return existing;
      }

      const address = await tx.address.findFirst({
        where: { id: normalized.addressId, userId: buyerId },
        select: {
          id: true, recipientName: true, recipientPhone: true, province: true,
          city: true, addressLine: true, postalCode: true,
        },
      });
      if (!address) throw { statusCode: 404, code: 'CUSTOMER_ADDRESS_NOT_FOUND', message: 'The selected delivery address was not found.' };

      const productIds = normalized.items.map((item) => item.productId);
      const products = await tx.product.findMany({
        where: {
          id: { in: productIds },
          retailEnabled: true,
          deletedAt: null,
          status: 'PUBLISHED',
          visibility: 'PUBLIC',
          company: { status: 'ACTIVE', deletedAt: null },
        },
        include: {
          company: { select: { id: true, name: true, registrationNumber: true } },
          prices: true,
          images: { select: { url: true, isPrimary: true }, orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }] },
        },
      });
      const productById = new Map(products.map((product) => [product.id, product]));
      if (productById.size !== productIds.length) {
        throw { statusCode: 409, code: 'RETAIL_PRODUCT_UNAVAILABLE', message: 'One or more products are no longer eligible for retail purchase.' };
      }

      const balances = await tx.inventoryBalance.findMany({
        where: { productId: { in: productIds } },
        select: { productId: true, onHand: true, reserved: true },
      });
      const balanceByProduct = new Map(balances.map((balance) => [balance.productId, balance]));

      const lines = [];
      let subtotal = decimal(0);
      const sellers = new Map();
      for (const requested of normalized.items) {
        const product = productById.get(requested.productId);
        const tier = retailService.selectPriceTier(product.prices, requested.quantity);
        if (!tier) {
          throw { statusCode: 409, code: 'RETAIL_PRICE_UNAVAILABLE', message: 'The active price no longer covers the requested quantity.', details: { productId: product.id, quantity: requested.quantity } };
        }
        const balance = balanceByProduct.get(product.id);
        const available = retailService.availableQuantity(balance);
        if (available < requested.quantity) {
          throw { statusCode: 409, code: 'INSUFFICIENT_STOCK', message: 'The available stock changed before order placement.', details: { productId: product.id, requestedQuantity: requested.quantity, availableQuantity: available } };
        }
        const unitPrice = decimal(tier.price);
        const lineTotal = unitPrice.mul(requested.quantity).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
        const line = { product, quantity: requested.quantity, unitPrice, baseLineTotal: lineTotal, lineTotal, taxAmount: decimal(0), companyId: product.companyId };
        lines.push(line);
        subtotal = subtotal.plus(lineTotal);
        if (!sellers.has(product.companyId)) sellers.set(product.companyId, { company: product.company, lines: [], subtotal: decimal(0), taxTotal: decimal(0) });
        const seller = sellers.get(product.companyId);
        seller.lines.push(line);
        seller.subtotal = seller.subtotal.plus(lineTotal);
      }

      const shippingTotal = policy.shippingFlatAmount;
      const taxTotal = calculateTax(subtotal, shippingTotal, policy.taxRateBps, policy.taxBase);
      const grandTotal = subtotal.plus(shippingTotal).plus(taxTotal);
      for (const line of lines) line.seller = sellers.get(line.companyId);
      allocateTax(lines, taxTotal, subtotal);
      const now = new Date();
      const order = await tx.retailOrder.create({
        data: {
          orderNumber: makeOrderNumber(),
          buyerUserId: buyerId,
          status: 'PENDING_PAYMENT',
          paymentStatus: 'PENDING',
          currency: retailService.RETAIL_CURRENCY,
          subtotal,
          discountTotal: decimal(0),
          shippingTotal,
          taxTotal,
          grandTotal,
          addressId: address.id,
          recipientName: address.recipientName,
          recipientPhone: address.recipientPhone,
          province: address.province,
          city: address.city,
          addressLine: address.addressLine,
          postalCode: address.postalCode,
          idempotencyKey: key,
          placedAt: now,
        },
        select: { id: true, orderNumber: true, buyerUserId: true },
      });

      const expiresAt = new Date(now.getTime() + policy.reservationTtlMinutes * 60 * 1000);
      for (const [companyId, seller] of sellers.entries()) {
        const commissionAmount = seller.subtotal.mul(policy.commissionRateBps).div(10000).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
        const sellerOrder = await tx.sellerOrder.create({
          data: {
            orderId: order.id,
            companyId,
            sellerOrderNumber: makeOrderNumber('TM-S'),
            status: 'PENDING_ACCEPTANCE',
            currency: retailService.RETAIL_CURRENCY,
            subtotal: seller.subtotal,
            discountTotal: decimal(0),
            shippingTotal: decimal(0),
            taxTotal: decimal(0),
            sellerNetTotal: seller.subtotal.minus(commissionAmount),
            companyNameSnapshot: seller.company?.name || 'فروشنده',
            companyIdSnapshot: seller.company?.registrationNumber || null,
          },
          select: { id: true, companyId: true },
        });
        await tx.commissionSnapshot.create({
          data: {
            sellerOrderId: sellerOrder.id,
            ruleId: null,
            calculation: 'PERCENTAGE',
            rate: decimal(policy.commissionRateBps).div(100),
            baseAmount: seller.subtotal,
            commissionAmount,
            currency: retailService.RETAIL_CURRENCY,
          },
        });

        const sellerLines = seller.lines;
        for (const line of sellerLines) {
          const product = line.product;
          const image = (product.images || []).find((entry) => entry.isPrimary) || product.images?.[0];
          await tx.retailOrderItem.create({
            data: {
              orderId: order.id,
              sellerOrderId: sellerOrder.id,
              productId: product.id,
              productTitleSnapshot: product.title,
              skuSnapshot: product.sku || null,
              brandSnapshot: product.brand || null,
              modelSnapshot: product.model || null,
              imageUrlSnapshot: image?.url || null,
              companyNameSnapshot: seller.company?.name || 'فروشنده',
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              discountAmount: decimal(0),
              taxAmount: decimal(0),
              lineTotal: line.lineTotal,
              currency: retailService.RETAIL_CURRENCY,
            },
          });
          await inventoryService.reserveStock(tx, {
            productId: product.id,
            quantity: line.quantity,
            buyerUserId: buyerId,
            orderId: order.id,
            checkoutKey: 'retail-order:' + order.id + ':' + product.id,
            expiresAt,
            reason: 'Retail order stock reservation ' + order.orderNumber,
          });
        }
      }

      const paymentAuthority = crypto.randomBytes(24).toString('base64url');
      await tx.paymentAttempt.create({
        data: {
          orderId: order.id,
          provider: 'sandbox',
          status: 'CREATED',
          amount: grandTotal,
          currency: retailService.RETAIL_CURRENCY,
          idempotencyKey: 'retail-order:' + order.id + ':sandbox-payment',
          authority: paymentAuthority,
          redirectUrl: '/sandbox-payment/' + paymentAuthority,
          expiresAt,
        },
      });

      await recordAuditLogExplicit({
        tx,
        actorUserId: buyerId,
        actorAccessType: 'CUSTOMER',
        companyId: null,
        action: AUDIT_ACTIONS.RETAIL_ORDER_CREATED,
        entityType: 'RetailOrder',
        entityId: order.id,
        after: { id: order.id, orderNumber: order.orderNumber, status: 'PENDING_PAYMENT', paymentStatus: 'UNPAID', currency: retailService.RETAIL_CURRENCY, grandTotal: grandTotal.toFixed(2) },
        metadata: { sellerCount: sellers.size, itemCount: lines.length, idempotencyKey: key },
      });

      return tx.retailOrder.findUnique({ where: { id: order.id }, select: ORDER_SELECT });
    });
  } catch (error) {
    if (error?.code === 'P2002') {
      const existing = await prisma.retailOrder.findUnique({ where: { idempotencyKey: key }, select: ORDER_SELECT });
      if (existing && existing.buyerUserId === buyerId) return existing;
    }
    throw error;
  }
}

async function getSandboxPayment(buyerUserId, authority) {
  if (process.env.RETAIL_PAYMENT_PROVIDER !== 'sandbox') {
    throw { statusCode: 404, code: 'SANDBOX_PAYMENT_NOT_AVAILABLE', message: 'Sandbox payment is not available.' };
  }
  const attempt = await prisma.paymentAttempt.findFirst({
    where: { authority: String(authority), provider: 'sandbox', order: { buyerUserId: Number(buyerUserId) } },
    select: {
      id: true, provider: true, status: true, amount: true, currency: true,
      expiresAt: true, redirectUrl: true, order: { select: { id: true, orderNumber: true, status: true, paymentStatus: true } },
    },
  });
  if (!attempt) throw { statusCode: 404, code: 'SANDBOX_PAYMENT_NOT_FOUND', message: 'Sandbox payment was not found.' };
  return attempt;
}

async function confirmSandboxPayment(buyerUserId, authority) {
  if (process.env.RETAIL_PAYMENT_PROVIDER !== 'sandbox') {
    throw { statusCode: 404, code: 'SANDBOX_PAYMENT_NOT_AVAILABLE', message: 'Sandbox payment is not available.' };
  }
  const buyerId = Number(buyerUserId);
  const result = await runSerializableTransaction(async (tx) => {
    const attempt = await tx.paymentAttempt.findFirst({
      where: { authority: String(authority), provider: 'sandbox' },
      include: { order: { select: { id: true, buyerUserId: true, orderNumber: true, status: true, paymentStatus: true, currency: true, grandTotal: true } } },
    });
    if (!attempt || attempt.order.buyerUserId !== buyerId) {
      throw { statusCode: 404, code: 'SANDBOX_PAYMENT_NOT_FOUND', message: 'Sandbox payment was not found.' };
    }
    if (attempt.status === 'SUCCEEDED' && attempt.order.paymentStatus === 'PAID') {
      return { expired: false, order: await tx.retailOrder.findUnique({ where: { id: attempt.orderId }, select: ORDER_SELECT }) };
    }
    if (!['CREATED', 'REDIRECTED', 'PENDING'].includes(attempt.status)
      || attempt.order.status !== 'PENDING_PAYMENT') {
      throw { statusCode: 409, code: 'SANDBOX_PAYMENT_NOT_PENDING', message: 'This payment attempt is no longer pending.' };
    }

    const now = new Date();
    if (attempt.expiresAt && attempt.expiresAt <= now) {
      await tx.paymentAttempt.update({ where: { id: attempt.id }, data: { status: 'EXPIRED' } });
      await tx.retailOrder.update({
        where: { id: attempt.orderId },
        data: { status: 'PAYMENT_EXPIRED', paymentStatus: 'FAILED' },
      });
      const reservations = await tx.inventoryReservation.findMany({
        where: { orderId: attempt.orderId, status: 'ACTIVE' },
        select: { id: true },
      });
      for (const reservation of reservations) {
        await inventoryService.releaseReservation(tx, {
          reservationId: reservation.id,
          actorUserId: buyerId,
          reason: 'Sandbox payment expired for order ' + attempt.order.orderNumber,
        });
      }
      await recordAuditLogExplicit({
        tx, actorUserId: buyerId, actorAccessType: 'CUSTOMER', companyId: null,
        action: AUDIT_ACTIONS.RETAIL_PAYMENT_EXPIRED, entityType: 'RetailOrder', entityId: attempt.orderId,
        metadata: { paymentAttemptId: attempt.id },
      });
      return { expired: true, order: null };
    }

    await tx.paymentAttempt.update({
      where: { id: attempt.id },
      data: { status: 'SUCCEEDED', completedAt: now },
    });
    await tx.paymentTransaction.create({
      data: {
        orderId: attempt.orderId,
        attemptId: attempt.id,
        provider: 'sandbox',
        providerTransactionId: 'sandbox-' + attempt.id,
        transactionType: 'CAPTURE',
        status: 'SUCCEEDED',
        amount: attempt.amount,
        currency: attempt.currency,
        verifiedAt: now,
      },
    });
    await tx.retailOrder.update({
      where: { id: attempt.orderId },
      data: { status: 'PAID', paymentStatus: 'PAID', paidAt: now },
    });

    const reservations = await tx.inventoryReservation.findMany({
      where: { orderId: attempt.orderId, status: 'ACTIVE' },
      select: { id: true },
    });
    for (const reservation of reservations) {
      await inventoryService.consumeReservation(tx, {
        reservationId: reservation.id,
        actorUserId: buyerId,
        referenceType: 'RetailOrder',
        referenceId: String(attempt.orderId),
        reason: 'Sandbox payment confirmed for order ' + attempt.order.orderNumber,
      });
    }
    await recordAuditLogExplicit({
      tx, actorUserId: buyerId, actorAccessType: 'CUSTOMER', companyId: null,
      action: AUDIT_ACTIONS.RETAIL_PAYMENT_CONFIRMED, entityType: 'RetailOrder', entityId: attempt.orderId,
      after: { id: attempt.orderId, status: 'PAID', paymentStatus: 'PAID' },
      metadata: { paymentAttemptId: attempt.id, provider: 'sandbox' },
    });
    return { expired: false, order: await tx.retailOrder.findUnique({ where: { id: attempt.orderId }, select: ORDER_SELECT }) };
  });

  if (result.expired) {
    throw { statusCode: 409, code: 'SANDBOX_PAYMENT_EXPIRED', message: 'The payment window expired and the reserved stock was released.' };
  }
  return result.order;
}

async function expirePendingSandboxPayments({ limit = 100, now = new Date() } = {}) {
  if (process.env.RETAIL_PAYMENT_PROVIDER !== 'sandbox') return 0;
  const candidates = await prisma.paymentAttempt.findMany({
    where: {
      provider: 'sandbox',
      status: { in: ['CREATED', 'REDIRECTED', 'PENDING'] },
      expiresAt: { lte: now },
    },
    select: { id: true },
    orderBy: [{ expiresAt: 'asc' }, { id: 'asc' }],
    take: Math.min(500, Math.max(1, Number(limit) || 100)),
  });

  let expiredCount = 0;
  for (const candidate of candidates) {
    const expired = await runSerializableTransaction(async (tx) => {
      const attempt = await tx.paymentAttempt.findUnique({
        where: { id: candidate.id },
        include: { order: { select: { id: true, buyerUserId: true, orderNumber: true, status: true, paymentStatus: true } } },
      });
      if (!attempt || !['CREATED', 'REDIRECTED', 'PENDING'].includes(attempt.status)
        || !attempt.expiresAt || attempt.expiresAt > now
        || attempt.order.status !== 'PENDING_PAYMENT') return false;

      await tx.paymentAttempt.update({ where: { id: attempt.id }, data: { status: 'EXPIRED' } });
      await tx.retailOrder.update({
        where: { id: attempt.orderId },
        data: { status: 'PAYMENT_EXPIRED', paymentStatus: 'FAILED' },
      });
      const reservations = await tx.inventoryReservation.findMany({
        where: { orderId: attempt.orderId, status: 'ACTIVE' },
        select: { id: true },
      });
      for (const reservation of reservations) {
        await inventoryService.releaseReservation(tx, {
          reservationId: reservation.id,
          actorUserId: null,
          reason: 'Sandbox payment expired for order ' + attempt.order.orderNumber,
        });
      }
      await recordAuditLogExplicit({
        tx, actorUserId: null, actorAccessType: 'SYSTEM', companyId: null,
        action: AUDIT_ACTIONS.RETAIL_PAYMENT_EXPIRED, entityType: 'RetailOrder', entityId: attempt.orderId,
        before: { status: 'PENDING_PAYMENT', paymentStatus: 'PENDING' },
        after: { status: 'PAYMENT_EXPIRED', paymentStatus: 'FAILED' },
        metadata: { paymentAttemptId: attempt.id, reservationCount: reservations.length },
      });
      return true;
    });
    if (expired) expiredCount++;
  }
  return expiredCount;
}

async function listCustomerOrders(buyerUserId, { skip = 0, take = 20 } = {}) {
  return prisma.retailOrder.findMany({
    where: { buyerUserId: Number(buyerUserId) },
    orderBy: [{ placedAt: 'desc' }, { id: 'desc' }],
    skip,
    take,
    select: ORDER_SELECT,
  });
}

async function getCustomerOrder(buyerUserId, orderId) {
  const order = await prisma.retailOrder.findFirst({
    where: { id: Number(orderId), buyerUserId: Number(buyerUserId) },
    select: ORDER_SELECT,
  });
  if (!order) throw { statusCode: 404, code: 'RETAIL_ORDER_NOT_FOUND', message: 'Order not found.' };
  return order;
}

async function countCustomerOrders(buyerUserId) {
  return prisma.retailOrder.count({ where: { buyerUserId: Number(buyerUserId) } });
}

module.exports = {
  ORDER_RESERVATION_TTL_MINUTES,
  ORDER_SELECT,
  readOrderPolicy,
  normalizePlaceOrderInput,
  calculateTax,
  allocateTax,
  runSerializableTransaction,
  placeOrder,
  getSandboxPayment,
  confirmSandboxPayment,
  expirePendingSandboxPayments,
  listCustomerOrders,
  getCustomerOrder,
  countCustomerOrders,
};
