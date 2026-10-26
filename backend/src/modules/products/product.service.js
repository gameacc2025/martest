const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');
const prisma = require('../../config/db');
const { SUPER_ADMIN_ROLE } = require('../../utils/rbac');

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const SUPPORTED_DOCUMENT_TYPES = new Set(['application/pdf']);
const SUPPORTED_DOCUMENT_ENUMS = new Set(['DATASHEET', 'CATALOG', 'MANUAL', 'CERTIFICATE']);
const UPLOAD_ROOT = path.join(process.cwd(), 'uploads', 'products');

// ── Review-on-edit policy ──────────────────────────────────────
// Company users may edit post-approval products (APPROVED / PUBLISHED /
// HIDDEN). Each edit increments Product.editsSinceApproval; at the system-
// configured threshold (SystemSetting 'catalog.productReviewEditThreshold',
// default 5) the product is automatically sent back to PENDING_REVIEW and the
// counter resets. Below the threshold the product keeps its current status.
const REVIEW_EDIT_THRESHOLD_KEY = 'catalog.productReviewEditThreshold';
const DEFAULT_REVIEW_EDIT_THRESHOLD = 5;
const POST_APPROVAL_STATUSES = new Set(['APPROVED', 'PUBLISHED', 'HIDDEN']);

// The `specifications` JSON has exactly two top-level keys:
//   - `standard`:   an object of template-driven values keyed by field.key
//   - `attributes`: an array of user-defined { fieldId, title, value } entries
//                   (fieldId = existing SpecificationField id, or null if new)
const STANDARD_KEY = 'standard';
const ATTRIBUTES_KEY = 'attributes';
const ALLOWED_SPEC_KEYS = new Set([STANDARD_KEY, ATTRIBUTES_KEY]);
const MAX_ATTRIBUTES = 20;
const MAX_ATTR_TITLE_LEN = 100;
const MAX_ATTR_VALUE_LEN = 500;

// Category, Subcategory, Brand and Model are PRODUCT CORE columns. They must
// never be duplicated inside the specifications JSON (neither as a standard
// key nor as a user-defined attribute). This mirrors the frontend's
// productReservedSpecificationKeys config so both layers stay in sync.
const RESERVED_SPEC_TITLES = new Set(
  ['brand', 'model', 'category', 'subcategory', 'برند', 'مدل', 'دسته بندی', 'زیردسته', 'زیر دسته']
);

function normalizeReservedTitle(value) {
  return String(value ?? '')
    .replace(/\u200c/g, ' ') // ZWNJ → space
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function isReservedSpecTitle(value) {
  return RESERVED_SPEC_TITLES.has(normalizeReservedTitle(value));
}




// پیاده‌سازی: transition های وضعیت محصول
const TRANSITIONS = {
  submitReview: { from: ['DRAFT', 'REJECTED'], to: 'PENDING_REVIEW' },
  approve: { from: ['PENDING_REVIEW'], to: 'APPROVED' },
  reject: { from: ['PENDING_REVIEW'], to: 'REJECTED' },
  publish: { from: ['APPROVED', 'HIDDEN'], to: 'PUBLISHED' },
  hide: { from: ['PUBLISHED'], to: 'HIDDEN' },
  archive: { from: ['DRAFT', 'REJECTED', 'APPROVED', 'PUBLISHED', 'HIDDEN'], to: 'ARCHIVED' },
  restoreDraft: { from: ['PENDING_REVIEW', 'APPROVED', 'REJECTED', 'HIDDEN', 'ARCHIVED'], to: 'DRAFT' },
};

const productInclude = {
  company: { select: { id: true, name: true, type: true } },
  category: { select: { id: true, nameFa: true, nameEn: true, slug: true } },
  subcategory: { select: { id: true, nameFa: true, nameEn: true, slug: true } },
  prices: { orderBy: [{ minQuantity: 'asc' }, { createdAt: 'asc' }] },
  images: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
  documents: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
  statusHistory: { orderBy: { createdAt: 'desc' }, take: 10, include: { changedBy: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } } } },
};


function isSuperAdmin(caller) {
  return caller?.roles?.includes(SUPER_ADMIN_ROLE) || caller?.permissions?.includes('*');
}

function isStaffUser(caller) {
  return caller?.accessType === 'STAFF' && !isSuperAdmin(caller);
}

function isCompanyUser(caller) {
  // STAFF moderators are cross-company readers; a companyId claim must not
  // silently turn them into tenant-scoped COMPANY users. CUSTOMER is never a
  // management caller even if an unexpected companyId claim is present.
  const accessType = caller?.accessType;
  return (accessType === 'COMPANY' || accessType === undefined || accessType === null)
    && Boolean(caller?.companyId)
    && !isSuperAdmin(caller);
}

function assertCanReadProduct(product, caller) {
  if (isSuperAdmin(caller)) return;
  if (!caller || !Array.isArray(caller.permissions) || !caller.permissions.includes('products.read')) {
    throw { statusCode: 403, code: 'FORBIDDEN', message: 'Permission products.read is required.' };
  }
  if (caller.accessType === 'COMPANY' || (caller.accessType === undefined && isCompanyUser(caller))) {
    if (!caller.companyId || Number(product.companyId) !== Number(caller.companyId)) {
      // Keep cross-tenant product IDs indistinguishable from missing products.
      throw { statusCode: 404, code: 'PRODUCT_NOT_FOUND', message: 'Product not found.' };
    }
    return;
  }
  if (caller.accessType === 'STAFF') return;
  throw { statusCode: 403, code: 'FORBIDDEN', message: 'Only STAFF and COMPANY users can read managed product data.' };
}

function toPositiveInt(value, field) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw { statusCode: 400, code: 'VALIDATION_ERROR', message: `${field} must be a positive integer.` };
  }
  return parsed;
}

function ensurePlainObject(value, field) {
  if (value === undefined || value === null) return;
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw { statusCode: 400, code: 'INVALID_SPECIFICATIONS', message: `${field} must be an object.` };
  }
}

function parseMultipartField(file, fieldName) {
  const field = file?.fields?.[fieldName];
  return field && typeof field === 'object' && 'value' in field ? field.value : undefined;
}

function parseOptionalBoolean(value) {
  if (value === undefined) return undefined;
  if (value === true || value === 'true' || value === '1') return true;
  if (value === false || value === 'false' || value === '0') return false;
  throw { statusCode: 400, code: 'INVALID_BOOLEAN', message: 'Boolean field is invalid.' };
}

function parseOptionalSortOrder(value) {
  if (value === undefined || value === '') return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw { statusCode: 400, code: 'INVALID_SORT_ORDER', message: 'sortOrder must be a non-negative integer.' };
  }
  return parsed;
}

function sanitizeFilename(filename) {
  const ext = path.extname(filename || '').toLowerCase();
  const basename = path.basename(filename || 'file', ext).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 60) || 'file';
  return `${Date.now()}-${crypto.randomBytes(8).toString('hex')}-${basename}${ext}`;
}

function assertUploadedFile(file) {
  if (!file) throw { statusCode: 400, code: 'FILE_REQUIRED', message: 'A file upload is required.' };
}

function assertFileType(file, allowedTypes, allowedExtensions, code) {
  const ext = path.extname(file.filename || '').toLowerCase();
  if (!allowedTypes.has(file.mimetype) || !allowedExtensions.includes(ext)) {
    throw { statusCode: 400, code, message: `Unsupported file type: ${file.mimetype || ext}.` };
  }
}

async function saveUploadedFile(file, folder, maxBytes) {
  const uploadDir = path.join(UPLOAD_ROOT, folder);
  await fs.promises.mkdir(uploadDir, { recursive: true });

  const filename = sanitizeFilename(file.filename);
  const destination = path.join(uploadDir, filename);
  let bytesWritten = 0;

  file.file.on('data', (chunk) => {
    bytesWritten += chunk.length;
    if (bytesWritten > maxBytes) file.file.destroy(Object.assign(new Error('File too large'), { statusCode: 413 }));
  });

  try {
    await pipeline(file.file, fs.createWriteStream(destination));
  } catch (error) {
    await fs.promises.rm(destination, { force: true }).catch(() => {});
    throw { statusCode: error.statusCode || 413, code: 'FILE_TOO_LARGE', message: 'Uploaded file exceeds the allowed size.' };
  }

  return {
    url: `/uploads/products/${folder}/${filename}`,
    bytes: bytesWritten,
  };
}

async function removeStoredFile(url) {
  if (!url || !url.startsWith('/uploads/products/')) return;
  const relativePath = url.replace(/^\/uploads\/products\//, '');
  const filePath = path.join(UPLOAD_ROOT, relativePath);
  await fs.promises.rm(filePath, { force: true }).catch(() => {});
}

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'product';
}

async function buildUniqueSlug(title, existingId) {
  const base = slugify(title);
  let candidate = base;
  let suffix = 1;

  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing || existing.id === existingId) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

async function ensureCategoryExists(categoryId) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true, status: true },
  });
  if (!category) throw { statusCode: 400, code: 'CATEGORY_NOT_FOUND', message: 'Category not found.' };
  if (category.status !== 'ACTIVE') throw { statusCode: 400, code: 'CATEGORY_INACTIVE', message: 'Category is not active.' };
  return category;
}

/**
 * Validate that a subcategory exists, is active, and belongs to the given category.
 * Returns the subcategory including its specification template (used for spec validation).
 * @param {number} subcategoryId
 * @param {number} categoryId - the category the subcategory must belong to
 */
async function ensureSubcategoryExists(subcategoryId, categoryId) {
  const subcategory = await prisma.subcategory.findUnique({
    where: { id: subcategoryId },
    select: {
      id: true,
      categoryId: true,
      status: true,
      specificationTemplate: {
        select: {
          isActive: true,
          fields: { orderBy: { sortOrder: 'asc' } },
        },
      },
    },
  });
  if (!subcategory) throw { statusCode: 400, code: 'SUBCATEGORY_NOT_FOUND', message: 'Subcategory not found.' };
  if (subcategory.status !== 'ACTIVE') throw { statusCode: 400, code: 'SUBCATEGORY_INACTIVE', message: 'Subcategory is not active.' };
  if (subcategory.categoryId !== Number(categoryId)) {
    throw { statusCode: 400, code: 'SUBCATEGORY_CATEGORY_MISMATCH', message: 'Subcategory does not belong to the selected category.' };
  }
  return subcategory;
}


async function ensureCompanyExists(companyId) {
  const company = await prisma.company.findFirst({ where: { id: companyId, deletedAt: null }, select: { id: true } });
  if (!company) throw { statusCode: 400, code: 'COMPANY_NOT_FOUND', message: 'Company not found.' };
}

function resolveCompanyId(data, caller) {
  if (isSuperAdmin(caller)) {
    if (data.companyId) return toPositiveInt(data.companyId, 'companyId');
    if (caller?.companyId) return toPositiveInt(caller.companyId, 'companyId');
    throw { statusCode: 400, code: 'COMPANY_REQUIRED', message: 'companyId is required when creating a product.' };
  }
  if (!caller?.companyId) throw { statusCode: 400, code: 'COMPANY_REQUIRED', message: 'Authenticated user must belong to a company.' };
  if (data.companyId && Number(data.companyId) !== Number(caller.companyId)) {
    throw { statusCode: 403, code: 'FORBIDDEN', message: 'Company users can only manage their own products.' };
  }
  return Number(caller.companyId);
}

function assertCanManageProduct(product, caller) {
  if (isSuperAdmin(caller)) return;
  if (!product || product.companyId !== Number(caller?.companyId)) {
    throw { statusCode: 403, code: 'FORBIDDEN', message: 'Company users can only manage their own products.' };
  }
}

function assertCompanyCanEdit(product, caller) {
  assertCanManageProduct(product, caller);
  // Post-approval products (APPROVED / PUBLISHED / HIDDEN) ARE editable now —
  // the review-threshold policy in updateProduct decides whether that edit
  // sends the product back to PENDING_REVIEW. Only products mid-review or
  // archived are locked for company users.
  if (isCompanyUser(caller) && (product.status === 'PENDING_REVIEW' || product.status === 'ARCHIVED')) {
    throw { statusCode: 403, code: 'PRODUCT_NOT_EDITABLE', message: 'Company users cannot edit products that are pending review or archived.' };
  }
}

function isPostApprovalStatus(status) {
  return POST_APPROVAL_STATUSES.has(status);
}

/**
 * Read the admin-configurable "edits before re-review" threshold.
 * Falls back to DEFAULT_REVIEW_EDIT_THRESHOLD when the SystemSetting is
 * missing or invalid. Uses the passed `tx` so it can run inside a transaction.
 */
async function getReviewEditThreshold(tx = prisma) {
  const setting = await tx.systemSetting.findUnique({ where: { key: REVIEW_EDIT_THRESHOLD_KEY }, select: { value: true } });
  const parsed = setting ? Number(setting.value) : NaN;
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : DEFAULT_REVIEW_EDIT_THRESHOLD;
}

/**
 * Decide the effect of a company edit on a post-approval product.
 * Returns { nextStatus, editsSinceApproval, crossedThreshold, threshold }.
 * - qty < threshold  → keep status, increment the counter
 * - qty >= threshold → back to PENDING_REVIEW, reset the counter
 * Non-company callers / non-post-approval statuses pass through unchanged.
 */
async function applyEditPolicy(product, caller) {
  if (!isCompanyUser(caller) || !isPostApprovalStatus(product.status)) {
    return { nextStatus: product.status, editsSinceApproval: product.editsSinceApproval ?? 0, crossedThreshold: false, threshold: DEFAULT_REVIEW_EDIT_THRESHOLD };
  }
  const threshold = await getReviewEditThreshold();
  const newCount = (product.editsSinceApproval ?? 0) + 1;
  if (newCount >= threshold) {
    return { nextStatus: 'PENDING_REVIEW', editsSinceApproval: 0, crossedThreshold: true, threshold };
  }
  return { nextStatus: product.status, editsSinceApproval: newCount, crossedThreshold: false, threshold };
}

/**
 * Append an entry to the immutable audit trail.
 * @param {Prisma.TransactionClient} tx
 * @param {number} productId
 * @param {number} actorUserId
 * @param {import('@prisma/client').ProductActivityAction} action
 * @param {string|null} detail - one-line Persian/human description
 * @param {string|null} comment - free-form note (e.g. change reason)
 */
async function addActivityLog(tx, productId, actorUserId, action, detail = null, comment = null) {
  await tx.productActivityLog.create({ data: { productId, actorUserId, comment, detail, action } });
}

// Status workflow action → ProductActivityAction enum value.
const STATUS_TO_ACTIVITY = {
  submitReview: 'SUBMIT_REVIEW',
  approve: 'APPROVE',
  reject: 'REJECT',
  publish: 'PUBLISH',
  hide: 'HIDE',
  archive: 'ARCHIVE',
  restoreDraft: 'RESTORE_DRAFT',
};

// Top-level scalar columns tracked by the edit-change summary.
const TRACKED_EDIT_FIELDS = ['title', 'shortDescription', 'description', 'sku', 'brand', 'model', 'visibility', 'isFeatured'];

/**
 * Build a human-readable "what changed" summary for a field edit, listing the
 * changed column keys. Category/subcategory are compared by id. Kept short on
 * purpose — the full before/after values are the product's own rows/history.
 */
function summarizeEdit(previous, applied) {
  const changed = TRACKED_EDIT_FIELDS.filter((field) => applied[field] !== undefined && applied[field] !== previous[field]);
  if (applied.categoryId !== undefined && applied.categoryId !== previous.categoryId) changed.push('category');
  if (applied.subcategoryId !== undefined && applied.subcategoryId !== previous.subcategoryId) changed.push('subcategory');
  return changed.length ? `Edited: ${changed.join(', ')}` : 'Product edited';
}

// Notify staff that a post-approval product hit the edit threshold and was
// automatically pushed back to PENDING_REVIEW.
async function notifyStaffForAutoReReview(tx, product, threshold) {
  const notification = {
    title: 'بازبینی مجدد محصول',
    message: `محصول «${product.title}» پس از ${threshold} ویرایش پس از تأیید به وضعیت در انتظار بررسی برگشت.`,
  };
  const recipients = await getSuperAdminUserIds(tx);
  await notifyUsers(recipients, notification.title, notification.message, tx);
}

function assertTransition(product, action) {
  const transition = TRANSITIONS[action];
  if (!transition.from.includes(product.status)) {
    throw {
      statusCode: 400,
      code: 'INVALID_STATUS_TRANSITION',
      message: `Cannot change product status from ${product.status} to ${transition.to}.`,
    };
  }
}

async function notifyUsers(userIds, title, message, tx = prisma) {
  const uniqueIds = [...new Set(userIds.filter(Boolean).map(Number))];
  if (!uniqueIds.length) return;
  await tx.notification.createMany({ data: uniqueIds.map((userId) => ({ userId, title, message })) });
}

async function getSuperAdminUserIds(tx = prisma) {
  const users = await tx.user.findMany({
    where: { roles: { some: { role: { name: SUPER_ADMIN_ROLE } } } },
    select: { id: true },
  });
  return users.map((user) => user.id);
}

async function getCompanyUserIds(companyId, tx = prisma) {
  // Company membership resolves through AccessProfile.companyId, not a
  // User.companyId column (which no longer exists).
  const users = await tx.user.findMany({
    where: { accessProfile: { companyId: Number(companyId) }, status: 'ACTIVE' },
    select: { id: true },
  });
  return users.map((user) => user.id);
}

function getWorkflowNotification(status, product, comment) {
  const title = `Product ${status.toLowerCase().replace('_', ' ')}`;
  const reason = status === 'REJECTED' && comment ? ` Reason: ${comment}` : '';
  return { title, message: `Product "${product.title}" status changed to ${status}.${reason}` };
}

async function validateProductReadyForReview(productId) {
  const product = await prisma.product.findFirst({
    where: { id: Number(productId), deletedAt: null },
    include: {
      subcategory: { include: { specificationTemplate: { include: { fields: true } } } },
      images: true,
      prices: true,
    },
  });
  if (!product) throw { statusCode: 404, code: 'PRODUCT_NOT_FOUND', message: 'Product not found.' };

  const errors = [];
  if (!product.title?.trim()) errors.push('عنوان محصول الزامی است.');
  if (!product.description?.trim() && !product.shortDescription?.trim()) errors.push('توضیحات محصول (کامل یا کوتاه) الزامی است.');
  if (!product.categoryId) errors.push('انتخاب دسته‌بندی الزامی است.');
  if (!product.subcategoryId) errors.push('انتخاب زیردسته الزامی است.');
  if (!product.images.length) errors.push('حداقل یک تصویر برای محصول الزامی است.');
  if (!product.prices.length) errors.push('حداقل یک ردیف قیمت الزامی است.');
  try {
    validateSpecificationsForTemplate(product.specifications, product.subcategory, { requireRequiredFields: true });
  } catch (error) {
    errors.push(error.message || 'مشخصات فنی الزامی تکمیل نشده است.');
  }
  if (errors.length) {
    // `details` is forwarded to the client by the central error handler, so the
    // UI can show exactly which requirements are missing. `errors` is kept for
    // backward compatibility with any existing consumers.
    throw {
      statusCode: 400,
      code: 'PRODUCT_REVIEW_VALIDATION_FAILED',
      message: 'محصول آماده ارسال برای بررسی نیست. لطفاً موارد زیر را تکمیل کنید.',
      details: errors,
      errors,
    };
  }
  return product;
}

async function changeProductStatus(id, action, caller, comment) {
  const productId = Number(id);
  const product = await prisma.product.findFirst({ where: { id: productId, deletedAt: null } });
  if (!product) throw { statusCode: 404, code: 'PRODUCT_NOT_FOUND', message: 'Product not found.' };

  if (action === 'submitReview' || action === 'publish') {
    // Company users may act only on their own products; STAFF moderation
    // remains cross-company. The route additionally checks access type and permission.
    assertCanManageProduct(product, caller);
  }
  if (action === 'publish' && isCompanyUser(caller) && product.status !== 'APPROVED') {
    // A company must never bypass staff review or re-publish a product that
    // STAFF deliberately hid. Only a freshly approved product can be published
    // by its owning company; STAFF with products.publish may republish HIDDEN.
    throw {
      statusCode: 403,
      code: 'PRODUCT_REQUIRES_STAFF_APPROVAL',
      message: 'انتشار محصول توسط شرکت فقط پس از تأیید نهایی STAFF مجاز است.',
    };
  }
  if (action === 'submitReview') {
    await validateProductReadyForReview(productId);
  }
  if (action === 'reject' && !comment?.trim()) {
    throw { statusCode: 400, code: 'REJECTION_REASON_REQUIRED', message: 'Rejection reason is required.' };
  }
  assertTransition(product, action);

  const nextStatus = TRANSITIONS[action].to;
  const updated = await prisma.$transaction(async (tx) => {
    const saved = await tx.product.update({
      where: { id: productId },
      // Fresh approval = fresh counter: the approved product starts with zero
      // post-approval edits budgeted against the review threshold.
      data: { status: nextStatus, ...(nextStatus === 'APPROVED' ? { editsSinceApproval: 0 } : {}) },
      include: productInclude,
    });
    await tx.productStatusHistory.create({
      data: { productId, previousStatus: product.status, newStatus: nextStatus, changedByUserId: Number(caller.id), comment: comment?.trim() || null },
    });
    await addActivityLog(tx, productId, Number(caller.id), STATUS_TO_ACTIVITY[action], `Status ${product.status} → ${nextStatus}`, comment?.trim() || null);
    const notification = getWorkflowNotification(nextStatus, product, comment);
    const recipients = action === 'submitReview' ? await getSuperAdminUserIds(tx) : await getCompanyUserIds(product.companyId, tx);
    await notifyUsers(recipients, notification.title, notification.message, tx);
    return saved;
  });
  return updated;
}

function normalizePriceTier(data) {
  const minQuantity = toPositiveInt(data.minQuantity, 'minQuantity');
  const maxQuantity = data.maxQuantity === undefined || data.maxQuantity === null ? null : toPositiveInt(data.maxQuantity, 'maxQuantity');
  const price = Number(data.price);

  if (!Number.isFinite(price) || price < 0) {
    throw { statusCode: 400, code: 'INVALID_PRICE', message: 'price must be a non-negative number.' };
  }
  if (maxQuantity !== null && maxQuantity < minQuantity) {
    throw { statusCode: 400, code: 'INVALID_PRICE_TIER_RANGE', message: 'maxQuantity must be greater than or equal to minQuantity.' };
  }
  const validFrom = data.validFrom ? new Date(data.validFrom) : undefined;
  const validTo = data.validTo ? new Date(data.validTo) : null;

  if (validFrom && Number.isNaN(validFrom.getTime())) {
    throw { statusCode: 400, code: 'INVALID_PRICE_TIER_DATES', message: 'validFrom must be a valid date.' };
  }
  if (validTo && Number.isNaN(validTo.getTime())) {
    throw { statusCode: 400, code: 'INVALID_PRICE_TIER_DATES', message: 'validTo must be a valid date.' };
  }
  if (validFrom && validTo && validTo < validFrom) {
    throw { statusCode: 400, code: 'INVALID_PRICE_TIER_DATES', message: 'validTo must be after validFrom.' };
  }

  return {
    minQuantity,
    maxQuantity,
    price,
    unit: data.unit,
    validFrom,
    validTo,
  };
}

function getOptionValues(options) {
  if (!Array.isArray(options)) return [];
  return options.map((option) => {
    if (option && typeof option === 'object') return String(option.value ?? option.key ?? option.label ?? option.name ?? '');
    return String(option);
  }).filter(Boolean);
}

function validateSpecificationValue(field, value) {
  if (value === undefined || value === null || value === '') return !field.isRequired;

  if (field.type === 'TEXT') return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
  if (field.type === 'NUMBER') return typeof value === 'number' && Number.isFinite(value);
  if (field.type === 'BOOLEAN') return typeof value === 'boolean';
  if (field.type === 'DATE') return typeof value === 'string' && !Number.isNaN(new Date(value).getTime());

  if (field.type === 'SELECT') {
    return typeof value === 'string' && getOptionValues(field.options).includes(value);
  }

  if (field.type === 'MULTI_SELECT') {
    const allowedValues = getOptionValues(field.options);
    return Array.isArray(value) && value.every((item) => typeof item === 'string' && allowedValues.includes(item));
  }

  return true;
}

/**
 * Validate the `attributes` block: an array of user-defined
 * { fieldId, title, value } objects for specs outside the standard template.
 *
 * Rules:
 *   - fieldId: a positive integer referencing a SpecificationField, or null.
 *     When provided, it must be one of the template's field ids.
 *   - title:   non-empty string (<= MAX_ATTR_TITLE_LEN), unique (case-insensitive).
 *   - value:   non-empty scalar (string / number / boolean, <= MAX_ATTR_VALUE_LEN).
 *
 * @param {Array} attributes
 * @param {Set<number>} templateFieldIds - valid SpecificationField ids for this subcategory
 */
function validateAttributes(attributes, templateFieldIds) {
  if (attributes === undefined || attributes === null) return;
  if (!Array.isArray(attributes)) {
    throw { statusCode: 400, code: 'INVALID_SPECIFICATIONS', message: `${ATTRIBUTES_KEY} must be an array of { fieldId, title, value } objects.` };
  }
  if (attributes.length > MAX_ATTRIBUTES) {
    throw { statusCode: 400, code: 'INVALID_SPECIFICATIONS', message: `Too many attributes (max ${MAX_ATTRIBUTES}).` };
  }

  const seenTitles = new Set();
  attributes.forEach((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw { statusCode: 400, code: 'INVALID_SPECIFICATIONS', message: 'Each attribute must be an object with fieldId, title, and value.' };
    }

    // fieldId: null (new field) or a positive int that exists in the template.
    const { fieldId } = entry;
    if (fieldId !== null && fieldId !== undefined) {
      if (!Number.isInteger(fieldId) || fieldId < 1) {
        throw { statusCode: 400, code: 'INVALID_SPECIFICATIONS', message: 'Attribute fieldId must be a positive integer or null.' };
      }
      if (!templateFieldIds.has(fieldId)) {
        throw { statusCode: 400, code: 'INVALID_SPECIFICATIONS', message: `Attribute fieldId ${fieldId} does not exist in this subcategory template.` };
      }
    }

    const title = typeof entry.title === 'string' ? entry.title.trim() : '';
    if (!title) {
      throw { statusCode: 400, code: 'INVALID_SPECIFICATIONS', message: 'Attribute title is required.' };
    }
    if (title.length > MAX_ATTR_TITLE_LEN) {
      throw { statusCode: 400, code: 'INVALID_SPECIFICATIONS', message: `Attribute title must be at most ${MAX_ATTR_TITLE_LEN} characters.` };
    }
    // Brand / Model / Category / Subcategory are product CORE fields — they may
    // not be duplicated inside specifications as user-defined attributes.
    if (isReservedSpecTitle(title)) {
      throw { statusCode: 400, code: 'RESERVED_SPECIFICATION_TITLE', message: `"${title}" is a reserved product field and cannot be used as a specification.` };
    }


    const value = entry.value;
    const valueIsScalar = ['string', 'number', 'boolean'].includes(typeof value);
    if (!valueIsScalar || value === '') {
      throw { statusCode: 400, code: 'INVALID_SPECIFICATIONS', message: `Attribute value for "${title}" must be a non-empty text, number, or boolean.` };
    }
    if (typeof value === 'string' && value.length > MAX_ATTR_VALUE_LEN) {
      throw { statusCode: 400, code: 'INVALID_SPECIFICATIONS', message: `Attribute value for "${title}" is too long (max ${MAX_ATTR_VALUE_LEN}).` };
    }

    const dedupeKey = title.toLowerCase();
    if (seenTitles.has(dedupeKey)) {
      throw { statusCode: 400, code: 'INVALID_SPECIFICATIONS', message: `Duplicate attribute title: "${title}".` };
    }
    seenTitles.add(dedupeKey);
  });
}

/**
 * Validate a product's specifications against a specification template owner
 * (a Subcategory that has a `specificationTemplate`).
 *
 * Structure of `specifications` (JSONB) — only two keys are allowed:
 *   {
 *     "standard":   { "<field.key>": <value>, ... },   // template-driven
 *     "attributes": [ { fieldId, title, value }, ... ] // user-defined
 *   }
 */
function validateSpecificationsForTemplate(specifications, templateOwner, options = {}) {
  ensurePlainObject(specifications, 'specifications');

  const values = specifications || {};

  // Reject any key other than `standard` / `attributes`.
  const unknownTopKey = Object.keys(values).find((key) => !ALLOWED_SPEC_KEYS.has(key));
  if (unknownTopKey) {
    throw { statusCode: 400, code: 'INVALID_SPECIFICATIONS', message: `Unknown specification key: ${unknownTopKey}. Only "${STANDARD_KEY}" and "${ATTRIBUTES_KEY}" are allowed.` };
  }

  const standard = values[STANDARD_KEY];
  ensurePlainObject(standard, STANDARD_KEY);

  // Brand / Model / Category / Subcategory are PRODUCT CORE columns, not spec
  // fields. If a subcategory template also defines them, drop those entries so
  // they are NOT validated/required inside `standard` — the top-level product
  // columns are the single source of truth. This mirrors the frontend, which
  // hides these template fields from the specifications inputs.
  const allTemplateFields = templateOwner?.specificationTemplate?.isActive ? templateOwner.specificationTemplate.fields : [];
  const fields = allTemplateFields.filter(
    (field) => !isReservedSpecTitle(field.key) && !isReservedSpecTitle(field.name)
  );
  const templateFieldIds = new Set(fields.map((field) => field.id));

  // Attributes are always validated and always allowed, regardless of template.
  validateAttributes(values[ATTRIBUTES_KEY], templateFieldIds);

  const standardValues = standard || {};

  // No template: `standard` must be empty (there are no valid standard keys).
  if (!fields.length) {
    const strayKey = Object.keys(standardValues)[0];
    if (strayKey) {
      throw { statusCode: 400, code: 'INVALID_SPECIFICATIONS', message: `Unknown standard specification key: ${strayKey}.` };
    }
    return;
  }

  const allowedKeys = new Set(fields.map((field) => field.key));
  const unknownKey = Object.keys(standardValues).find((key) => !allowedKeys.has(key));
  if (unknownKey) {
    throw { statusCode: 400, code: 'INVALID_SPECIFICATIONS', message: `Unknown standard specification key: ${unknownKey}.` };
  }

  const invalidField = fields.find((field) => !validateSpecificationValue(field, standardValues[field.key]));
  if (invalidField) {
    throw { statusCode: 400, code: 'INVALID_SPECIFICATIONS', message: `Invalid specification value for ${invalidField.key}.` };
  }
}



function rangesOverlap(a, b) {
  const aMax = a.maxQuantity ?? Number.POSITIVE_INFINITY;
  const bMax = b.maxQuantity ?? Number.POSITIVE_INFINITY;
  return a.minQuantity <= bMax && b.minQuantity <= aMax;
}

async function ensurePriceTierDoesNotOverlap(productId, tier, excludeTierId) {
  const existingTiers = await prisma.productPriceTier.findMany({
    where: { productId, ...(excludeTierId ? { id: { not: excludeTierId } } : {}) },
    select: { id: true, minQuantity: true, maxQuantity: true },
  });

  if (existingTiers.some((existing) => rangesOverlap(existing, tier))) {
    throw { statusCode: 400, code: 'PRICE_TIER_OVERLAP', message: 'Price tier quantity ranges must not overlap.' };
  }
}

async function listProducts({ skip, take, filters = {}, caller, publicOnly = false }) {
  const where = { deletedAt: null };

  // The public catalog intentionally has no permission requirement. Management
  // callers must be authorized here as well as at the HTTP route.
  if (!publicOnly && !isSuperAdmin(caller) && (isCompanyUser(caller) || isStaffUser(caller))
    && (!Array.isArray(caller.permissions) || !caller.permissions.includes('products.read'))) {
    throw { statusCode: 403, code: 'FORBIDDEN', message: 'Permission products.read is required.' };
  }

  const parseOptionalPrice = (value, field) => {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      throw { statusCode: 400, code: 'INVALID_PRICE_FILTER', message: `${field} must be a non-negative number.` };
    }
    return parsed;
  };
  const minPrice = parseOptionalPrice(filters.minPrice, 'minPrice');
  const maxPrice = parseOptionalPrice(filters.maxPrice, 'maxPrice');
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    throw { statusCode: 400, code: 'INVALID_PRICE_RANGE', message: 'minPrice must be less than or equal to maxPrice.' };
  }

  const featured = parseOptionalBoolean(filters.featured);
  if (featured !== undefined) where.isFeatured = featured;

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.prices = {
      some: {
        price: {
          ...(minPrice !== undefined ? { gte: minPrice } : {}),
          ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
        },
      },
    };
  }

  const sortBy = filters.sortBy || 'createdAt';
  const allowedSortFields = new Set(['createdAt', 'updatedAt', 'title']);
  if (!allowedSortFields.has(sortBy)) {
    throw { statusCode: 400, code: 'INVALID_SORT_FIELD', message: 'sortBy must be one of: createdAt, updatedAt, title.' };
  }
  const sortOrder = filters.sortOrder === undefined || filters.sortOrder === '' ? 'desc' : String(filters.sortOrder).toLowerCase();
  if (!['asc', 'desc'].includes(sortOrder)) {
    throw { statusCode: 400, code: 'INVALID_SORT_ORDER', message: 'sortOrder must be asc or desc.' };
  }
  const orderBy = { [sortBy]: sortOrder };

  // Public marketplace routes must remain public-catalog queries even when a
  // visitor has a COMPANY/STAFF session. Management pages use /my-products.
  //   1. Public marketplace           → PUBLISHED + PUBLIC across all companies
  //   2. Company management          → own company's products, any status
  //   3. SUPER_ADMIN management      → every company's products, any status
  const isPublicCaller = publicOnly || !caller
    || (!isSuperAdmin(caller) && !isCompanyUser(caller) && !isStaffUser(caller));

  if (isPublicCaller) {
    where.status = 'PUBLISHED';
    where.visibility = 'PUBLIC';
  }

  // A public listing can optionally be narrowed to a company, but must never
  // be silently scoped to the signed-in user's company.
  if (!publicOnly && isCompanyUser(caller)) {
    where.companyId = Number(caller.companyId);
  } else if (filters.companyId) {
    where.companyId = Number(filters.companyId);
  }

  if (filters.categoryId) where.categoryId = Number(filters.categoryId);
  // Never allow a query-string status to override the public-catalog rule.
  if (filters.status && !isPublicCaller) where.status = filters.status;
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { sku: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({ where, skip, take, orderBy, include: productInclude }),
    prisma.product.count({ where }),
  ]);
  return { items, total };
}

async function getProductById(id, caller) {
  const product = await prisma.product.findFirst({ where: { id: Number(id), deletedAt: null }, include: productInclude });
  if (!product) return null;
  if (isCompanyUser(caller)) {
    if (!Array.isArray(caller.permissions) || !caller.permissions.includes('products.read')) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Permission products.read is required.' };
    }
    if (product.companyId !== Number(caller.companyId)) return null;
    return product;
  }
  if (isStaffUser(caller)) {
    if (!Array.isArray(caller.permissions) || !caller.permissions.includes('products.read')) {
      throw { statusCode: 403, code: 'FORBIDDEN', message: 'Permission products.read is required.' };
    }
    return product;
  }
  if (!caller || (!isSuperAdmin(caller) && !isCompanyUser(caller))) {
    if (product.status !== 'PUBLISHED' || product.visibility !== 'PUBLIC') return null;
  }
  return product;
}

async function createProduct(data, caller) {
  if (!data.title?.trim()) throw { statusCode: 400, code: 'TITLE_REQUIRED', message: 'title is required.' };

  const companyId = resolveCompanyId(data, caller);
  const categoryId = toPositiveInt(data.categoryId, 'categoryId');
  const subcategoryId = toPositiveInt(data.subcategoryId, 'subcategoryId');
  await Promise.all([ensureCompanyExists(companyId), ensureCategoryExists(categoryId)]);
  // Subcategory must belong to the selected category (prevents mismatched data).
  const subcategory = await ensureSubcategoryExists(subcategoryId, categoryId);
  validateSpecificationsForTemplate(data.specifications, subcategory);

  const priceTiers = Array.isArray(data.priceTiers) ? data.priceTiers.map(normalizePriceTier) : [];
  priceTiers.forEach((tier, index) => {
    const overlapsPrior = priceTiers.slice(0, index).some((prior) => rangesOverlap(prior, tier));
    if (overlapsPrior) throw { statusCode: 400, code: 'PRICE_TIER_OVERLAP', message: 'Price tier quantity ranges must not overlap.' };
  });

  const {
    priceTiers: _priceTiers,
    companyId: _companyId,
    categoryId: _categoryId,
    subcategoryId: _subcategoryId,
    status: _status,
    ...productData
  } = data;

  return prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        ...productData,
        title: data.title.trim(),
        slug: await buildUniqueSlug(data.title),
        companyId,
        categoryId,
        subcategoryId,
        createdByUserId: Number(caller.id),
        prices: priceTiers.length ? { create: priceTiers } : undefined,
      },
      include: productInclude,
    });
    await addActivityLog(tx, created.id, Number(caller.id), 'CREATE', 'محصول ایجاد شد', null);
    return created;
  });
}


async function updateProduct(id, data, caller) {
  const productId = Number(id);
  const product = await prisma.product.findFirst({ where: { id: productId, deletedAt: null } });
  if (!product) throw { statusCode: 404, code: 'PRODUCT_NOT_FOUND', message: 'Product not found.' };
  assertCompanyCanEdit(product, caller);

  const updateData = { ...data };
  delete updateData.companyId;
  delete updateData.priceTiers;

  // The product editor submits its full price-tier collection. Reconcile it
  // atomically with the product edit so a threshold-crossing edit cannot leave
  // a half-saved set of prices. Existing tier IDs preserve validity dates and
  // make the complete-set replacement unambiguous.
  const incomingPriceTiers = Array.isArray(data.priceTiers) ? data.priceTiers : undefined;
  const existingPriceTiers = incomingPriceTiers === undefined
    ? undefined
    : await prisma.productPriceTier.findMany({
      where: { productId },
      orderBy: [{ minQuantity: 'asc' }, { createdAt: 'asc' }],
    });
  const existingTiersById = new Map((existingPriceTiers || []).map((tier) => [Number(tier.id), tier]));
  const submittedPriceTiers = incomingPriceTiers === undefined
    ? undefined
    : incomingPriceTiers.map((rawTier) => {
      const tierId = rawTier.id === undefined ? undefined : toPositiveInt(rawTier.id, 'priceTierId');
      const existing = tierId === undefined ? undefined : existingTiersById.get(tierId);
      if (tierId !== undefined && !existing) {
        throw { statusCode: 400, code: 'INVALID_PRICE_TIER_ID', message: 'A submitted price tier does not belong to this product.' };
      }
      return {
        ...(tierId !== undefined ? { id: tierId } : {}),
        ...normalizePriceTier({
          ...rawTier,
          maxQuantity: rawTier.maxQuantity === undefined ? existing?.maxQuantity : rawTier.maxQuantity,
          unit: rawTier.unit === undefined ? existing?.unit : rawTier.unit,
          validFrom: rawTier.validFrom === undefined ? existing?.validFrom : rawTier.validFrom,
          validTo: rawTier.validTo === undefined ? existing?.validTo : rawTier.validTo,
        }),
      };
    });

  if (submittedPriceTiers) {
    const submittedIds = submittedPriceTiers.filter((tier) => tier.id !== undefined).map((tier) => tier.id);
    if (new Set(submittedIds).size !== submittedIds.length) {
      throw { statusCode: 400, code: 'DUPLICATE_PRICE_TIER_ID', message: 'Price tier IDs must be unique.' };
    }
    submittedPriceTiers.forEach((tier, index) => {
      if (submittedPriceTiers.slice(0, index).some((prior) => rangesOverlap(prior, tier))) {
        throw { statusCode: 400, code: 'PRICE_TIER_OVERLAP', message: 'Price tier quantity ranges must not overlap.' };
      }
    });
  }

  const comparableTier = (tier) => ({
    minQuantity: Number(tier.minQuantity),
    maxQuantity: tier.maxQuantity === undefined || tier.maxQuantity === null ? null : Number(tier.maxQuantity),
    price: Number(tier.price),
    unit: tier.unit || null,
    validFrom: tier.validFrom ? new Date(tier.validFrom).getTime() : null,
    validTo: tier.validTo ? new Date(tier.validTo).getTime() : null,
  });
  const submittedTierIds = new Set((submittedPriceTiers || []).filter((tier) => tier.id !== undefined).map((tier) => tier.id));
  const priceTiersChanged = submittedPriceTiers !== undefined && (
    existingPriceTiers.length !== submittedPriceTiers.length
    || existingPriceTiers.some((tier) => !submittedTierIds.has(Number(tier.id)))
    || submittedPriceTiers.some((tier) => {
      if (tier.id === undefined) return true;
      const existing = existingTiersById.get(tier.id);
      if (!existing) return true;
      const before = comparableTier(existing);
      const after = comparableTier(tier);
      return before.minQuantity !== after.minQuantity
        || before.maxQuantity !== after.maxQuantity
        || before.price !== after.price
        || before.unit !== after.unit
        || before.validFrom !== after.validFrom
        || before.validTo !== after.validTo;
    })
  );
  // `changeReason` is not a Product column — it's recorded in the status
  // history below. Strip it so Prisma doesn't reject an unknown argument.
  delete updateData.changeReason;
  if (!isSuperAdmin(caller)) delete updateData.status;


  if (data.companyId !== undefined && isSuperAdmin(caller)) {
    updateData.companyId = toPositiveInt(data.companyId, 'companyId');
    await ensureCompanyExists(updateData.companyId);
  } else if (data.companyId !== undefined && Number(data.companyId) !== product.companyId) {
    throw { statusCode: 403, code: 'FORBIDDEN', message: 'Company users cannot transfer products.' };
  }

  const resolvedCategoryId = data.categoryId !== undefined ? toPositiveInt(data.categoryId, 'categoryId') : product.categoryId;
  const category = await ensureCategoryExists(resolvedCategoryId);
  if (data.categoryId !== undefined) updateData.categoryId = category.id;

  // Resolve the subcategory, ensuring it still belongs to the (possibly new) category.
  const resolvedSubcategoryId = data.subcategoryId !== undefined ? toPositiveInt(data.subcategoryId, 'subcategoryId') : product.subcategoryId;
  const subcategory = await ensureSubcategoryExists(resolvedSubcategoryId, resolvedCategoryId);
  if (data.subcategoryId !== undefined) updateData.subcategoryId = subcategory.id;

  if (data.specifications !== undefined || data.categoryId !== undefined || data.subcategoryId !== undefined) {
    validateSpecificationsForTemplate(data.specifications !== undefined ? data.specifications : product.specifications, subcategory);
  }
  if (data.title !== undefined) {
    if (!data.title.trim()) throw { statusCode: 400, code: 'TITLE_REQUIRED', message: 'title is required.' };
    updateData.title = data.title.trim();
    updateData.slug = await buildUniqueSlug(data.title, productId);
  }

  // Company-user edit policy on post-approval products (review threshold):
  //   edits < threshold → keep status, bump editsSinceApproval
  //   edits >= threshold → back to PENDING_REVIEW, reset counter, notify staff
  let policy = { nextStatus: product.status, editsSinceApproval: product.editsSinceApproval ?? 0, crossedThreshold: false, threshold: DEFAULT_REVIEW_EDIT_THRESHOLD };
  if (isCompanyUser(caller)) {
    policy = await applyEditPolicy(product, caller);
    if (policy.nextStatus !== product.status) updateData.status = policy.nextStatus;
    if (policy.editsSinceApproval !== (product.editsSinceApproval ?? 0)) updateData.editsSinceApproval = policy.editsSinceApproval;
  }

  const previousStatus = product.status;
  const statusChanged = updateData.status && updateData.status !== previousStatus;

  const updated = await prisma.$transaction(async (tx) => {
    const saved = await tx.product.update({ where: { id: productId }, data: updateData, include: productInclude });

    if (priceTiersChanged) {
      const submittedIds = new Set(submittedPriceTiers.filter((tier) => tier.id !== undefined).map((tier) => tier.id));
      for (const existingTier of existingPriceTiers) {
        if (!submittedIds.has(Number(existingTier.id))) {
          await tx.productPriceTier.delete({ where: { id: Number(existingTier.id) } });
        }
      }
      for (const tier of submittedPriceTiers) {
        const { id: tierId, ...tierData } = tier;
        if (tierId !== undefined) {
          await tx.productPriceTier.update({ where: { id: tierId }, data: tierData });
        } else {
          await tx.productPriceTier.create({ data: { ...tierData, productId } });
        }
      }
      await tx.productStatusHistory.create({
        data: {
          productId,
          previousStatus,
          newStatus: updateData.status || previousStatus,
          changedByUserId: Number(caller.id),
          comment: data.changeReason || 'تغییر ردیف‌های قیمت محصول',
        },
      });
      await addActivityLog(
        tx,
        productId,
        Number(caller.id),
        'PRICE_TIER_UPDATE',
        `به‌روزرسانی ردیف‌های قیمت: ${existingPriceTiers.length} → ${submittedPriceTiers.length}`,
        data.changeReason || null,
      );
    }

    // Audit trail: every edit is logged, staff and company alike.
    await addActivityLog(tx, productId, Number(caller.id), 'EDIT', summarizeEdit(product, updateData), data.changeReason || null);

    // A status change (admin override or threshold auto-re-review) is recorded
    // in the existing status history so both timelines stay consistent.
    if (statusChanged) {
      await tx.productStatusHistory.create({
        data: {
          productId,
          previousStatus,
          newStatus: updateData.status,
          changedByUserId: Number(caller.id),
          comment: data.changeReason || (policy.crossedThreshold ? `تغییرات بیش از سقف بازبینی (${policy.threshold} ویرایش).` : `Status changed to ${updateData.status}`),
        },
      });
    }

    // Threshold crossed → notify staff so they can re-review.
    if (policy.crossedThreshold) {
      await notifyStaffForAutoReReview(tx, product, policy.threshold);
    }

    // `saved` was included before price-tier reconciliation; re-read inside
    // the transaction so the PATCH response reflects the final tier collection.
    return priceTiersChanged
      ? tx.product.findFirst({ where: { id: productId, deletedAt: null }, include: productInclude })
      : saved;
  });

  return updated;
}

async function deleteProduct(id, caller) {
  const productId = Number(id);
  const product = await prisma.product.findFirst({ where: { id: productId, deletedAt: null } });
  if (!product) throw { statusCode: 404, code: 'PRODUCT_NOT_FOUND', message: 'Product not found.' };
  assertCanManageProduct(product, caller);

  return prisma.product.update({ where: { id: productId }, data: { status: 'ARCHIVED', deletedAt: new Date() } });
}

async function assertCanManageProductById(productId, caller) {
  const product = await prisma.product.findFirst({ where: { id: Number(productId), deletedAt: null }, select: { id: true, companyId: true, status: true } });
  if (!product) throw { statusCode: 404, code: 'PRODUCT_NOT_FOUND', message: 'Product not found.' };
  assertCompanyCanEdit(product, caller);
  return product;
}

async function addPriceTier(productId, data, caller) {
  const product = await assertCanManageProductById(productId, caller);
  const tier = normalizePriceTier(data);
  await ensurePriceTierDoesNotOverlap(product.id, tier);

  // Price changes are content edits too — apply the same review-threshold
  // policy that governs field edits on post-approval products.
  const policy = await applyEditPolicy(product, caller);
  const previousStatus = product.status;
  const statusChanged = policy.nextStatus !== previousStatus;

  const created = await prisma.$transaction(async (tx) => {
    const record = await tx.productPriceTier.create({ data: { ...tier, productId: product.id } });

    if (policy.editsSinceApproval !== (product.editsSinceApproval ?? 0) || statusChanged) {
      await tx.product.update({ where: { id: product.id }, data: { status: policy.nextStatus, editsSinceApproval: policy.editsSinceApproval } });
    }

    await tx.productStatusHistory.create({
      data: {
        productId: product.id,
        previousStatus,
        newStatus: policy.nextStatus,
        changedByUserId: Number(caller.id),
        comment: `افزودن ردیف قیمت: ${tier.minQuantity}+ → ${tier.price} ریال`,
      },
    });
    await addActivityLog(tx, product.id, Number(caller.id), 'PRICE_TIER_CREATE', `افزودن ردیف قیمت: ${tier.minQuantity}+ → ${tier.price} ریال`);
    if (policy.crossedThreshold) await notifyStaffForAutoReReview(tx, product, policy.threshold);

    return record;
  });

  return created;
}

async function updatePriceTier(productId, tierId, data, caller) {
  const product = await assertCanManageProductById(productId, caller);
  const existing = await prisma.productPriceTier.findFirst({ where: { id: Number(tierId), productId: product.id } });
  if (!existing) throw { statusCode: 404, code: 'PRICE_TIER_NOT_FOUND', message: 'Price tier not found.' };

  const tier = normalizePriceTier({ ...existing, ...data });
  await ensurePriceTierDoesNotOverlap(product.id, tier, existing.id);

  const policy = await applyEditPolicy(product, caller);
  const previousStatus = product.status;
  const statusChanged = policy.nextStatus !== previousStatus;

  const changes = [];
  if (existing.price !== tier.price) changes.push(`قیمت: ${existing.price} → ${tier.price}`);
  if (existing.minQuantity !== tier.minQuantity) changes.push(`حداقل تعداد: ${existing.minQuantity} → ${tier.minQuantity}`);
  if (existing.maxQuantity !== tier.maxQuantity) changes.push(`حداکثر تعداد: ${existing.maxQuantity || '-'} → ${tier.maxQuantity || '-'}`);

  const updated = await prisma.$transaction(async (tx) => {
    const record = await tx.productPriceTier.update({ where: { id: existing.id }, data: tier });

    if (policy.editsSinceApproval !== (product.editsSinceApproval ?? 0) || statusChanged) {
      await tx.product.update({ where: { id: product.id }, data: { status: policy.nextStatus, editsSinceApproval: policy.editsSinceApproval } });
    }

    if (changes.length) {
      await tx.productStatusHistory.create({
        data: {
          productId: product.id,
          previousStatus,
          newStatus: policy.nextStatus,
          changedByUserId: Number(caller.id),
          comment: `تغییر ردیف قیمت: ${changes.join(', ')}`,
        },
      });
    }
    await addActivityLog(tx, product.id, Number(caller.id), 'PRICE_TIER_UPDATE', changes.join('؛ ') || 'ردیف قیمت ویرایش شد');
    if (policy.crossedThreshold) await notifyStaffForAutoReReview(tx, product, policy.threshold);

    return record;
  });

  return updated;
}

async function deletePriceTier(productId, tierId, caller) {
  const product = await assertCanManageProductById(productId, caller);
  const existing = await prisma.productPriceTier.findFirst({ where: { id: Number(tierId), productId: product.id } });
  if (!existing) throw { statusCode: 404, code: 'PRICE_TIER_NOT_FOUND', message: 'Price tier not found.' };

  return prisma.$transaction(async (tx) => {
    const deleted = await tx.productPriceTier.delete({ where: { id: existing.id } });
    await addActivityLog(tx, product.id, Number(caller.id), 'PRICE_TIER_DELETE', `حذف ردیف قیمت ${existing.minQuantity}+ → ${existing.price}`);
    return deleted;
  });
}

async function upsertPrice(productId, data, caller) {
  return addPriceTier(productId, data, caller);
}

async function uploadImage(productId, file, caller) {
  const product = await assertCanManageProductById(productId, caller);
  assertUploadedFile(file);
  assertFileType(file, SUPPORTED_IMAGE_TYPES, ['.jpg', '.jpeg', '.png', '.webp', '.gif'], 'INVALID_IMAGE_TYPE');

  const altText = parseMultipartField(file, 'altText');
  const requestedPrimary = parseOptionalBoolean(parseMultipartField(file, 'isPrimary'));
  const sortOrder = parseOptionalSortOrder(parseMultipartField(file, 'sortOrder'));
  const imageCount = await prisma.productImage.count({ where: { productId: product.id } });
  const isPrimary = requestedPrimary === true || imageCount === 0;
  const stored = await saveUploadedFile(file, 'images', MAX_IMAGE_BYTES);

  try {
    return await prisma.$transaction(async (tx) => {
      if (isPrimary) await tx.productImage.updateMany({ where: { productId: product.id }, data: { isPrimary: false } });
      const image = await tx.productImage.create({
        data: {
          productId: product.id,
          url: stored.url,
          thumbnailUrl: stored.url,
          altText,
          isPrimary,
          sortOrder: sortOrder ?? imageCount,
        },
      });
      await addActivityLog(tx, product.id, Number(caller.id), 'IMAGE_UPLOAD', `آپلود تصویر ${stored.url}`);
      return image;
    });
  } catch (error) {
    await removeStoredFile(stored.url);
    throw error;
  }
}

async function deleteImage(productId, imageId, caller) {
  const product = await assertCanManageProductById(productId, caller);
  const image = await prisma.productImage.findFirst({ where: { id: Number(imageId), productId: product.id } });
  if (!image) throw { statusCode: 404, code: 'IMAGE_NOT_FOUND', message: 'Product image not found.' };

  await prisma.$transaction(async (tx) => {
    await tx.productImage.delete({ where: { id: image.id } });
    await addActivityLog(tx, product.id, Number(caller.id), 'IMAGE_DELETE', `حذف تصویر ${image.url}`);

    if (image.isPrimary) {
      const nextImage = await tx.productImage.findFirst({ where: { productId: product.id }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
      if (nextImage) await tx.productImage.update({ where: { id: nextImage.id }, data: { isPrimary: true } });
    }
  });
  await removeStoredFile(image.url);
}

async function setPrimaryImage(productId, imageId, caller) {
  const product = await assertCanManageProductById(productId, caller);
  const image = await prisma.productImage.findFirst({ where: { id: Number(imageId), productId: product.id } });
  if (!image) throw { statusCode: 404, code: 'IMAGE_NOT_FOUND', message: 'Product image not found.' };

  return prisma.$transaction(async (tx) => {
    await tx.productImage.updateMany({ where: { productId: product.id }, data: { isPrimary: false } });
    const updated = await tx.productImage.update({ where: { id: image.id }, data: { isPrimary: true } });
    await addActivityLog(tx, product.id, Number(caller.id), 'IMAGE_SET_PRIMARY', `تصویر اصلی: ${image.url}`);
    return updated;
  });
}

async function sortImages(productId, images, caller) {
  const product = await assertCanManageProductById(productId, caller);
  const imageIds = images.map((image) => Number(image.id));
  const uniqueImageIds = new Set(imageIds);
  if (uniqueImageIds.size !== imageIds.length) {
    throw { statusCode: 400, code: 'DUPLICATE_IMAGE_SORT', message: 'Image sort payload contains duplicate IDs.' };
  }

  const existingCount = await prisma.productImage.count({ where: { productId: product.id, id: { in: imageIds } } });
  if (existingCount !== imageIds.length) {
    throw { statusCode: 400, code: 'INVALID_IMAGE_SORT', message: 'All images must belong to the product.' };
  }

  await prisma.$transaction(async (tx) => {
    await Promise.all(images.map((image) => tx.productImage.update({
      where: { id: Number(image.id) },
      data: { sortOrder: Number(image.sortOrder) },
    })));
    await addActivityLog(tx, product.id, Number(caller.id), 'IMAGE_SORT', 'ترتیب تصاویر تغییر کرد');
  });

  return prisma.productImage.findMany({ where: { productId: product.id }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
}

async function uploadDocument(productId, file, caller) {
  const product = await assertCanManageProductById(productId, caller);
  assertUploadedFile(file);
  assertFileType(file, SUPPORTED_DOCUMENT_TYPES, ['.pdf'], 'INVALID_DOCUMENT_TYPE');

  const type = String(parseMultipartField(file, 'type') || '').toUpperCase();
  if (!SUPPORTED_DOCUMENT_ENUMS.has(type)) {
    throw { statusCode: 400, code: 'INVALID_DOCUMENT_TYPE', message: 'Document type must be DATASHEET, CATALOG, MANUAL, or CERTIFICATE.' };
  }

  const title = parseMultipartField(file, 'title') || file.filename;
  const sortOrder = parseOptionalSortOrder(parseMultipartField(file, 'sortOrder'));
  const documentCount = await prisma.productDocument.count({ where: { productId: product.id } });
  const stored = await saveUploadedFile(file, 'documents', MAX_DOCUMENT_BYTES);

  try {
    return await prisma.$transaction(async (tx) => {
      const document = await tx.productDocument.create({
        data: {
          productId: product.id,
          type,
          title,
          url: stored.url,
          sortOrder: sortOrder ?? documentCount,
        },
      });
      await addActivityLog(tx, product.id, Number(caller.id), 'DOCUMENT_UPLOAD', `آپلود سند ${type}: ${title}`);
      return document;
    });
  } catch (error) {
    await removeStoredFile(stored.url);
    throw error;
  }
}

async function deleteDocument(productId, documentId, caller) {
  const product = await assertCanManageProductById(productId, caller);
  const document = await prisma.productDocument.findFirst({ where: { id: Number(documentId), productId: product.id } });
  if (!document) throw { statusCode: 404, code: 'DOCUMENT_NOT_FOUND', message: 'Product document not found.' };

  await prisma.$transaction(async (tx) => {
    await tx.productDocument.delete({ where: { id: document.id } });
    await addActivityLog(tx, product.id, Number(caller.id), 'DOCUMENT_DELETE', `حذف سند ${document.title}`);
  });
  await removeStoredFile(document.url);
}

/**
 * Get product change history (status changes, price changes, etc.)
 */
async function getProductHistory(productId, caller) {
  const id = Number(productId);
  const product = await prisma.product.findFirst({ where: { id, deletedAt: null }, select: { id: true, companyId: true } });
  if (!product) throw { statusCode: 404, code: 'PRODUCT_NOT_FOUND', message: 'Product not found.' };
  assertCanReadProduct(product, caller);

  const history = await prisma.productStatusHistory.findMany({
    where: { productId: id },
    orderBy: { createdAt: 'desc' },
    include: {
      changedBy: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } },
    },
  });

  return history;
}

/**
 * Get the immutable activity trail for a product (every field edit,
 * price/media change, and workflow transition).
 */
async function getProductActivityLog(productId, caller) {
  const id = Number(productId);
  const product = await prisma.product.findFirst({ where: { id, deletedAt: null }, select: { id: true, companyId: true } });
  if (!product) throw { statusCode: 404, code: 'PRODUCT_NOT_FOUND', message: 'Product not found.' };
  assertCanReadProduct(product, caller);

  return prisma.productActivityLog.findMany({
    where: { productId: id },
    orderBy: { createdAt: 'desc' },
    include: {
      actor: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } },
    },
  });
}

module.exports = {
  MAX_IMAGE_BYTES,
  MAX_DOCUMENT_BYTES,
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  upsertPrice,
  addPriceTier,
  updatePriceTier,
  deletePriceTier,
  uploadImage,
  deleteImage,
  setPrimaryImage,
  sortImages,
  uploadDocument,
  deleteDocument,
  changeProductStatus,
  getProductHistory,
  getProductActivityLog,
  getReviewEditThreshold,
};
