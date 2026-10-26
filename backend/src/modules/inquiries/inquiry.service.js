// =============================================================
// Inquiry Service — workflow/business logic for RFQ inquiries
// =============================================================

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');
const prisma = require('../../config/db');
const { SUPER_ADMIN_ROLE } = require('../../utils/rbac');
const { dispatchNotification } = require('../notifications/notification.dispatch.service');
const { consumeUsage } = require('./inquiry-subscription.service');
const { getPaginationParams, buildPaginatedResponse } = require('../../utils/pagination');
const {
  validateInquiryCreationCapacity,
  validateResponseSubmissionCapacity,
} = require('../companies/company-rule.service');

// ── Response attachment upload configuration ─────────────────
const RESPONSE_UPLOAD_ROOT = path.join(process.cwd(), 'uploads', 'inquiries', 'responses');
const MAX_RESPONSE_ATTACHMENT_BYTES = 20 * 1024 * 1024; // 20 MB
const MAX_RESPONSE_ATTACHMENTS = 10;
const SUPPORTED_ATTACHMENT_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);



const INQUIRY_STATUSES = ['DRAFT', 'SUBMITTED', 'OPEN', 'CLOSED', 'EXPIRED', 'COMPLETED', 'CANCELLED'];
const INQUIRY_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
const INQUIRY_VISIBILITY_MODES = ['NORMAL', 'SEALED', 'ANONYMOUS_SEALED'];


const INQUIRY_TRANSITIONS = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['OPEN', 'CANCELLED'],
  OPEN: ['CLOSED', 'EXPIRED', 'CANCELLED'],
  CLOSED: ['COMPLETED', 'CANCELLED'],
  EXPIRED: ['CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

const inquiryInclude = {
  company: { select: { id: true, name: true, type: true } },
  items: {
    include: {
      product: {
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          company: { select: { id: true, name: true, status: true } },
        },
      },
    },
  },
  responses: {
    orderBy: { createdAt: 'asc' },
    include: {
      company: { select: { id: true, name: true, type: true } },
      items: {
        include: {
          inquiryItem: {
            include: {
              product: { select: { id: true, title: true, slug: true, companyId: true } },
            },
          },
        },
      },
    },
  },
  statusHistory: {
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { changedBy: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } } },
  },
};

const responseInclude = {
  company: { select: { id: true, name: true, type: true } },
  attachments: { orderBy: { createdAt: 'asc' } },
  items: {
    include: {
      inquiryItem: {
        include: {
          product: {
            select: {
              id: true,
              title: true,
              slug: true,
              companyId: true,
            },
          },
        },
      },
    },
  },
};



function getInquirySmsGatewayConfig() {
  const accountSid = String(process.env.TWILIO_ACCOUNT_SID || '').trim();
  const authToken = String(process.env.TWILIO_AUTH_TOKEN || '').trim();
  const from = String(process.env.TWILIO_FROM_NUMBER || '').trim();
  if (!accountSid || !authToken || !from) {
    throw { statusCode: 503, code: 'SMS_PROVIDER_NOT_CONFIGURED', message: 'درگاه پیامک روی سرور پیکربندی نشده است.' };
  }
  if (!accountSid.startsWith('AC') || from.length > 40) {
    throw { statusCode: 500, code: 'SMS_PROVIDER_CONFIGURATION_INVALID', message: 'تنظیمات درگاه پیامک معتبر نیست.' };
  }
  return { accountSid, authToken, from };
}

function isSuperAdmin(caller) {
  return caller?.roles?.includes(SUPER_ADMIN_ROLE) || caller?.permissions?.includes('*');
}

function hasAnyPermission(caller, ...permissions) {
  return isSuperAdmin(caller) || permissions.some((permission) => caller?.permissions?.includes(permission));
}

function isStaffWithPermission(caller, ...permissions) {
  return isSuperAdmin(caller) || (caller?.accessType === 'STAFF' && hasAnyPermission(caller, ...permissions));
}

function isInquiryBuyer(inquiry, caller) {
  if (!inquiry || !caller) return false;
  if (isSuperAdmin(caller)) return true;
  if (inquiry.buyerUserId && Number(inquiry.buyerUserId) === Number(caller.id)) return true;
  return Boolean(inquiry.companyId) && Number(inquiry.companyId) === Number(caller.companyId);
}

function resolveCompanyId(data, caller) {
  if (caller?.accessType === 'CUSTOMER' && !isSuperAdmin(caller)) return null;
  if (isSuperAdmin(caller) && data?.companyId) return Number(data.companyId);
  if (caller?.companyId) return Number(caller.companyId);
  if (data?.companyId && caller?.accessType === 'STAFF' && hasAnyPermission(caller, 'leads.create', 'inquiries.create')) {
    return Number(data.companyId);
  }
  return null;
}

function ensureCompanyId(companyId) {
  if (!Number.isInteger(Number(companyId)) || Number(companyId) < 1) {
    throw { statusCode: 400, code: 'COMPANY_REQUIRED', message: 'شناسه شرکت الزامی است.' };
  }
}

function toPositiveInt(value, field) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) {
    throw { statusCode: 400, code: 'VALIDATION_ERROR', message: `${field} must be a positive integer.` };
  }
  return number;
}

function assertCanManageInquiryItems(inquiry, caller) {
  assertCanManageInquiry(inquiry, caller);
  if (inquiry.status !== 'DRAFT') {
    throw { statusCode: 400, code: 'INQUIRY_ITEMS_LOCKED', message: 'RFQ items can only be changed while the RFQ is in draft status.' };
  }
}

function assertCanReadInquiry(inquiry, caller) {
  if (!inquiry) throw { statusCode: 404, code: 'INQUIRY_NOT_FOUND', message: 'درخواست یافت نشد.' };
  if (isInquiryBuyer(inquiry, caller) || isStaffWithPermission(caller, 'leads.read', 'inquiries.read')) return;
  throw { statusCode: 404, code: 'INQUIRY_NOT_FOUND', message: 'درخواست یافت نشد.' };
}

function assertCanManageInquiry(inquiry, caller) {
  if (!inquiry) throw { statusCode: 404, code: 'INQUIRY_NOT_FOUND', message: 'درخواست یافت نشد.' };
  if (isInquiryBuyer(inquiry, caller)) return;
  if (isStaffWithPermission(caller, 'leads.update', 'inquiries.update')) return;
  throw { statusCode: 404, code: 'INQUIRY_NOT_FOUND', message: 'درخواست یافت نشد.' };
}

function assertAuthenticatedUser(caller) {
  const userId = Number(caller?.id);
  if (!Number.isInteger(userId) || userId < 1) {
    throw { statusCode: 401, code: 'UNAUTHORIZED', message: 'Authenticated user is required.' };
  }
  return userId;
}

function assertValidInquiryStatus(status) {
  if (!INQUIRY_STATUSES.includes(status)) {
    throw { statusCode: 400, code: 'INVALID_INQUIRY_STATUS', message: `Invalid RFQ status: ${status}.` };
  }
}

function assertInquiryTransition(currentStatus, nextStatus) {
  assertValidInquiryStatus(nextStatus);
  if (currentStatus === nextStatus) {
    throw { statusCode: 400, code: 'STATUS_UNCHANGED', message: `RFQ is already ${nextStatus}.` };
  }

  const allowed = INQUIRY_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    throw {
      statusCode: 400,
      code: 'INVALID_STATUS_TRANSITION',
      message: `Cannot change RFQ status from ${currentStatus} to ${nextStatus}.`,
      details: { from: currentStatus, to: nextStatus, allowed },
    };
  }
}

function buildStatusTransitionData(nextStatus) {
  const data = { status: nextStatus };
  if (['CLOSED', 'EXPIRED', 'COMPLETED', 'CANCELLED'].includes(nextStatus)) {
    data.closedAt = new Date();
  }
  if (['SUBMITTED', 'OPEN'].includes(nextStatus)) {
    data.closedAt = null;
  }
  return data;
}

async function validateInquiryReadyForStatus(inquiryId, nextStatus, tx = prisma) {
  if (nextStatus === 'SUBMITTED' || nextStatus === 'OPEN') {
    const itemCount = await tx.inquiryItem.count({ where: { inquiryId } });
    if (itemCount < 1) {
      throw { statusCode: 400, code: 'INQUIRY_ITEMS_REQUIRED', message: 'RFQ must contain at least one item before submission.' };
    }
  }
}

function assertInquiryAcceptsResponseChanges(inquiry) {
  if (!inquiry) throw { statusCode: 404, code: 'INQUIRY_NOT_FOUND', message: 'درخواست یافت نشد.' };
  if (inquiry.status !== 'OPEN' || inquiry.closedAt) {
    throw { statusCode: 400, code: 'INQUIRY_CLOSED', message: 'Responses cannot be changed after the RFQ closes.' };
  }
  if (inquiry.responseDeadline && new Date(inquiry.responseDeadline) <= new Date()) {
    throw { statusCode: 400, code: 'INQUIRY_DEADLINE_PASSED', message: 'Responses cannot be changed after the RFQ deadline.' };
  }
}

function isDeadlinePassed(inquiry) {
  return Boolean(inquiry.responseDeadline) && new Date(inquiry.responseDeadline) <= new Date();
}

/**
 * Rules for editing an EXISTING response.
 *
 * The inquiry must still be open, editing must be enabled on the RFQ
 * (allowEditResponse), and once the deadline has passed edits are only
 * permitted when the RFQ explicitly allows post-deadline changes
 * (allowEditResponse acts as the "unless configured" switch).
 */
function assertResponseEditable(inquiry) {
  if (!inquiry) throw { statusCode: 404, code: 'INQUIRY_NOT_FOUND', message: 'درخواست یافت نشد.' };
  if (inquiry.status !== 'OPEN' || inquiry.closedAt) {
    throw { statusCode: 400, code: 'INQUIRY_CLOSED', message: 'Responses cannot be changed after the RFQ closes.' };
  }
  if (!inquiry.allowEditResponse) {
    throw { statusCode: 403, code: 'RESPONSE_EDIT_DISABLED', message: 'Editing responses is disabled for this RFQ.' };
  }
  if (isDeadlinePassed(inquiry)) {
    throw { statusCode: 400, code: 'INQUIRY_DEADLINE_PASSED', message: 'Responses cannot be edited after the RFQ deadline.' };
  }
}

/**
 * Rules for withdrawing a response. Withdrawal must be explicitly enabled
 * on the RFQ (allowWithdrawResponse) and is only possible while the RFQ is
 * open and before the deadline.
 */
function assertResponseWithdrawable(inquiry) {
  if (!inquiry) throw { statusCode: 404, code: 'INQUIRY_NOT_FOUND', message: 'درخواست یافت نشد.' };
  if (inquiry.status !== 'OPEN' || inquiry.closedAt) {
    throw { statusCode: 400, code: 'INQUIRY_CLOSED', message: 'Responses cannot be withdrawn after the RFQ closes.' };
  }
  if (!inquiry.allowWithdrawResponse) {
    throw { statusCode: 403, code: 'RESPONSE_WITHDRAW_DISABLED', message: 'Withdrawing responses is disabled for this RFQ.' };
  }
  if (isDeadlinePassed(inquiry)) {
    throw { statusCode: 400, code: 'INQUIRY_DEADLINE_PASSED', message: 'Responses cannot be withdrawn after the RFQ deadline.' };
  }
}

function sanitizeAttachmentFilename(filename) {
  const ext = path.extname(filename || '').toLowerCase();
  const basename = path.basename(filename || 'file', ext).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 60) || 'file';
  return `${Date.now()}-${crypto.randomBytes(8).toString('hex')}-${basename}${ext}`;
}

async function saveResponseAttachment(file) {
  if (!file) throw { statusCode: 400, code: 'FILE_REQUIRED', message: 'A file upload is required.' };
  if (!SUPPORTED_ATTACHMENT_TYPES.has(file.mimetype)) {
    throw { statusCode: 400, code: 'UNSUPPORTED_FILE_TYPE', message: `Unsupported file type: ${file.mimetype}.` };
  }

  await fs.promises.mkdir(RESPONSE_UPLOAD_ROOT, { recursive: true });
  const filename = sanitizeAttachmentFilename(file.filename);
  const destination = path.join(RESPONSE_UPLOAD_ROOT, filename);
  let bytesWritten = 0;

  file.file.on('data', (chunk) => {
    bytesWritten += chunk.length;
    if (bytesWritten > MAX_RESPONSE_ATTACHMENT_BYTES) {
      file.file.destroy(Object.assign(new Error('File too large'), { statusCode: 413 }));
    }
  });

  try {
    await pipeline(file.file, fs.createWriteStream(destination));
  } catch (error) {
    await fs.promises.rm(destination, { force: true }).catch(() => {});
    throw { statusCode: error.statusCode || 413, code: 'FILE_TOO_LARGE', message: 'Uploaded file exceeds the allowed size.' };
  }

  return {
    url: `/uploads/inquiries/responses/${filename}`,
    filename: file.filename || filename,
    mimetype: file.mimetype || null,
    size: bytesWritten,
  };
}

async function removeStoredAttachment(url) {
  if (!url || !url.startsWith('/uploads/inquiries/responses/')) return;
  const relativePath = url.replace(/^\/uploads\/inquiries\/responses\//, '');
  const filePath = path.join(RESPONSE_UPLOAD_ROOT, relativePath);
  await fs.promises.rm(filePath, { force: true }).catch(() => {});
}

function assertCanReadResponses(inquiry, caller) {
  if (!inquiry) throw { statusCode: 404, code: 'INQUIRY_NOT_FOUND', message: 'درخواست یافت نشد.' };
  if (isInquiryBuyer(inquiry, caller) || isStaffWithPermission(caller, 'leads.read', 'inquiries.read')) return;
  if (!caller?.companyId && caller?.accessType !== 'CUSTOMER') {
    throw { statusCode: 400, code: 'COMPANY_REQUIRED', message: 'شناسه شرکت الزامی است.' };
  }

  const callerCompanyId = Number(caller?.companyId);
  const ownsRequestedProduct = Number.isInteger(callerCompanyId) && callerCompanyId > 0
    && (inquiry.items || []).some((item) => Number(item.product?.companyId) === callerCompanyId);
  const publishedStatuses = ['SUBMITTED', 'OPEN', 'CLOSED', 'EXPIRED', 'COMPLETED'];
  const isPublished = publishedStatuses.includes(inquiry.status)
    && (!inquiry.publishDate || new Date(inquiry.publishDate) <= new Date());
  if (!ownsRequestedProduct || !isPublished) {
    throw { statusCode: 404, code: 'INQUIRY_NOT_FOUND', message: 'درخواست یافت نشد.' };
  }
}

function areResponsesRevealed(inquiry) {
  if (!inquiry) return false;
  if (inquiry.revealedAt) return true;
  if (['CLOSED', 'EXPIRED', 'COMPLETED', 'CANCELLED'].includes(inquiry.status)) return true;
  return Boolean(inquiry.responseDeadline) && new Date(inquiry.responseDeadline) <= new Date();
}

function shapeInquiryForCaller(inquiry, caller) {
  const result = { ...inquiry };
  delete result.buyerUserId;

  const isStaff = isStaffWithPermission(caller, 'leads.read', 'inquiries.read');
  const isBuyer = isInquiryBuyer(inquiry, caller);
  const callerCompanyId = Number(caller?.companyId) || null;

  if (!isBuyer && !isStaff && inquiry.confidential) {
    result.company = null;
    delete result.companyId;
  }

  const responses = Array.isArray(inquiry.responses) ? inquiry.responses : [];
  result.responseCount = inquiry._count?.responses ?? responses.length;
  if (!isBuyer && !isStaff && ['SEALED', 'ANONYMOUS_SEALED'].includes(inquiry.visibilityMode)) {
    delete result.responseCount;
  }

  if (isBuyer && ['SEALED', 'ANONYMOUS_SEALED'].includes(inquiry.visibilityMode) && !areResponsesRevealed(inquiry)) {
    result.responses = [];
    result.responsesHidden = true;
  } else {
    let visibleResponses = responses;
    if (!isBuyer && !isStaff) {
      visibleResponses = responses.filter((response) => Number(response.companyId) === callerCompanyId);
    }

    if (isBuyer && inquiry.visibilityMode === 'ANONYMOUS_SEALED' && areResponsesRevealed(inquiry) && !isStaff) {
      let ordinal = 0;
      visibleResponses = visibleResponses.map((response) => {
        ordinal += 1;
        const anonymous = { ...response, company: { name: `پیشنهاددهنده ${ordinal}`, type: null } };
        delete anonymous.companyId;
        anonymous.items = (response.items || []).map((item) => {
          const safeItem = { ...item };
          if (safeItem.inquiryItem?.product) {
            safeItem.inquiryItem = { ...safeItem.inquiryItem, product: { ...safeItem.inquiryItem.product } };
            delete safeItem.inquiryItem.product.companyId;
          }
          return safeItem;
        });
        return anonymous;
      });
      result.items = (result.items || []).map((item) => ({
        ...item,
        product: item.product ? { ...item.product, company: null } : item.product,
      }));
    }

    result.responses = visibleResponses;
    result.responsesHidden = false;
  }

  return result;
}

async function notifyInquiryPublished(tx, inquiry) {
  const rows = await tx.inquiryItem.findMany({
    where: { inquiryId: inquiry.id },
    select: { product: { select: { companyId: true } } },
  });
  const companyIds = [...new Set(rows.map((row) => Number(row.product?.companyId)).filter((id) => id > 0))];
  const context = { inquiry: { id: inquiry.id, title: inquiry.title } };

  if (companyIds.length) {
    await dispatchNotification('INQUIRY_PUBLISHED', { companyIds }, context, {
      tx,
      dedupeKey: (userId) => `inquiry-published-${inquiry.id}-companies-${userId}`,
    });
  }
  await dispatchNotification('INQUIRY_PUBLISHED', { permission: 'leads.read' }, context, {
    tx,
    dedupeKey: (userId) => `inquiry-published-${inquiry.id}-staff-${userId}`,
  });
}

async function notifyInquiryOwner(tx, inquiry, eventKey, context, dedupeKey) {
  const recipients = inquiry.buyerUserId
    ? [Number(inquiry.buyerUserId)]
    : (inquiry.companyId ? { companyIds: [Number(inquiry.companyId)] } : []);
  if (!recipients.length) return;
  await dispatchNotification(eventKey, recipients, context, {
    tx,
    dedupeKey: (userId) => `${typeof dedupeKey === 'function' ? dedupeKey(userId) : dedupeKey}-${userId}`,
  });
}

function normalizeInquiryItems(items = []) {
  if (!Array.isArray(items) || items.length === 0) return undefined;

  return {
    create: items.map((item) => ({
      productId: Number(item.productId),
      description: item.description,
      quantity: Number(item.quantity),
      attachment: item.attachment,
    })),
  };
}

/**
 * Build the professional (phase 2) inquiry settings from a payload.
 *
 * `partial` controls behaviour:
 *   - false (create): every setting falls back to its schema default so a
 *     complete row is written.
 *   - true (update):  only the keys present in `data` are returned, so a
 *     PATCH never overwrites untouched columns.
 *
 * Date fields accept ISO strings, or `null` to clear (update only).
 */
function assertInquiryDateWindow(publishDate, responseDeadline) {
  if (!responseDeadline) return;
  const publicationBoundary = publishDate ? new Date(publishDate) : new Date();
  if (Number.isNaN(publicationBoundary.getTime()) || new Date(responseDeadline) <= publicationBoundary) {
    throw {
      statusCode: 400,
      code: 'INVALID_INQUIRY_DATE_WINDOW',
      message: 'The response deadline must be later than the publication date (or the current time when publishing immediately).',
    };
  }
}

function buildInquirySettings(data = {}, { partial = false } = {}) {
  const settings = {};

  const setEnum = (key, allowed) => {
    if (data[key] !== undefined) {
      if (!allowed.includes(data[key])) {
        throw { statusCode: 400, code: 'VALIDATION_ERROR', message: `Invalid ${key}: ${data[key]}.` };
      }
      settings[key] = data[key];
    }
  };

  const setBool = (key, fallback) => {
    if (data[key] !== undefined) {
      settings[key] = Boolean(data[key]);
    } else if (!partial) {
      settings[key] = fallback;
    }
  };

  const setDate = (key) => {
    if (data[key] !== undefined) {
      if (!data[key]) {
        settings[key] = null;
        return;
      }
      const date = new Date(data[key]);
      if (Number.isNaN(date.getTime())) {
        throw { statusCode: 400, code: 'INVALID_INQUIRY_DATE', message: `Invalid date value for ${key}.` };
      }
      settings[key] = date;
    } else if (!partial) {
      settings[key] = null;
    }
  };

  setEnum('priority', INQUIRY_PRIORITIES);
  setEnum('visibilityMode', INQUIRY_VISIBILITY_MODES);
  if (!partial) {
    if (settings.priority === undefined) settings.priority = 'NORMAL';
    if (settings.visibilityMode === undefined) settings.visibilityMode = 'NORMAL';
  }

  setBool('confidential', false);
  setBool('autoClose', true);
  setBool('allowEarlyReveal', false);
  setBool('allowEditResponse', true);
  setBool('allowWithdrawResponse', false);

  setDate('publishDate');
  setDate('responseDeadline');

  if (!partial) assertInquiryDateWindow(settings.publishDate, settings.responseDeadline);
  return settings;
}

async function validateInquiryProducts(items = [], tx = prisma) {

  if (!Array.isArray(items) || items.length === 0) {
    throw { statusCode: 400, code: 'INQUIRY_ITEMS_REQUIRED', message: 'At least one RFQ item is required.' };
  }

  const productIds = [...new Set(items.map((item) => Number(item.productId)))];
  if (productIds.some((productId) => !Number.isInteger(productId) || productId < 1)) {
    throw { statusCode: 400, code: 'INVALID_PRODUCT_ID', message: 'Each RFQ item must reference a valid product.' };
  }

  const products = await tx.product.findMany({
    where: {
      id: { in: productIds },
      deletedAt: null,
    },
    select: {
      id: true,
      status: true,
      company: { select: { status: true } },
    },
  });

  const foundProductIds = new Set(products.map((product) => product.id));
  const missingProductIds = productIds.filter((productId) => !foundProductIds.has(productId));
  if (missingProductIds.length > 0) {
    throw { statusCode: 400, code: 'PRODUCT_NOT_FOUND', message: 'One or more RFQ products were not found.' };
  }

  const unpublishedProduct = products.find((product) => product.status !== 'PUBLISHED');
  if (unpublishedProduct) {
    throw { statusCode: 400, code: 'PRODUCT_NOT_PUBLISHED', message: 'RFQ items can only reference published products.' };
  }

  const inactiveCompanyProduct = products.find((product) => product.company.status !== 'ACTIVE');
  if (inactiveCompanyProduct) {
    throw { statusCode: 400, code: 'PRODUCT_COMPANY_NOT_ACTIVE', message: 'RFQ items can only reference products from active companies.' };
  }
}

async function validateInquiryProduct(item, tx = prisma) {
  await validateInquiryProducts([item], tx);
}

function normalizeInquiryItem(item) {
  return {
    productId: Number(item.productId),
    quantity: Number(item.quantity),
    description: item.description,
    attachment: item.attachment,
  };
}

function normalizeInquiryItemUpdate(data) {
  const updateData = {};
  if (data.productId !== undefined) updateData.productId = Number(data.productId);
  if (data.quantity !== undefined) updateData.quantity = Number(data.quantity);
  if (data.description !== undefined) updateData.description = data.description;
  if (data.attachment !== undefined) updateData.attachment = data.attachment;
  return updateData;
}

function normalizeResponseItems(items = []) {
  if (!Array.isArray(items) || items.length === 0) return undefined;

  return {
    create: items.map((item) => ({
      inquiryItemId: Number(item.inquiryItemId),
      price: Number(item.price),
      currency: item.currency || 'IRR',
      availableQuantity: Number(item.availableQuantity),
      deliveryTime: item.deliveryTime,
      description: item.description,
    })),
  };
}

async function getOwnedInquiryItemIds(inquiryId, companyId, tx = prisma) {
  const items = await tx.inquiryItem.findMany({
    where: {
      inquiryId,
      product: { companyId },
    },
    select: { id: true },
  });

  return new Set(items.map((item) => item.id));
}

function validateResponseItemOwnership(items, ownedInquiryItemIds) {
  if (!Array.isArray(items) || items.length === 0) {
    throw { statusCode: 400, code: 'RESPONSE_ITEMS_REQUIRED', message: 'At least one response item is required.' };
  }

  const requestedItemIds = items.map((item) => Number(item.inquiryItemId));
  if (requestedItemIds.some((itemId) => !Number.isInteger(itemId) || itemId < 1)) {
    throw { statusCode: 400, code: 'INVALID_INQUIRY_ITEM_ID', message: 'Each response item must reference a valid RFQ item.' };
  }

  const duplicateItemId = requestedItemIds.find((itemId, index) => requestedItemIds.indexOf(itemId) !== index);
  if (duplicateItemId) {
    throw { statusCode: 400, code: 'DUPLICATE_RESPONSE_ITEM', message: 'Each RFQ item can only be quoted once per response.' };
  }

  const unauthorizedItemId = requestedItemIds.find((itemId) => !ownedInquiryItemIds.has(itemId));
  if (unauthorizedItemId) {
    throw { statusCode: 403, code: 'RESPONSE_ITEM_NOT_ALLOWED', message: 'Companies may only respond to RFQ items for their own products.' };
  }
}

const INQUIRY_SORT_FIELDS = ['id', 'title', 'status', 'createdAt', 'updatedAt', 'responseDeadline'];

function buildInquiryOrderBy(query) {
  const sortBy = INQUIRY_SORT_FIELDS.includes(query.sortBy) ? query.sortBy : 'createdAt';
  const sortOrder = String(query.sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc';
  return { [sortBy]: sortOrder };
}

/**
 * List inquiries with server-side pagination, search, filter and sort.
 *
 * Scope (RFQ visibility):
 *   - 'sent'     → inquiries created by the caller's company (buyer side)
 *   - 'received' → inquiries requesting a product owned by the caller's company (seller side)
 *   - 'all'      → SUPER_ADMIN only; every inquiry
 *
 * Query params: page, limit, search, status, scope, sortBy, sortOrder
 */
async function listInquiries(query, caller) {
  const { page, limit, skip, take } = getPaginationParams(query);
  const superAdmin = isSuperAdmin(caller);
  const callerCompanyId = Number(caller?.companyId) || null;
  const callerUserId = Number(caller?.id) || null;
  const isCustomer = caller?.accessType === 'CUSTOMER' && !superAdmin;
  const isStaff = caller?.accessType === 'STAFF' || superAdmin;
  const scope = query.scope || (isStaff ? 'all' : 'sent');

  const where = { AND: [] };

  if (isStaff && !superAdmin && !hasAnyPermission(caller, 'leads.read', 'inquiries.read')) {
    throw { statusCode: 403, code: 'FORBIDDEN', message: 'You do not have permission to read inquiries.' };
  }

  if (scope === 'received') {
    if (isCustomer || !callerCompanyId) {
      throw { statusCode: 403, code: 'INVALID_INQUIRY_SCOPE', message: 'Received inquiries are only available to company users.' };
    }
    where.AND.push({ items: { some: { product: { companyId: callerCompanyId } } } });
    where.AND.push({ status: { in: ['SUBMITTED', 'OPEN', 'CLOSED', 'EXPIRED', 'COMPLETED'] } });
    where.AND.push({ OR: [{ publishDate: null }, { publishDate: { lte: new Date() } }] });
  } else if (scope === 'sent') {
    if (isCustomer) {
      where.AND.push({ buyerUserId: callerUserId });
    } else if (!isStaff) {
      ensureCompanyId(callerCompanyId);
      where.AND.push({ companyId: callerCompanyId });
    }
  } else if (scope === 'all') {
    if (isCustomer) {
      where.AND.push({ buyerUserId: callerUserId });
    } else if (!isStaff) {
      ensureCompanyId(callerCompanyId);
      where.AND.push({ companyId: callerCompanyId });
    }
  }

  if (query.status) {
    assertValidInquiryStatus(query.status);
    where.AND.push({ status: query.status });
  }

  if (query.search) {
    where.AND.push({
      OR: [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ],
    });
  }

  if (where.AND.length === 0) delete where.AND;

  const [total, inquiries] = await Promise.all([
    prisma.inquiry.count({ where }),
    prisma.inquiry.findMany({
      where,
      include: {
        company: { select: { id: true, name: true, type: true } },
        _count: { select: { items: true, responses: true } },
      },
      orderBy: buildInquiryOrderBy(query),
      skip,
      take,
    }),
  ]);

  const safeInquiries = inquiries.map((inquiry) => {
    const safe = { ...inquiry };
    delete safe.buyerUserId;
    if (!isInquiryBuyer(inquiry, caller) && !isStaff && inquiry.confidential) {
      safe.company = null;
      delete safe.companyId;
    }
    if (!isInquiryBuyer(inquiry, caller) && !isStaff && ['SEALED', 'ANONYMOUS_SEALED'].includes(inquiry.visibilityMode)) {
      safe._count = { ...(safe._count || {}) };
      delete safe._count.responses;
    }
    return safe;
  });

  return buildPaginatedResponse(safeInquiries, total, page, limit);
}

/**
 * Get a single inquiry with caller-specific visibility.
 * Buyers, authorized STAFF, and eligible supplier companies may read it.
 * Supplier companies cannot discover drafts or future-scheduled inquiries.
 */
async function getInquiry(inquiryId, caller) {
  const numericInquiryId = toPositiveInt(inquiryId, 'id');
  const inquiry = await prisma.inquiry.findUnique({
    where: { id: numericInquiryId },
    include: inquiryInclude,
  });
  if (!inquiry) throw { statusCode: 404, code: 'INQUIRY_NOT_FOUND', message: 'درخواست یافت نشد.' };

  const isBuyer = isInquiryBuyer(inquiry, caller);
  const isStaff = isStaffWithPermission(caller, 'leads.read', 'inquiries.read');
  const callerCompanyId = Number(caller?.companyId) || null;
  const ownsRequestedProduct = Boolean(callerCompanyId)
    && inquiry.items.some((item) => Number(item.product?.company?.id) === callerCompanyId);
  const publishedStatuses = ['SUBMITTED', 'OPEN', 'CLOSED', 'EXPIRED', 'COMPLETED'];
  const isPublishedForSuppliers = publishedStatuses.includes(inquiry.status)
    && (!inquiry.publishDate || new Date(inquiry.publishDate) <= new Date());

  if (!isBuyer && !isStaff && !(ownsRequestedProduct && isPublishedForSuppliers)) {
    throw { statusCode: 404, code: 'INQUIRY_NOT_FOUND', message: 'درخواست یافت نشد.' };
  }

  return shapeInquiryForCaller(inquiry, caller);
}

async function createInquiry(data, caller) {
  const isCustomerBuyer = caller?.accessType === 'CUSTOMER' && !isSuperAdmin(caller);
  const buyerUserId = isCustomerBuyer ? assertAuthenticatedUser(caller) : null;
  const companyId = isCustomerBuyer ? null : resolveCompanyId(data, caller);

  if (!isCustomerBuyer) ensureCompanyId(companyId);

  return prisma.$transaction(async (tx) => {
    if (companyId) {
      await validateInquiryCreationCapacity(companyId, tx);
      await consumeUsage({ ownerType: 'company', ownerId: companyId, usageType: 'INQUIRY_CREATE', tx });
    } else if (buyerUserId) {
      await consumeUsage({ ownerType: 'user', ownerId: buyerUserId, usageType: 'INQUIRY_CREATE', tx });
    }
    await validateInquiryProducts(data.items, tx);

    if (data.status && data.status !== 'DRAFT') {
      throw { statusCode: 400, code: 'INVALID_INITIAL_STATUS', message: 'RFQs must be created as DRAFT and then moved through status workflow.' };
    }

    const settings = buildInquirySettings(data, { partial: false });
    // Website quick inquiries are actionable immediately. Company-authored RFQs
    // retain the established DRAFT -> SUBMITTED -> OPEN workflow.
    if (isCustomerBuyer) settings.publishDate = new Date();
    assertInquiryDateWindow(settings.publishDate, settings.responseDeadline);

    const inquiry = await tx.inquiry.create({
      data: {
        title: data.title,
        description: data.description,
        companyId,
        buyerUserId,
        status: isCustomerBuyer ? 'OPEN' : 'DRAFT',
        ...settings,
        items: normalizeInquiryItems(data.items),
      },
      include: inquiryInclude,
    });

    if (isCustomerBuyer) {
      await notifyInquiryPublished(tx, inquiry);
    }
    return shapeInquiryForCaller(inquiry, caller);
  });
}

/**
 * Update the editable fields of an inquiry (phase 2 settings + title/description).
 *
 * Only the buyer's company (or SUPER_ADMIN) may edit, and only while the
 * RFQ has not yet closed. Items and status are managed by their own
 * dedicated endpoints and are intentionally not touched here.
 */
async function updateInquiry(inquiryId, data, caller) {
  const numericInquiryId = toPositiveInt(inquiryId, 'id');

  return prisma.$transaction(async (tx) => {
    const inquiry = await tx.inquiry.findUnique({ where: { id: numericInquiryId } });
    assertCanManageInquiry(inquiry, caller);

    if (['CLOSED', 'EXPIRED', 'COMPLETED', 'CANCELLED'].includes(inquiry.status)) {
      throw { statusCode: 400, code: 'INQUIRY_LOCKED', message: 'A closed RFQ can no longer be edited.' };
    }

    const updateData = buildInquirySettings(data, { partial: true });
    if (data.publishDate !== undefined || data.responseDeadline !== undefined) {
      assertInquiryDateWindow(
        updateData.publishDate !== undefined ? updateData.publishDate : inquiry.publishDate,
        updateData.responseDeadline !== undefined ? updateData.responseDeadline : inquiry.responseDeadline,
      );
    }
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;

    if (Object.keys(updateData).length === 0) {
      throw { statusCode: 400, code: 'NO_UPDATE_FIELDS', message: 'No updatable fields were provided.' };
    }

    const updated = await tx.inquiry.update({
      where: { id: numericInquiryId },
      data: updateData,
      include: inquiryInclude,
    });
    return shapeInquiryForCaller(updated, caller);
  });
}


async function changeInquiryStatus(inquiryId, nextStatus, caller, comment) {
  const numericInquiryId = toPositiveInt(inquiryId, 'id');
  const changedByUserId = assertAuthenticatedUser(caller);

  return prisma.$transaction(async (tx) => {
    const inquiry = await tx.inquiry.findUnique({ where: { id: numericInquiryId } });
    assertCanManageInquiry(inquiry, caller);

    if (caller?.accessType === 'CUSTOMER' && !isSuperAdmin(caller) && nextStatus !== 'CANCELLED') {
      throw { statusCode: 403, code: 'CUSTOMER_STATUS_RESTRICTED', message: 'Customers may only cancel their own inquiry.' };
    }

    if (nextStatus === 'OPEN' && inquiry.publishDate && new Date(inquiry.publishDate) > new Date()) {
      throw { statusCode: 400, code: 'PUBLISH_DATE_IN_FUTURE', message: 'This inquiry is scheduled for a future publish date.' };
    }

    assertInquiryTransition(inquiry.status, nextStatus);
    await validateInquiryReadyForStatus(numericInquiryId, nextStatus, tx);

    await tx.inquiryStatusHistory.create({
      data: {
        inquiryId: numericInquiryId,
        previousStatus: inquiry.status,
        newStatus: nextStatus,
        changedByUserId,
        comment,
      },
    });

    const updated = await tx.inquiry.update({
      where: { id: numericInquiryId },
      data: buildStatusTransitionData(nextStatus),
      include: inquiryInclude,
    });

    if (nextStatus === 'OPEN') {
      await notifyInquiryPublished(tx, updated);
    } else if (['CLOSED', 'EXPIRED', 'COMPLETED', 'CANCELLED'].includes(nextStatus)) {
      const context = { inquiry: { id: updated.id, title: updated.title }, status: nextStatus };
      await notifyInquiryOwner(tx, updated, 'INQUIRY_STATUS_CHANGED', context, `inquiry-status-${updated.id}-${nextStatus}-owner`);
      const responseCompanies = await tx.inquiryResponse.findMany({
        where: { inquiryId: updated.id, status: { not: 'WITHDRAWN' } },
        select: { companyId: true },
      });
      for (const companyId of [...new Set(responseCompanies.map((row) => Number(row.companyId)))]) {
        await dispatchNotification('INQUIRY_STATUS_CHANGED', { companyIds: [companyId] }, context, {
          tx,
          dedupeKey: (userId) => `inquiry-status-${updated.id}-${nextStatus}-company-${companyId}-${userId}`,
        });
      }
    }

    return shapeInquiryForCaller(updated, caller);
  });
}

async function revealInquiryResponses(inquiryId, caller) {
  const numericInquiryId = toPositiveInt(inquiryId, 'id');
  return prisma.$transaction(async (tx) => {
    const inquiry = await tx.inquiry.findUnique({ where: { id: numericInquiryId } });
    if (!inquiry) throw { statusCode: 404, code: 'INQUIRY_NOT_FOUND', message: 'درخواست یافت نشد.' };

    const isStaff = isStaffWithPermission(caller, 'leads.update', 'inquiries.update');
    if (!isInquiryBuyer(inquiry, caller) && !isStaff) {
      throw { statusCode: 404, code: 'INQUIRY_NOT_FOUND', message: 'درخواست یافت نشد.' };
    }
    if (!['SEALED', 'ANONYMOUS_SEALED'].includes(inquiry.visibilityMode)) {
      throw { statusCode: 400, code: 'INQUIRY_NOT_SEALED', message: 'Only sealed inquiries have a reveal step.' };
    }
    if (inquiry.revealedAt) return shapeInquiryForCaller(inquiry, caller);

    const deadlinePassed = inquiry.responseDeadline && new Date(inquiry.responseDeadline) <= new Date();
    const inquiryClosed = ['CLOSED', 'EXPIRED', 'COMPLETED', 'CANCELLED'].includes(inquiry.status);
    if (!isStaff && !inquiry.allowEarlyReveal && !deadlinePassed && !inquiryClosed) {
      throw { statusCode: 403, code: 'EARLY_REVEAL_DISABLED', message: 'Responses cannot be revealed before the deadline unless early reveal is enabled.' };
    }

    const updated = await tx.inquiry.update({
      where: { id: numericInquiryId },
      data: { revealedAt: new Date() },
      include: inquiryInclude,
    });
    return shapeInquiryForCaller(updated, caller);
  });
}

async function listInquiryItems(inquiryId, caller) {
  const numericInquiryId = toPositiveInt(inquiryId, 'id');
  const inquiry = await prisma.inquiry.findUnique({
    where: { id: numericInquiryId },
    select: { id: true, companyId: true, buyerUserId: true },
  });
  assertCanReadInquiry(inquiry, caller);

  return prisma.inquiryItem.findMany({
    where: { inquiryId: numericInquiryId },
    orderBy: { createdAt: 'asc' },
    include: inquiryInclude.items.include,
  });
}

async function addInquiryItem(inquiryId, data, caller) {
  const numericInquiryId = toPositiveInt(inquiryId, 'id');

  return prisma.$transaction(async (tx) => {
    const inquiry = await tx.inquiry.findUnique({ where: { id: numericInquiryId } });
    assertCanManageInquiryItems(inquiry, caller);
    await validateInquiryProduct(data, tx);

    return tx.inquiryItem.create({
      data: {
        inquiryId: numericInquiryId,
        ...normalizeInquiryItem(data),
      },
      include: inquiryInclude.items.include,
    });
  });
}

async function updateInquiryItem(inquiryId, itemId, data, caller) {
  const numericInquiryId = toPositiveInt(inquiryId, 'id');
  const numericItemId = toPositiveInt(itemId, 'itemId');

  return prisma.$transaction(async (tx) => {
    const inquiry = await tx.inquiry.findUnique({ where: { id: numericInquiryId } });
    assertCanManageInquiryItems(inquiry, caller);

    const item = await tx.inquiryItem.findFirst({ where: { id: numericItemId, inquiryId: numericInquiryId } });
    if (!item) throw { statusCode: 404, code: 'INQUIRY_ITEM_NOT_FOUND', message: 'RFQ item not found.' };

    if (data.productId !== undefined) {
      await validateInquiryProduct({ productId: data.productId, quantity: data.quantity ?? item.quantity }, tx);
    }

    return tx.inquiryItem.update({
      where: { id: numericItemId },
      data: normalizeInquiryItemUpdate(data),
      include: inquiryInclude.items.include,
    });
  });
}

async function deleteInquiryItem(inquiryId, itemId, caller) {
  const numericInquiryId = toPositiveInt(inquiryId, 'id');
  const numericItemId = toPositiveInt(itemId, 'itemId');

  return prisma.$transaction(async (tx) => {
    const inquiry = await tx.inquiry.findUnique({ where: { id: numericInquiryId } });
    assertCanManageInquiryItems(inquiry, caller);

    const itemCount = await tx.inquiryItem.count({ where: { inquiryId: numericInquiryId } });
    if (itemCount <= 1) {
      throw { statusCode: 400, code: 'INQUIRY_ITEM_REQUIRED', message: 'An RFQ must contain at least one item.' };
    }

    const item = await tx.inquiryItem.findFirst({ where: { id: numericItemId, inquiryId: numericInquiryId } });
    if (!item) throw { statusCode: 404, code: 'INQUIRY_ITEM_NOT_FOUND', message: 'RFQ item not found.' };

    return tx.inquiryItem.delete({ where: { id: numericItemId } });
  });
}

async function submitResponse(inquiryId, data, caller) {
  const companyId = resolveCompanyId(data, caller);
  ensureCompanyId(companyId);
  if (caller?.accessType === 'STAFF' && !isSuperAdmin(caller)) {
    throw { statusCode: 403, code: 'STAFF_CANNOT_RESPOND', message: 'STAFF users supervise inquiries but do not submit supplier quotes.' };
  }

  const numericInquiryId = toPositiveInt(inquiryId, 'id');

  return prisma.$transaction(async (tx) => {
    const inquiry = await tx.inquiry.findUnique({ where: { id: numericInquiryId } });
    assertInquiryAcceptsResponseChanges(inquiry);
    if (inquiry.companyId && inquiry.companyId === companyId) {
      throw { statusCode: 400, code: 'SELF_RESPONSE_NOT_ALLOWED', message: 'شرکت ایجادکننده درخواست نمی‌تواند به درخواست خود پاسخ دهد.' };
    }

    const ownedInquiryItemIds = await getOwnedInquiryItemIds(numericInquiryId, companyId, tx);
    if (ownedInquiryItemIds.size === 0) {
      throw { statusCode: 403, code: 'NO_OWNED_RFQ_ITEMS', message: 'Only companies owning requested products may respond.' };
    }
    validateResponseItemOwnership(data.items, ownedInquiryItemIds);

    await validateResponseSubmissionCapacity(companyId, tx);
    await consumeUsage({ ownerType: 'company', ownerId: companyId, usageType: 'RESPONSE_SUBMIT', referenceType: 'Inquiry', referenceId: numericInquiryId, tx });

    const response = await tx.inquiryResponse.create({
      data: {
        inquiryId: numericInquiryId,
        companyId,
        status: 'PENDING',
        items: normalizeResponseItems(data.items),
      },
      include: responseInclude,
    });

    await notifyInquiryOwner(tx, inquiry, 'INQUIRY_RESPONSE_RECEIVED', {
      inquiry: { id: inquiry.id, title: inquiry.title },
      response: { id: response.id },
    }, `inquiry-response-${response.id}`);

    return response;
  });
}


async function listInquiryMessages(inquiryId, caller) {
  const numericInquiryId = toPositiveInt(inquiryId, 'id');
  const inquiry = await prisma.inquiry.findUnique({ where: { id: numericInquiryId }, select: { id: true, companyId: true, buyerUserId: true } });
  if (!inquiry) throw { statusCode: 404, code: 'INQUIRY_NOT_FOUND', message: 'استعلام پیدا نشد.' };

  const isStaff = isStaffWithPermission(caller, 'leads.read', 'inquiries.read');
  const userId = caller?.accessType === 'CUSTOMER' ? assertAuthenticatedUser(caller) : null;
  const companyId = caller?.accessType === 'COMPANY' ? Number(caller.companyId) : null;
  const isBuyer = (userId && Number(inquiry.buyerUserId) === userId)
    || (companyId && Number(inquiry.companyId) === companyId);

  if (!isBuyer && !isStaff) {
    if (!Number.isInteger(companyId) || companyId < 1) {
      throw { statusCode: 404, code: 'INQUIRY_NOT_FOUND', message: 'استعلام پیدا نشد.' };
    }
    const response = await prisma.inquiryResponse.findFirst({ where: { inquiryId: numericInquiryId, companyId }, select: { id: true } });
    if (!response) throw { statusCode: 404, code: 'INQUIRY_NOT_FOUND', message: 'استعلام پیدا نشد.' };
  }

  const where = { inquiryId: numericInquiryId };
  if (!isStaff) {
    if (userId) where.OR = [{ senderUserId: userId }, { recipientUserId: userId }];
    else if (companyId) where.OR = [{ senderCompanyId: companyId }, { recipientCompanyId: companyId }];
  }
  const messages = await prisma.inquiryMessage.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    take: 500,
    include: {
      senderUser: { select: { id: true, phone: true, email: true, profile: { select: { firstName: true, lastName: true } } } },
      senderCompany: { select: { id: true, name: true } },
      recipientUser: { select: { id: true, phone: true, email: true } },
      recipientCompany: { select: { id: true, name: true } },
    },
  });
  if (!isStaff) {
    if (userId) await prisma.inquiryMessage.updateMany({ where: { inquiryId: numericInquiryId, recipientUserId: userId, readAt: null }, data: { readAt: new Date() } });
    else if (companyId) await prisma.inquiryMessage.updateMany({ where: { inquiryId: numericInquiryId, recipientCompanyId: companyId, readAt: null }, data: { readAt: new Date() } });
  }
  return messages;
}

async function sendInquiryMessage(inquiryId, data, caller) {
  const numericInquiryId = toPositiveInt(inquiryId, 'id');
  const message = typeof data?.message === 'string' ? data.message.trim() : '';
  if (!message || message.length > 5000) {
    throw { statusCode: 400, code: 'INVALID_INQUIRY_MESSAGE', message: 'متن پیام باید بین ۱ تا ۵۰۰۰ نویسه باشد.' };
  }
  if (!['CUSTOMER', 'COMPANY'].includes(caller?.accessType) || isSuperAdmin(caller)) {
    throw { statusCode: 403, code: 'INQUIRY_MESSAGE_ROLE_NOT_ALLOWED', message: 'این نوع حساب مجاز به ارسال پیام استعلام نیست.' };
  }

  return prisma.$transaction(async (tx) => {
    const inquiry = await tx.inquiry.findUnique({ where: { id: numericInquiryId }, select: { id: true, title: true, companyId: true, buyerUserId: true, status: true } });
    if (!inquiry) throw { statusCode: 404, code: 'INQUIRY_NOT_FOUND', message: 'استعلام پیدا نشد.' };
    if (['CANCELLED', 'COMPLETED', 'EXPIRED'].includes(inquiry.status)) {
      throw { statusCode: 409, code: 'INQUIRY_MESSAGES_CLOSED', message: 'پس از بسته‌شدن نهایی استعلام امکان ارسال پیام وجود ندارد.' };
    }

    const userId = caller.accessType === 'CUSTOMER' ? assertAuthenticatedUser(caller) : null;
    const companyId = caller.accessType === 'COMPANY' ? Number(caller.companyId) : null;
    if (caller.accessType === 'COMPANY' && (!Number.isInteger(companyId) || companyId < 1)) {
      throw { statusCode: 403, code: 'COMPANY_CONTEXT_REQUIRED', message: 'حساب شرکت معتبر نیست.' };
    }

    const isBuyer = (userId && Number(inquiry.buyerUserId) === userId)
      || (companyId && Number(inquiry.companyId) === companyId);
    let recipientUserId = null;
    let recipientCompanyId = null;
    let senderUserId = null;
    let senderCompanyId = null;

    if (isBuyer) {
      recipientCompanyId = Number(data.recipientCompanyId);
      if (!Number.isInteger(recipientCompanyId) || recipientCompanyId < 1) {
        throw { statusCode: 400, code: 'RECIPIENT_COMPANY_REQUIRED', message: 'برای ارسال پیام، شرکت پاسخ‌دهنده را انتخاب کنید.' };
      }
      const response = await tx.inquiryResponse.findFirst({
        where: { inquiryId: numericInquiryId, companyId: recipientCompanyId },
        select: { id: true },
      });
      if (!response) throw { statusCode: 404, code: 'INQUIRY_RECIPIENT_NOT_FOUND', message: 'این شرکت برای استعلام پاسخ ثبت نکرده است.' };
      if (userId) senderUserId = userId;
      else senderCompanyId = companyId;
    } else {
      if (!companyId) throw { statusCode: 404, code: 'INQUIRY_NOT_FOUND', message: 'استعلام پیدا نشد.' };
      const response = await tx.inquiryResponse.findFirst({
        where: { inquiryId: numericInquiryId, companyId },
        select: { id: true },
      });
      if (!response) throw { statusCode: 404, code: 'INQUIRY_NOT_FOUND', message: 'استعلام پیدا نشد.' };
      if (inquiry.buyerUserId) recipientUserId = inquiry.buyerUserId;
      else if (inquiry.companyId) recipientCompanyId = inquiry.companyId;
      else throw { statusCode: 409, code: 'INQUIRY_BUYER_MISSING', message: 'مالک استعلام مشخص نیست.' };
      senderCompanyId = companyId;
    }

    const ownerType = senderUserId ? 'user' : 'company';
    const ownerId = senderUserId || senderCompanyId;
    await consumeUsage({
      ownerType, ownerId, usageType: 'INTERNAL_MESSAGE',
      referenceType: 'Inquiry', referenceId: numericInquiryId, tx,
    });
    const createdMessage = await tx.inquiryMessage.create({
      data: { inquiryId: numericInquiryId, senderUserId, senderCompanyId, recipientUserId, recipientCompanyId, body: message },
      include: {
        senderUser: { select: { id: true, phone: true, email: true } },
        senderCompany: { select: { id: true, name: true } },
        recipientUser: { select: { id: true, phone: true, email: true } },
        recipientCompany: { select: { id: true, name: true, phone: true } },
      },
    });
    let smsQueued = false;
    let smsSkippedReason = null;
    if (data.notifyBySms === true) {
      const recipient = recipientUserId
        ? await tx.user.findUnique({ where: { id: recipientUserId }, select: { id: true, phone: true } })
        : await tx.company.findUnique({ where: { id: recipientCompanyId }, select: { phone: true } });
      const phone = String(recipient?.phone || '').trim();
      if (!phone) throw { statusCode: 422, code: 'SMS_RECIPIENT_PHONE_MISSING', message: 'برای گیرنده شماره تلفن ثبت نشده است.' };
      let deliveryUserId = recipientUserId;
      if (!deliveryUserId) {
        const companyMember = await tx.user.findFirst({
          where: { status: 'ACTIVE', accessProfile: { companyId: recipientCompanyId } },
          select: { id: true },
        });
        deliveryUserId = companyMember?.id;
      }
      if (!deliveryUserId) throw { statusCode: 422, code: 'SMS_RECIPIENT_ACCOUNT_MISSING', message: 'برای گیرنده شرکت، حساب کاربری فعالی جهت ثبت وضعیت پیامک پیدا نشد.' };
      const preference = await tx.notificationPreference.findUnique({
        where: { userId_eventType_channel: { userId: deliveryUserId, eventType: 'INQUIRY_MESSAGE_RECEIVED', channel: 'SMS' } },
        select: { enabled: true },
      });
      // Missing preference means the event default applies (SMS is opt-in only).
      if (preference?.enabled !== true) {
        smsSkippedReason = 'recipient_sms_opted_out';
      } else {
        // Validate provider config before queuing; the actual SMS is sent by the
        // outbox worker after this transaction commits.
        getInquirySmsGatewayConfig();
        await consumeUsage({
          ownerType, ownerId, usageType: 'SMS', referenceType: 'InquiryMessage',
          referenceId: createdMessage.id, forceEnforcement: true, tx,
        });
        await tx.notificationDelivery.create({
          data: {
            userId: deliveryUserId,
            eventType: 'INQUIRY_MESSAGE_RECEIVED',
            channel: 'SMS',
            status: 'PENDING',
            recipient: phone,
            subject: null,
            body: `پیام جدیدی درباره استعلام «${String(inquiry.title || '').slice(0, 100)}» دریافت کرده‌اید. وارد سامانه شوید تا آن را بخوانید.`,
            attempts: 0,
            maxAttempts: 3,
            nextAttemptAt: new Date(),
            dedupeKey: `inquiry-message-${createdMessage.id}-sms`,
            updatedAt: new Date(),
          },
        });
        smsQueued = true;
      }
    }
    return { ...createdMessage, smsQueued, smsSkippedReason };
  }, { maxWait: 5000, timeout: 12000 });
}

async function listResponses(inquiryId, caller) {
  const numericInquiryId = toPositiveInt(inquiryId, 'id');
  const inquiry = await prisma.inquiry.findUnique({
    where: { id: numericInquiryId },
    select: {
      id: true,
      companyId: true,
      buyerUserId: true,
      visibilityMode: true,
      status: true,
      publishDate: true,
      revealedAt: true,
      responseDeadline: true,
      allowEarlyReveal: true,
      items: { select: { product: { select: { companyId: true } } } },
    },
  });
  assertCanReadResponses(inquiry, caller);

  const isBuyer = isInquiryBuyer(inquiry, caller);
  const isStaff = isStaffWithPermission(caller, 'leads.read', 'inquiries.read');
  if (isBuyer && ['SEALED', 'ANONYMOUS_SEALED'].includes(inquiry.visibilityMode) && !areResponsesRevealed(inquiry)) {
    return [];
  }

  const callerCompanyId = Number(caller?.companyId) || null;
  const where = { inquiryId: numericInquiryId };
  if (!isBuyer && !isStaff) {
    where.companyId = callerCompanyId;
  }

  const responses = await prisma.inquiryResponse.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    include: responseInclude,
  });

  if (isBuyer && inquiry.visibilityMode === 'ANONYMOUS_SEALED' && areResponsesRevealed(inquiry) && !isStaff) {
    return responses.map((response, index) => {
      const safe = { ...response, company: { name: `پیشنهاددهنده ${index + 1}`, type: null } };
      delete safe.companyId;
      safe.items = (response.items || []).map((item) => {
        const safeItem = { ...item };
        if (safeItem.inquiryItem?.product) {
          safeItem.inquiryItem = {
            ...safeItem.inquiryItem,
            product: { ...safeItem.inquiryItem.product },
          };
          delete safeItem.inquiryItem.product.companyId;
        }
        return safeItem;
      });
      return safe;
    });
  }
  return responses;
}

async function updateResponse(inquiryId, responseId, data, caller) {
  const numericInquiryId = toPositiveInt(inquiryId, 'id');
  const numericResponseId = toPositiveInt(responseId, 'responseId');
  const companyId = resolveCompanyId(data, caller);
  ensureCompanyId(companyId);

  return prisma.$transaction(async (tx) => {
    const inquiry = await tx.inquiry.findUnique({ where: { id: numericInquiryId } });
    assertResponseEditable(inquiry);

    const response = await tx.inquiryResponse.findFirst({
      where: { id: numericResponseId, inquiryId: numericInquiryId, companyId },
      select: { id: true, status: true },
    });
    if (!response) {
      throw { statusCode: 404, code: 'RESPONSE_NOT_FOUND', message: 'Response not found.' };
    }
    if (response.status !== 'PENDING') {
      throw { statusCode: 400, code: 'RESPONSE_LOCKED', message: 'Only pending responses can be edited.' };
    }

    const ownedInquiryItemIds = await getOwnedInquiryItemIds(numericInquiryId, companyId, tx);
    validateResponseItemOwnership(data.items, ownedInquiryItemIds);

    await tx.inquiryResponseItem.deleteMany({ where: { responseId: numericResponseId } });

    return tx.inquiryResponse.update({
      where: { id: numericResponseId },
      data: {
        items: normalizeResponseItems(data.items),
      },
      include: {
        inquiry: true,
        ...responseInclude,
      },
    });
  });
}

/**
 * Withdraw a pending response. The RFQ must allow withdrawal, still be open
 * and before the deadline. Withdrawn responses are kept for audit (status
 * = WITHDRAWN, withdrawnAt set) rather than deleted.
 */
async function decideResponse(inquiryId, responseId, decision, caller, comment) {
  const numericInquiryId = toPositiveInt(inquiryId, 'id');
  const numericResponseId = toPositiveInt(responseId, 'responseId');
  if (!['SELECTED', 'REJECTED'].includes(decision)) {
    throw { statusCode: 400, code: 'INVALID_RESPONSE_DECISION', message: 'Decision must be SELECTED or REJECTED.' };
  }

  return prisma.$transaction(async (tx) => {
    const inquiry = await tx.inquiry.findUnique({ where: { id: numericInquiryId } });
    if (!inquiry) throw { statusCode: 404, code: 'INQUIRY_NOT_FOUND', message: 'درخواست یافت نشد.' };
    assertCanManageInquiry(inquiry, caller);
    if (!isInquiryBuyer(inquiry, caller)) {
      throw { statusCode: 403, code: 'BUYER_DECISION_REQUIRED', message: 'Only the inquiry buyer may decide supplier responses.' };
    }
    if (inquiry.status !== 'OPEN') {
      throw { statusCode: 400, code: 'INQUIRY_NOT_OPEN', message: 'Only responses to an open inquiry can be decided.' };
    }
    if (['SEALED', 'ANONYMOUS_SEALED'].includes(inquiry.visibilityMode) && !areResponsesRevealed(inquiry)) {
      throw { statusCode: 403, code: 'RESPONSES_NOT_REVEALED', message: 'Reveal sealed responses before deciding on a supplier.' };
    }

    const response = await tx.inquiryResponse.findFirst({
      where: { id: numericResponseId, inquiryId: numericInquiryId },
      select: { id: true, companyId: true, status: true },
    });
    if (!response) throw { statusCode: 404, code: 'RESPONSE_NOT_FOUND', message: 'Response not found.' };
    if (response.status !== 'PENDING') {
      throw { statusCode: 400, code: 'RESPONSE_ALREADY_DECIDED', message: 'Only pending responses can be decided.' };
    }

    if (decision === 'REJECTED') {
      const rejected = await tx.inquiryResponse.update({
        where: { id: numericResponseId },
        data: { status: 'REJECTED' },
        include: responseInclude,
      });
      await dispatchNotification('INQUIRY_RESPONSE_REJECTED', { companyIds: [response.companyId] }, {
        inquiry: { id: inquiry.id, title: inquiry.title },
        response: { id: response.id },
      }, { tx, dedupeKey: (userId) => `inquiry-response-rejected-${response.id}-${userId}` });
      // Decision endpoints return a minimal receipt only; never echo supplier identity
      // into buyer-facing responses for ANONYMOUS_SEALED inquiries.
      return { id: rejected.id, inquiryId: numericInquiryId, status: rejected.status };
    }

    const now = new Date();
    const closeResult = await tx.inquiry.updateMany({
      where: { id: numericInquiryId, status: 'OPEN' },
      data: { status: 'CLOSED', closedAt: now },
    });
    if (!closeResult.count) {
      throw { statusCode: 409, code: 'INQUIRY_ALREADY_CLOSED', message: 'This inquiry has already been closed or decided.' };
    }

    const losers = await tx.inquiryResponse.findMany({
      where: { inquiryId: numericInquiryId, status: 'PENDING', id: { not: numericResponseId } },
      select: { id: true, companyId: true },
    });
    await tx.inquiryResponse.update({
      where: { id: numericResponseId },
      data: { status: 'SELECTED' },
    });
    if (losers.length) {
      await tx.inquiryResponse.updateMany({
        where: { inquiryId: numericInquiryId, status: 'PENDING', id: { not: numericResponseId } },
        data: { status: 'REJECTED' },
      });
    }

    await tx.inquiryStatusHistory.create({
      data: {
        inquiryId: numericInquiryId,
        previousStatus: 'OPEN',
        newStatus: 'CLOSED',
        changedByUserId: assertAuthenticatedUser(caller),
        source: 'USER',
        comment: comment || 'Supplier response selected; other pending responses were rejected.',
      },
    });

    const selectedResponse = await tx.inquiryResponse.findFirst({
      where: { id: numericResponseId, inquiryId: numericInquiryId },
      include: responseInclude,
    });
    await dispatchNotification('INQUIRY_RESPONSE_SELECTED', { companyIds: [response.companyId] }, {
      inquiry: { id: inquiry.id, title: inquiry.title },
      response: { id: response.id },
    }, { tx, dedupeKey: (userId) => `inquiry-response-selected-${response.id}-${userId}` });

    for (const loser of losers) {
      await dispatchNotification('INQUIRY_RESPONSE_AUTO_REJECTED', { companyIds: [loser.companyId] }, {
        inquiry: { id: inquiry.id, title: inquiry.title },
        company: { id: loser.companyId },
      }, { tx, dedupeKey: (userId) => `inquiry-response-auto-rejected-${loser.id}-${userId}` });
    }

    await notifyInquiryOwner(tx, inquiry, 'INQUIRY_STATUS_CHANGED', {
      inquiry: { id: inquiry.id, title: inquiry.title },
      status: 'CLOSED',
    }, `inquiry-status-${inquiry.id}-CLOSED-owner`);

    return {
      id: selectedResponse.id,
      inquiryId: numericInquiryId,
      status: selectedResponse.status,
    };
  });
}

async function withdrawResponse(inquiryId, responseId, caller, data = {}) {
  const numericInquiryId = toPositiveInt(inquiryId, 'id');
  const numericResponseId = toPositiveInt(responseId, 'responseId');
  const companyId = resolveCompanyId(data, caller);
  ensureCompanyId(companyId);

  return prisma.$transaction(async (tx) => {
    const inquiry = await tx.inquiry.findUnique({ where: { id: numericInquiryId } });
    assertResponseWithdrawable(inquiry);

    const response = await tx.inquiryResponse.findFirst({
      where: { id: numericResponseId, inquiryId: numericInquiryId, companyId },
      select: { id: true, status: true },
    });
    if (!response) {
      throw { statusCode: 404, code: 'RESPONSE_NOT_FOUND', message: 'Response not found.' };
    }
    if (response.status === 'WITHDRAWN') {
      throw { statusCode: 400, code: 'RESPONSE_ALREADY_WITHDRAWN', message: 'Response has already been withdrawn.' };
    }
    if (response.status !== 'PENDING') {
      throw { statusCode: 400, code: 'RESPONSE_LOCKED', message: 'Only pending responses can be withdrawn.' };
    }

    return tx.inquiryResponse.update({
      where: { id: numericResponseId },
      data: { status: 'WITHDRAWN', withdrawnAt: new Date() },
      include: responseInclude,
    });
  });
}

/**
 * Resolve a response the caller is allowed to attach files to, enforcing
 * ownership and the RFQ's edit rules. Returns the response id + companyId.
 */
async function resolveOwnedEditableResponse(inquiryId, responseId, caller, data = {}) {
  const numericInquiryId = toPositiveInt(inquiryId, 'id');
  const numericResponseId = toPositiveInt(responseId, 'responseId');
  const companyId = resolveCompanyId(data, caller);
  ensureCompanyId(companyId);

  const inquiry = await prisma.inquiry.findUnique({ where: { id: numericInquiryId } });
  assertResponseEditable(inquiry);

  const response = await prisma.inquiryResponse.findFirst({
    where: { id: numericResponseId, inquiryId: numericInquiryId, companyId },
    select: { id: true, status: true },
  });
  if (!response) {
    throw { statusCode: 404, code: 'RESPONSE_NOT_FOUND', message: 'Response not found.' };
  }
  if (response.status !== 'PENDING') {
    throw { statusCode: 400, code: 'RESPONSE_LOCKED', message: 'Attachments can only be changed on pending responses.' };
  }

  return { responseId: numericResponseId, companyId };
}

/**
 * Upload a file attachment to a response. Enforces ownership, RFQ edit
 * rules, a per-response attachment cap, and file type/size limits.
 * `file` is the @fastify/multipart file object.
 */
async function uploadResponseAttachment(inquiryId, responseId, file, caller) {
  const { responseId: numericResponseId } = await resolveOwnedEditableResponse(inquiryId, responseId, caller);

  const existingCount = await prisma.inquiryResponseAttachment.count({ where: { responseId: numericResponseId } });
  if (existingCount >= MAX_RESPONSE_ATTACHMENTS) {
    throw { statusCode: 400, code: 'ATTACHMENT_LIMIT_REACHED', message: `A response may have at most ${MAX_RESPONSE_ATTACHMENTS} attachments.` };
  }

  const stored = await saveResponseAttachment(file);

  try {
    return await prisma.inquiryResponseAttachment.create({
      data: {
        responseId: numericResponseId,
        url: stored.url,
        filename: stored.filename,
        mimetype: stored.mimetype,
        size: stored.size,
      },
    });
  } catch (error) {
    await removeStoredAttachment(stored.url);
    throw error;
  }
}

/**
 * Delete a response attachment (file + DB row). Enforces ownership and the
 * RFQ edit rules.
 */
async function deleteResponseAttachment(inquiryId, responseId, attachmentId, caller) {
  const numericAttachmentId = toPositiveInt(attachmentId, 'attachmentId');
  const { responseId: numericResponseId } = await resolveOwnedEditableResponse(inquiryId, responseId, caller);

  const attachment = await prisma.inquiryResponseAttachment.findFirst({
    where: { id: numericAttachmentId, responseId: numericResponseId },
  });
  if (!attachment) {
    throw { statusCode: 404, code: 'ATTACHMENT_NOT_FOUND', message: 'Attachment not found.' };
  }

  await prisma.inquiryResponseAttachment.delete({ where: { id: numericAttachmentId } });
  await removeStoredAttachment(attachment.url);
  return { id: numericAttachmentId };
}

/**
 * Aggregate dashboard statistics scoped to the caller's company
 * (SUPER_ADMIN sees platform-wide figures). Every figure is a live
 * count/query — nothing is fabricated.
 */
async function getInquiryStats(caller) {
  const superAdmin = isSuperAdmin(caller);
  const companyId = Number(caller?.companyId) || null;
  const customerUserId = Number(caller?.id) || null;
  const isCustomer = caller?.accessType === 'CUSTOMER' && !superAdmin;
  if (!superAdmin && !isCustomer) ensureCompanyId(companyId);
  if (isCustomer && !customerUserId) {
    throw { statusCode: 401, code: 'UNAUTHORIZED', message: 'Authenticated user is required.' };
  }

  const sentWhere = superAdmin ? {} : isCustomer ? { buyerUserId: customerUserId } : { companyId };
  const receivedWhere = superAdmin ? {} : isCustomer
    ? { id: { in: [] } }
    : { items: { some: { product: { companyId } } } };
  const responsesWhere = superAdmin ? {} : isCustomer
    ? { inquiry: { buyerUserId: customerUserId } }
    : { companyId };

  const groupToMap = (grouped) =>
    grouped.reduce((acc, row) => {
      acc[row.status] = row._count._all;
      return acc;
    }, {});

  const [
    sentGrouped,
    receivedGrouped,
    sentTotal,
    receivedTotal,
    responsesTotal,
    responsesGrouped,
    recentInquiries,
    recentResponses,
  ] = await Promise.all([
    prisma.inquiry.groupBy({ by: ['status'], where: sentWhere, _count: { _all: true } }),
    prisma.inquiry.groupBy({ by: ['status'], where: receivedWhere, _count: { _all: true } }),
    prisma.inquiry.count({ where: sentWhere }),
    prisma.inquiry.count({ where: receivedWhere }),
    prisma.inquiryResponse.count({ where: responsesWhere }),
    prisma.inquiryResponse.groupBy({ by: ['status'], where: responsesWhere, _count: { _all: true } }),
    prisma.inquiry.findMany({
      where: sentWhere,
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        _count: { select: { items: true, responses: true } },
      },
    }),
    prisma.inquiryResponse.findMany({
      where: responsesWhere,
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        status: true,
        createdAt: true,
        company: { select: { id: true, name: true } },
        inquiry: { select: { id: true, title: true, status: true, visibilityMode: true, revealedAt: true, responseDeadline: true } },
        _count: { select: { items: true } },
      },
    }),
  ]);

  const sentByStatus = groupToMap(sentGrouped);
  const receivedByStatus = groupToMap(receivedGrouped);
  const responseByStatus = groupToMap(responsesGrouped);

  // Success rate = selected / decided (selected + rejected); pending quotes
  // are excluded so they don't unfairly drag the rate down.
  const selected = responseByStatus.SELECTED || 0;
  const decided = selected + (responseByStatus.REJECTED || 0);
  const successRate = decided > 0 ? Math.round((selected / decided) * 100) : 0;

  return {
    sent: { total: sentTotal, byStatus: sentByStatus },
    received: {
      total: receivedTotal,
      byStatus: receivedByStatus,
      new: receivedByStatus.OPEN || 0,
      closed: (receivedByStatus.CLOSED || 0) + (receivedByStatus.COMPLETED || 0),
    },
    responses: {
      total: responsesTotal,
      byStatus: responseByStatus,
      awaiting: responseByStatus.PENDING || 0,
      selected,
      successRate,
    },
    recentInquiries: recentInquiries.map((inquiry) => {
      const safe = { ...inquiry };
      delete safe.buyerUserId;
      return safe;
    }),
    recentResponses: isCustomer
      ? recentResponses.filter((response) => {
          const inquiry = response.inquiry || {};
          if (['SEALED', 'ANONYMOUS_SEALED'].includes(inquiry.visibilityMode) && !areResponsesRevealed(inquiry)) return false;
          if (inquiry.visibilityMode === 'ANONYMOUS_SEALED') {
            response.company = { name: 'پیشنهاددهنده' };
          }
          return true;
        })
      : recentResponses,
  };
}

module.exports = {
  listInquiries,
  getInquiry,
  createInquiry,
  updateInquiry,
  changeInquiryStatus,
  revealInquiryResponses,
  getInquiryStats,


  listInquiryItems,

  addInquiryItem,
  updateInquiryItem,
  deleteInquiryItem,
  submitResponse,
  listResponses,
  listInquiryMessages,
  sendInquiryMessage,
  updateResponse,
  decideResponse,
  withdrawResponse,
  uploadResponseAttachment,
  deleteResponseAttachment,
};


