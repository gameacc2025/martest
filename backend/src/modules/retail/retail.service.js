const prisma = require('../../config/db');
const productService = require('../products/product.service');
const { Prisma } = require('@prisma/client');

const RETAIL_CURRENCY = process.env.RETAIL_CURRENCY || 'IRR';
const MAX_CHECKOUT_ITEMS = 50;

function isCurrentPriceTier(tier, now = new Date()) {
  if (!tier) return false;
  const validFrom = tier.validFrom == null ? null : new Date(tier.validFrom);
  const validTo = tier.validTo == null ? null : new Date(tier.validTo);
  if (validFrom && (!Number.isFinite(validFrom.getTime()) || validFrom > now)) return false;
  if (validTo && (!Number.isFinite(validTo.getTime()) || validTo < now)) return false;
  return true;
}

function selectPriceTier(prices, quantity = 1, now = new Date()) {
  if (!Array.isArray(prices) || !Number.isSafeInteger(quantity) || quantity <= 0) return null;
  return prices
    .filter((tier) => {
      const minQuantity = Number(tier.minQuantity);
      const maxQuantity = tier.maxQuantity == null ? Number.POSITIVE_INFINITY : Number(tier.maxQuantity);
      const price = new Prisma.Decimal(tier.price);
      return Number.isSafeInteger(minQuantity)
        && minQuantity <= quantity
        && maxQuantity >= quantity
        && price.greaterThan(0)
        && isCurrentPriceTier(tier, now);
    })
    .sort((a, b) => Number(b.minQuantity) - Number(a.minQuantity))[0] || null;
}

function availableQuantity(balance) {
  if (!balance) return 0;
  return Math.max(0, Number(balance.onHand) - Number(balance.reserved));
}

function toCatalogItem(product, balance) {
  const currentPrices = (product.prices || []).filter((tier) => isCurrentPriceTier(tier));
  const retailTier = selectPriceTier(currentPrices, 1);
  if (!product.retailEnabled || !retailTier) return null;

  const available = availableQuantity(balance);
  return {
    ...product,
    prices: currentPrices,
    retailPrice: new Prisma.Decimal(retailTier.price).toFixed(2),
    currency: RETAIL_CURRENCY,
    inStock: available > 0,
  };
}

async function listCatalog({ skip, take, filters = {} }) {
  const { items, total } = await productService.listProducts({
    skip,
    take,
    filters: {
      ...filters,
      retailEnabled: true,
      retailPurchasable: true,
    },
    caller: null,
    publicOnly: true,
  });

  const productIds = items.map((product) => product.id);
  const balances = productIds.length
    ? await prisma.inventoryBalance.findMany({
      where: { productId: { in: productIds } },
      select: { productId: true, onHand: true, reserved: true },
    })
    : [];
  const balanceByProduct = new Map(balances.map((balance) => [balance.productId, balance]));

  return {
    items: items.map((product) => toCatalogItem(product, balanceByProduct.get(product.id))).filter(Boolean),
    total,
  };
}

async function getCatalogProduct(productId) {
  const product = await productService.getProductById(productId, null);
  if (!product || !product.retailEnabled) return null;

  const balance = await prisma.inventoryBalance.findUnique({
    where: { productId: product.id },
    select: { productId: true, onHand: true, reserved: true },
  });
  return toCatalogItem(product, balance);
}

function normalizeCheckoutItems(items) {
  if (!Array.isArray(items) || items.length < 1 || items.length > MAX_CHECKOUT_ITEMS) {
    throw {
      statusCode: 400,
      code: 'INVALID_CHECKOUT_ITEMS',
      message: `Checkout must contain between 1 and ${MAX_CHECKOUT_ITEMS} distinct products.`,
    };
  }

  const normalized = items.map((item) => ({
    productId: Number(item?.productId),
    quantity: Number(item?.quantity),
  }));
  if (normalized.some((item) => !Number.isSafeInteger(item.productId) || item.productId <= 0
    || !Number.isSafeInteger(item.quantity) || item.quantity <= 0 || item.quantity > 10000)) {
    throw { statusCode: 400, code: 'INVALID_CHECKOUT_ITEM', message: 'Each checkout item needs a valid productId and positive quantity.' };
  }

  const ids = normalized.map((item) => item.productId);
  if (new Set(ids).size !== ids.length) {
    throw { statusCode: 400, code: 'DUPLICATE_CHECKOUT_PRODUCT', message: 'Each product may appear only once in checkout.' };
  }
  return normalized;
}

function checkoutPolicyStatus(env = process.env) {
  const configured = (key) => env[key] !== undefined && env[key] !== '';
  return {
    shipping: configured('RETAIL_SHIPPING_FLAT_AMOUNT') ? 'CONFIGURED' : 'NOT_CONFIGURED',
    tax: configured('RETAIL_TAX_RATE_BPS') ? 'CONFIGURED' : 'NOT_CONFIGURED',
    taxBase: ['PRODUCT_SUBTOTAL', 'SUBTOTAL_PLUS_SHIPPING'].includes(env.RETAIL_TAX_BASE) ? 'CONFIGURED' : 'NOT_CONFIGURED',
    commission: configured('RETAIL_COMMISSION_RATE_BPS') ? 'CONFIGURED' : 'NOT_CONFIGURED',
    payment: env.RETAIL_PAYMENT_PROVIDER === 'sandbox' ? 'SANDBOX_ONLY' : 'NOT_CONFIGURED',
    orderPlacement: env.RETAIL_ORDER_PLACEMENT_ENABLED === 'true' ? 'ENABLED' : 'DISABLED',
  };
}

async function previewCheckout(_buyerUserId, items) {
  const normalizedItems = normalizeCheckoutItems(items);
  const products = await Promise.all(normalizedItems.map((item) => productService.getProductById(item.productId, null)));
  const productIds = normalizedItems.map((item) => item.productId);
  const balances = await prisma.inventoryBalance.findMany({
    where: { productId: { in: productIds } },
    select: { productId: true, onHand: true, reserved: true },
  });
  const balanceByProduct = new Map(balances.map((balance) => [balance.productId, balance]));

  let subtotal = new Prisma.Decimal(0);
  const sellerGroups = new Map();
  const checkoutLines = [];

  for (let index = 0; index < normalizedItems.length; index++) {
    const requested = normalizedItems[index];
    const product = products[index];
    if (!product || !product.retailEnabled) {
      throw { statusCode: 404, code: 'RETAIL_PRODUCT_UNAVAILABLE', message: 'One or more products are not available for retail purchase.' };
    }

    const tier = selectPriceTier(product.prices, requested.quantity);
    if (!tier) {
      throw { statusCode: 409, code: 'RETAIL_PRICE_UNAVAILABLE', message: `No active retail price is available for product ${requested.productId} and quantity ${requested.quantity}.` };
    }

    const balance = balanceByProduct.get(product.id);
    const available = availableQuantity(balance);
    if (available < requested.quantity) {
      throw {
        statusCode: 409,
        code: 'INSUFFICIENT_STOCK',
        message: `Insufficient available stock for product ${requested.productId}.`,
        details: { productId: product.id, requestedQuantity: requested.quantity, availableQuantity: available },
      };
    }

    const unitPrice = new Prisma.Decimal(tier.price);
    const lineTotal = unitPrice.mul(requested.quantity);
    subtotal = subtotal.plus(lineTotal);

    const line = {
      productId: product.id,
      title: product.title,
      sku: product.sku,
      quantity: requested.quantity,
      unit: tier.unit || null,
      unitPrice: unitPrice.toFixed(2),
      lineTotal: lineTotal.toFixed(2),
      availableQuantity: available,
      seller: { id: product.companyId, name: product.company?.name || null },
    };
    checkoutLines.push(line);

    if (!sellerGroups.has(product.companyId)) {
      sellerGroups.set(product.companyId, {
        companyId: product.companyId,
        sellerName: product.company?.name || null,
        items: [],
        subtotal: new Prisma.Decimal(0),
      });
    }
    const sellerGroup = sellerGroups.get(product.companyId);
    sellerGroup.items.push(line);
    sellerGroup.subtotal = sellerGroup.subtotal.plus(lineTotal);
  }

  const policyStatus = checkoutPolicyStatus();
  const blockers = [];
  for (const key of ['shipping', 'tax', 'taxBase', 'commission', 'payment']) {
    if (policyStatus[key] === 'NOT_CONFIGURED') blockers.push(key.toUpperCase() + '_POLICY_NOT_CONFIGURED');
  }
  if (policyStatus.orderPlacement !== 'ENABLED') blockers.push('RETAIL_ORDER_PLACEMENT_DISABLED');

  return {
    currency: RETAIL_CURRENCY,
    items: checkoutLines,
    sellers: [...sellerGroups.values()].map((seller) => ({
      ...seller,
      subtotal: seller.subtotal.toFixed(2),
    })),
    subtotal: subtotal.toFixed(2),
    fees: {
      shipping: null,
      tax: null,
      total: null,
    },
    policyStatus,
    orderPlacementEnabled: blockers.length === 0,
    blockers,
  };
}

module.exports = {
  RETAIL_CURRENCY,
  MAX_CHECKOUT_ITEMS,
  isCurrentPriceTier,
  selectPriceTier,
  availableQuantity,
  toCatalogItem,
  listCatalog,
  getCatalogProduct,
  normalizeCheckoutItems,
  checkoutPolicyStatus,
  previewCheckout,
};
