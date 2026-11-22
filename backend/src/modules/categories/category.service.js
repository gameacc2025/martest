const prisma = require('../../config/db');
const { recordAuditLogExplicit } = require('../audit/audit.service');
const { AUDIT_ACTIONS } = require('../audit/audit.events');

const subcategorySelect = {
  id: true,
  slug: true,
  nameFa: true,
  nameEn: true,
  status: true,
  sortOrder: true,
};

/**
 * List parent categories, each with its active subcategories.
 * @param {object} options - { activeOnly }
 */
async function listCategories({ activeOnly } = {}) {
  const where = activeOnly ? { status: 'ACTIVE' } : {};
  return prisma.category.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
    include: {
      subcategories: {
        where: activeOnly ? { status: 'ACTIVE' } : undefined,
        orderBy: { sortOrder: 'asc' },
        select: subcategorySelect,
      },
    },
  });
}

async function getCategoryById(id, { activeOnly = false } = {}) {
  return prisma.category.findFirst({
    where: { id: Number(id), ...(activeOnly ? { status: 'ACTIVE' } : {}) },
    include: {
      subcategories: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });
}

/**
 * List subcategories that belong to a given category.
 * Used by the product form: user picks a Category, then we load its Subcategories.
 * @param {number} categoryId
 * @param {object} options - { activeOnly }
 */
async function listSubcategoriesByCategory(categoryId, { activeOnly } = {}) {
  const where = { categoryId: Number(categoryId) };
  if (activeOnly) where.status = 'ACTIVE';
  return prisma.subcategory.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
  });
}

async function getSubcategoryById(id, { activeOnly = false } = {}) {
  return prisma.subcategory.findFirst({
    where: { id: Number(id), ...(activeOnly ? { status: 'ACTIVE' } : {}) },
    include: {
      category: true,
      specificationTemplate: { include: { fields: { orderBy: { sortOrder: 'asc' } } } },
    },
  });
}

async function createCategory(data, actor = null) {
  return prisma.$transaction(async (tx) => {
    const created = await tx.category.create({ data });
    await recordAuditLogExplicit({
      tx,
      actorUserId: actor?.id || null,
      actorAccessType: actor?.accessType || 'STAFF',
      companyId: null,
      action: AUDIT_ACTIONS.CATEGORY_CREATED,
      entityType: 'Category',
      entityId: created.id,
      after: created,
    });
    return created;
  });
}

async function updateCategory(id, data, actor = null) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.category.findUnique({ where: { id: Number(id) } });
    if (!before) throw { statusCode: 404, message: 'Category not found' };
    const updated = await tx.category.update({ where: { id: Number(id) }, data });
    await recordAuditLogExplicit({
      tx,
      actorUserId: actor?.id || null,
      actorAccessType: actor?.accessType || 'STAFF',
      companyId: null,
      action: AUDIT_ACTIONS.CATEGORY_UPDATED,
      entityType: 'Category',
      entityId: Number(id),
      before,
      after: updated,
      metadata: { changedFields: Object.keys(data) },
    });
    return updated;
  });
}

async function deleteCategory(id, actor = null) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.category.findUnique({ where: { id: Number(id) } });
    if (!before) throw { statusCode: 404, message: 'Category not found' };
    const hasProducts = await tx.product.count({ where: { categoryId: Number(id) } });
    if (hasProducts) throw { statusCode: 400, message: 'این دسته دارای محصول است. ابتدا محصولات را منتقل کنید.' };
    const deleted = await tx.category.delete({ where: { id: Number(id) } });
    await recordAuditLogExplicit({
      tx,
      actorUserId: actor?.id || null,
      actorAccessType: actor?.accessType || 'STAFF',
      companyId: null,
      action: AUDIT_ACTIONS.CATEGORY_DELETED,
      entityType: 'Category',
      entityId: Number(id),
      before,
    });
    return deleted;
  });
}

async function createSubcategory(data, actor = null) {
  return prisma.$transaction(async (tx) => {
    const created = await tx.subcategory.create({ data: { ...data, categoryId: Number(data.categoryId) } });
    await recordAuditLogExplicit({
      tx,
      actorUserId: actor?.id || null,
      actorAccessType: actor?.accessType || 'STAFF',
      companyId: null,
      action: AUDIT_ACTIONS.SUBCATEGORY_CREATED,
      entityType: 'Subcategory',
      entityId: created.id,
      after: created,
    });
    return created;
  });
}

async function updateSubcategory(id, data, actor = null) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.subcategory.findUnique({ where: { id: Number(id) } });
    if (!before) throw { statusCode: 404, message: 'Subcategory not found' };
    const payload = { ...data };
    if (payload.categoryId !== undefined) payload.categoryId = Number(payload.categoryId);
    const updated = await tx.subcategory.update({ where: { id: Number(id) }, data: payload });
    await recordAuditLogExplicit({
      tx,
      actorUserId: actor?.id || null,
      actorAccessType: actor?.accessType || 'STAFF',
      companyId: null,
      action: AUDIT_ACTIONS.SUBCATEGORY_UPDATED,
      entityType: 'Subcategory',
      entityId: Number(id),
      before,
      after: updated,
      metadata: { changedFields: Object.keys(data) },
    });
    return updated;
  });
}

async function deleteSubcategory(id, actor = null) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.subcategory.findUnique({ where: { id: Number(id) } });
    if (!before) throw { statusCode: 404, message: 'Subcategory not found' };
    const hasProducts = await tx.product.count({ where: { subcategoryId: Number(id) } });
    if (hasProducts) throw { statusCode: 400, message: 'این زیردسته دارای محصول است. ابتدا محصولات را منتقل کنید.' };
    const deleted = await tx.subcategory.delete({ where: { id: Number(id) } });
    await recordAuditLogExplicit({
      tx,
      actorUserId: actor?.id || null,
      actorAccessType: actor?.accessType || 'STAFF',
      companyId: null,
      action: AUDIT_ACTIONS.SUBCATEGORY_DELETED,
      entityType: 'Subcategory',
      entityId: Number(id),
      before,
    });
    return deleted;
  });
}

/**
 * List products for a specific category with pagination.
 * @param {number} categoryId - Category ID
 * @param {object} options - { skip, take, publishedOnly }
 * @returns {Promise<{items: Array, total: number}>}
 */
async function getCategoryProducts(categoryId, { skip, take, publishedOnly }) {
  const where = { categoryId: Number(categoryId), deletedAt: null };
  if (publishedOnly) {
    where.status = 'PUBLISHED';
    where.visibility = 'PUBLIC';
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
  listCategories,
  getCategoryById,
  listSubcategoriesByCategory,
  getSubcategoryById,
  getCategoryProducts,
  createCategory,
  updateCategory,
  deleteCategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
};
