// =============================================================
// Company Service — Business logic for company management
//
// Features:
//   - CRUD with search, filter, sort, pagination
//   - Status management (activate, deactivate, suspend, verify)
//   - Soft delete + restore
//   - Company settings management
//   - Company statistics / dashboard
//   - Logo management
//   - Resource scoping (SUPER_ADMIN vs company users)
// =============================================================

const prisma = require('../../config/db');
const { SUPER_ADMIN_ROLE } = require('../../utils/rbac');
const { COMPANY_LIMIT_KEYS } = require('./company-rule.service');

// Allowed sort fields (whitelist to prevent injection)
const SORT_FIELDS = {
  name: 'name',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  status: 'status',
};

const LEGACY_INQUIRY_LIMIT_FIELD_KEYS = Object.freeze({
  maxOpenInquiries: COMPANY_LIMIT_KEYS.MAX_OPEN_RFQS,
  maxActiveResponses: COMPANY_LIMIT_KEYS.MAX_ACTIVE_RFQ_RESPONSES,
});

function normalizeCompanyLimits(limits) {
  if (!limits) return [];

  const entries = Array.isArray(limits)
    ? limits
    : Object.entries(limits).map(([key, value]) => ({ key, value }));

  const byKey = new Map();
  for (const entry of entries) {
    const key = String(entry.key || '').trim();
    const value = Number(entry.value);

    if (!key) {
      throw { statusCode: 400, code: 'INVALID_COMPANY_LIMIT_KEY', message: 'Company limit key is required.' };
    }
    if (!Number.isInteger(value) || value < 0) {
      throw { statusCode: 400, code: 'INVALID_COMPANY_LIMIT_VALUE', message: `Company limit ${key} must be a non-negative integer.` };
    }

    byKey.set(key, value);
  }

  return Array.from(byKey, ([key, value]) => ({ key, value }));
}

function normalizeSettingsLimits(data = {}) {
  const limits = [];

  if (data.limits) {
    limits.push(...normalizeCompanyLimits(data.limits));
  }

  for (const [field, key] of Object.entries(LEGACY_INQUIRY_LIMIT_FIELD_KEYS)) {
    if (data[field] !== undefined) {
      limits.push({ key, value: data[field] });
    }
  }

  return normalizeCompanyLimits(limits);
}

async function upsertCompanyLimits(companyId, limits, tx = prisma) {
  const normalizedLimits = normalizeCompanyLimits(limits);
  if (normalizedLimits.length === 0) return [];

  await Promise.all(normalizedLimits.map((limit) => tx.companyLimit.upsert({
    where: { companyId_key: { companyId: Number(companyId), key: limit.key } },
    update: { value: limit.value },
    create: { companyId: Number(companyId), key: limit.key, value: limit.value },
  })));

  return tx.companyLimit.findMany({
    where: { companyId: Number(companyId) },
    orderBy: { key: 'asc' },
  });
}

/**
 * Build a Prisma `where` clause from query params.
 * @param {object} query - { search, type, status, isVerified, includeDeleted }
 * @returns {object} Prisma where clause
 */
function buildWhereClause(query = {}) {
  const where = {};

  // Soft delete: by default exclude deleted companies
  if (query.includeDeleted !== 'true') {
    where.deletedAt = null;
  }

  // Search across the core company profile fields.
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
      { address: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  // Filter by type
  if (query.type) {
    where.type = query.type;
  }

  // Filter by status
  if (query.status) {
    where.status = query.status;
  }

  // Filter by isVerified
  if (query.isVerified === 'true') {
    where.isVerified = true;
  } else if (query.isVerified === 'false') {
    where.isVerified = false;
  }

  return where;
}

/**
 * Build orderBy clause from sort param.
 * @param {string} sort - e.g. "name:asc", "createdAt:desc"
 * @returns {object} Prisma orderBy
 */
function buildOrderBy(sort) {
  if (!sort) return { createdAt: 'desc' };
  const [field, order] = sort.split(':');
  const mapped = Object.prototype.hasOwnProperty.call(SORT_FIELDS, field)
    ? SORT_FIELDS[field]
    : 'createdAt';
  return { [mapped]: order === 'asc' ? 'asc' : 'desc' };
}

/**
 * List companies with search, filter, sort, and pagination.
 * @param {object} options - { skip, take, search, type, status, isVerified, sort, includeDeleted }
 * @returns {Promise<{items: Array, total: number}>}
 */
async function listCompanies(options = {}) {
  const { skip, take, ...filters } = options;
  const where = buildWhereClause(filters);
  const orderBy = buildOrderBy(filters.sort);

  const [items, total] = await Promise.all([
    prisma.company.findMany({
      where, skip, take, orderBy,
      include: {
        _count: { select: { products: true, accessProfiles: true, inquiries: true } },
        inquiryLimit: true,
        limits: true,
      },
    }),
    prisma.company.count({ where }),
  ]);
  return { items, total };
}

/**
 * Get a single company by ID (with full details).
 * @param {number} id - Company ID
 * @param {boolean} includeDeleted - Include soft-deleted companies
 * @returns {Promise<object|null>} Company object or null
 */
async function getCompanyById(id, includeDeleted = false) {
  const where = { id: Number(id) };
  if (!includeDeleted) where.deletedAt = null;

  const company = await prisma.company.findFirst({
    where,
    include: {
      _count: { select: { products: true, accessProfiles: true, inquiries: true } },
      inquiryLimit: true,
      limits: { orderBy: { key: 'asc' } },
      // Company "users" are the users whose AccessProfile.companyId points here.
      // Personal info lives on the related Profile; the User row only
      // owns the auth identity (email/status).
      accessProfiles: {
        select: {
          id: true,
          type: true,
          isActive: true,
          user: {
            select: {
              id: true,
              email: true,
              status: true,
              createdAt: true,
              profile: { select: { firstName: true, lastName: true, avatar: true } },
            },
          },
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!company) return null;

  // Flatten accessProfiles → a friendly users[] list for consumers.
  const { accessProfiles, ...rest } = company;
  return {
    ...rest,
    users: (accessProfiles || []).map((ap) => ({
      id: ap.user.id,
      email: ap.user.email,
      status: ap.user.status,
      createdAt: ap.user.createdAt,
      type: ap.type,
      isActive: ap.isActive,
      firstName: ap.user.profile?.firstName ?? null,
      lastName: ap.user.profile?.lastName ?? null,
      avatar: ap.user.profile?.avatar ?? null,
    })),
  };
}

/**
 * Create a new company.
 * Also creates default CompanySettings.
 * @param {object} data - Company data
 * @returns {Promise<object>} Created company
 */
async function createCompany(data) {
  const { settings, limits, features, allowedCategories, companyUsers, users, inquiryLimit, ...companyData } = data;

  return prisma.company.create({
    data: {
      ...companyData,
      inquiryLimit: inquiryLimit ? { create: inquiryLimit } : undefined,
      limits: limits ? { create: normalizeCompanyLimits(limits) } : undefined,
    },
    include: { inquiryLimit: true, limits: true },
  });
}

/**
 * Update company details with resource scoping.
 * @param {number} id - Company ID
 * @param {object} data - Data to update
 * @param {object} caller - Current user (has roles[], companyId)
 * @returns {Promise<object>} Updated company
 * @throws {object} 404 if company not found, 403 if access denied
 */
async function updateCompany(id, data, caller) {
  const { settings, limits, features, allowedCategories, companyUsers, users, inquiryLimit, ...companyData } = data;
  const company = await prisma.company.findUnique({ where: { id: Number(id) } });
  if (!company) throw { statusCode: 404, message: 'شرکت یافت نشد' };
  if (company.deletedAt) throw { statusCode: 404, message: 'شرکت حذف شده است' };

  const isSuperAdmin = caller.roles.includes(SUPER_ADMIN_ROLE);

  // Non-super-admins can only update their own company
  if (!isSuperAdmin && company.id !== caller.companyId) {
    throw { statusCode: 403, message: 'شما فقط می‌توانید شرکت خود را ویرایش کنید.' };
  }

  // Non-super-admins cannot change status, isVerified, or type
  if (!isSuperAdmin) {
    delete companyData.status;
    delete companyData.isVerified;
    delete companyData.type;
  }

  return prisma.$transaction(async (tx) => {
    const updatedCompany = await tx.company.update({
      where: { id: Number(id) },
      data: companyData,
      include: { inquiryLimit: true, limits: { orderBy: { key: 'asc' } } },
    });

    if (limits) {
      await upsertCompanyLimits(id, limits, tx);
      return tx.company.findUnique({
        where: { id: Number(id) },
        include: { inquiryLimit: true, limits: { orderBy: { key: 'asc' } } },
      });
    }

    return updatedCompany;
  });
}

/**
 * Soft-delete a company (set deletedAt).
 * @param {number} id - Company ID
 * @returns {Promise<object>} Updated company
 */
async function deleteCompany(id) {
  const company = await prisma.company.findUnique({ where: { id: Number(id) } });
  if (!company) throw { statusCode: 404, message: 'شرکت یافت نشد' };
  if (company.deletedAt) throw { statusCode: 400, message: 'شرکت قبلاً حذف شده است' };

  return prisma.company.update({
    where: { id: Number(id) },
    data: { deletedAt: new Date(), status: 'INACTIVE' },
  });
}

/**
 * Restore a soft-deleted company.
 * @param {number} id - Company ID
 * @returns {Promise<object>} Restored company
 */
async function restoreCompany(id) {
  const company = await prisma.company.findUnique({ where: { id: Number(id) } });
  if (!company) throw { statusCode: 404, message: 'شرکت یافت نشد' };
  if (!company.deletedAt) throw { statusCode: 400, message: 'شرکت حذف نشده است' };

  return prisma.company.update({
    where: { id: Number(id) },
    data: { deletedAt: null, status: 'ACTIVE' },
  });
}

/**
 * Change company status (activate, deactivate, suspend).
 * @param {number} id - Company ID
 * @param {string} status - New status (ACTIVE, INACTIVE, SUSPENDED)
 * @returns {Promise<object>} Updated company
 */
async function changeStatus(id, status) {
  const company = await prisma.company.findUnique({ where: { id: Number(id) } });
  if (!company) throw { statusCode: 404, message: 'شرکت یافت نشد' };
  if (company.deletedAt) throw { statusCode: 400, message: 'شرکت حذف شده است' };

  const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
  if (!validStatuses.includes(status)) {
    throw { statusCode: 400, message: 'وضعیت نامعتبر است' };
  }

  // When activating a PENDING company, also activate its manager and create defaults
  if (status === 'ACTIVE' && company.status === 'PENDING') {
    return prisma.$transaction(async (tx) => {
      // Update company status
      const updatedCompany = await tx.company.update({
        where: { id: Number(id) },
        data: { status },
      });

      // Activate all PENDING users in this company. Company membership is
      // resolved through AccessProfile.companyId (not a User.companyId column).
      await tx.user.updateMany({
        where: { accessProfile: { companyId: Number(id) }, status: 'PENDING' },
        data: { status: 'ACTIVE' },
      });

      // Approving the company grants panel access to its users. Registration
      // created their AccessProfile with isActive=false (business rule 3); flip
      // it on now so they can enter the company panel. NOTE: this only enables
      // access — it does NOT assign any role. Role assignment remains a
      // separate, explicit admin action (business rule 4).
      await tx.accessProfile.updateMany({
        where: { companyId: Number(id), isActive: false },
        data: { isActive: true },
      });

      // Create default CompanyInquiryLimit if not exists
      await tx.companyInquiryLimit.upsert({
        where: { companyId: Number(id) },
        create: {
          companyId: Number(id),
          maxOpenInquiries: 5,
          maxActiveResponses: 20,
        },
        update: {}, // Don't overwrite if already exists
      });

      // Create default CompanyLimit records if not exist
      const defaultLimits = [
        { key: 'rfq.max_open', value: 5 },
        { key: 'rfq_response.max_active', value: 20 },
        { key: 'rfq_response.max_daily', value: 10 },
        { key: 'rfq_response.max_monthly', value: 50 },
      ];

      for (const limit of defaultLimits) {
        await tx.companyLimit.upsert({
          where: { companyId_key: { companyId: Number(id), key: limit.key } },
          create: { companyId: Number(id), key: limit.key, value: limit.value },
          update: {}, // Don't overwrite if already exists
        });
      }

      return updatedCompany;
    });
  }

  return prisma.company.update({
    where: { id: Number(id) },
    data: { status },
  });
}

/**
 * Verify or unverify a company.
 * @param {number} id - Company ID
 * @param {boolean} isVerified - Verification status
 * @returns {Promise<object>} Updated company
 */
async function setVerification(id, isVerified) {
  const company = await prisma.company.findUnique({ where: { id: Number(id) } });
  if (!company) throw { statusCode: 404, message: 'شرکت یافت نشد' };

  return prisma.company.update({
    where: { id: Number(id) },
    data: { isVerified: !!isVerified },
  });
}

/**
 * Update company logo URL.
 * @param {number} id - Company ID
 * @param {string} logo - Logo URL or path
 * @returns {Promise<object>} Updated company
 */
async function updateLogo(id, logo) {
  const company = await prisma.company.findUnique({ where: { id: Number(id) } });
  if (!company) throw { statusCode: 404, message: 'شرکت یافت نشد' };

  return prisma.company.update({
    where: { id: Number(id) },
    data: { logo },
  });
}

/**
 * Get company settings.
 * @param {number} id - Company ID
 * @returns {Promise<object|null>} Company settings
 */
async function getSettings(id) {
  const company = await prisma.company.findUnique({
    where: { id: Number(id) },
    include: { inquiryLimit: true, limits: { orderBy: { key: 'asc' } } },
  });
  if (!company) throw { statusCode: 404, message: 'شرکت یافت نشد' };

  return { inquiryLimit: company.inquiryLimit, limits: company.limits };
}

/**
 * Update company settings.
 * @param {number} id - Company ID
 * @param {object} data - Settings data
 * @returns {Promise<object>} Updated settings
 */
async function updateSettings(id, data) {
  const company = await prisma.company.findUnique({ where: { id: Number(id) } });
  if (!company) throw { statusCode: 404, message: 'شرکت یافت نشد' };

  return prisma.$transaction(async (tx) => {
    await upsertCompanyLimits(id, normalizeSettingsLimits(data), tx);

    return tx.company.findUnique({
      where: { id: Number(id) },
      select: {
        inquiryLimit: true,
        limits: { orderBy: { key: 'asc' } },
      },
    });
  });
}

/**
 * Get company statistics / dashboard data.
 * @param {number} id - Company ID
 * @returns {Promise<object>} Statistics object
 */
async function getStatistics(id) {
  const company = await prisma.company.findUnique({ where: { id: Number(id) } });
  if (!company) throw { statusCode: 404, message: 'شرکت یافت نشد' };

  const [
    totalProducts,
    publishedProducts,
    totalOrders,
    pendingOrders,
    totalUsers,
    activeUsers,
  ] = await Promise.all([
    prisma.product.count({ where: { companyId: Number(id) } }),
    prisma.product.count({ where: { companyId: Number(id), status: 'PUBLISHED' } }),
    prisma.inquiry.count({ where: { companyId: Number(id) } }),
    prisma.inquiry.count({ where: { companyId: Number(id), status: 'DRAFT' } }),
    // Company membership resolves through AccessProfile.companyId.
    prisma.user.count({ where: { accessProfile: { companyId: Number(id) } } }),
    prisma.user.count({ where: { accessProfile: { companyId: Number(id) }, status: 'ACTIVE' } }),
  ]);

  // Recent products (last 5)
  const recentProducts = await prisma.product.findMany({
    where: { companyId: Number(id) },
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, status: true, createdAt: true },
  });

  const recentOrders = await prisma.inquiry.findMany({
    where: { companyId: Number(id) },
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, status: true, createdAt: true },
  });

  return {
    counts: {
      products: totalProducts,
      publishedProducts,
      orders: totalOrders,
      pendingOrders,
      users: totalUsers,
      activeUsers,
    },
    recentProducts,
    recentOrders,
  };
}

/**
 * List products for a specific company with pagination.
 * @param {number} companyId - Company ID
 * @param {object} options - { skip, take, status, search }
 * @returns {Promise<{items: Array, total: number}>}
 */
async function getCompanyProducts(companyId, options = {}) {
  const { skip, take, status, search } = options;
  const where = { companyId: Number(companyId) };

  if (status) where.status = status;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where, skip, take,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, nameFa: true, nameEn: true } },
        subcategory: { select: { id: true, nameFa: true, nameEn: true } },
        company: { select: { id: true, name: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);
  return { items, total };
}

module.exports = {
  listCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  restoreCompany,
  changeStatus,
  setVerification,
  updateLogo,
  getSettings,
  updateSettings,
  getStatistics,
  getCompanyProducts,
};
