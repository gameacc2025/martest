const prisma = require('../../config/db');
const { AppError } = require('../../utils/error');
const { recordAuditLogExplicit } = require('../audit/audit.service');
const { AUDIT_ACTIONS } = require('../audit/audit.events');

function slugify(text) {
  const slug = String(text ?? '')
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[\s\u200c]+/gu, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  // Persian/Arabic titles contain letters outside ASCII \\w. Preserve those
  // letters so CMS-created slugs remain addressable instead of becoming empty.
  return slug || 'item';
}

async function generateUniqueSlug(baseSlug, excludeId = null, client = prisma) {
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const where = { slug };
    if (excludeId) where.id = { not: excludeId };
    const existing = await client.articleCategory.findFirst({ where });
    if (!existing) return slug;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

function categorySelectPublic() {
  return {
    id: true,
    slug: true,
    name: true,
    sortOrder: true,
    isActive: true,
    _count: { select: { articles: { where: { article: { status: 'PUBLISHED', OR: [{ publishedAt: { lte: new Date() } }, { publishedAt: null }] } } } } },
  };
}

function categorySelectAdmin() {
  return {
    id: true,
    slug: true,
    name: true,
    sortOrder: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
    _count: { select: { articles: true } },
  };
}

async function listPublic({ activeOnly = true } = {}) {
  const where = activeOnly ? { isActive: true } : {};
  return prisma.articleCategory.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: categorySelectPublic(),
  });
}

async function listAdmin({ page = 1, limit = 50, search = '', isActive } = {}) {
  const where = {
    ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    ...(isActive !== undefined ? { isActive: isActive === true || isActive === 'true' } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.articleCategory.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
      select: categorySelectAdmin(),
    }),
    prisma.articleCategory.count({ where }),
  ]);

  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function getAdminById(id, client = prisma) {
  const category = await client.articleCategory.findUnique({
    where: { id },
    select: categorySelectAdmin(),
  });
  if (!category) throw new AppError('دسته‌بندی یافت نشد.', 404, true, 'CATEGORY_NOT_FOUND');
  return category;
}

async function createCategory(data, actorUserId) {
  return prisma.$transaction(async (tx) => {
    const baseSlug = slugify(data.name);
    const slug = await generateUniqueSlug(baseSlug, null, tx);
    const category = await tx.articleCategory.create({
      data: {
        slug,
        name: data.name.trim(),
        sortOrder: Number(data.sortOrder || 0),
        isActive: data.isActive ?? true,
      },
      select: categorySelectAdmin(),
    });
    await recordAuditLogExplicit({
      tx, actorUserId, actorAccessType: 'STAFF', companyId: null,
      action: AUDIT_ACTIONS.CMS_CATEGORY_CREATED, entityType: 'ArticleCategory',
      entityId: category.id, after: category,
    });
    return category;
  });
}

async function updateCategory(id, data, actorUserId) {
  return prisma.$transaction(async (tx) => {
    const existing = await getAdminById(id, tx);
    const updateData = {};
    if (data.name !== undefined) {
      updateData.name = data.name.trim();
      if (data.name !== existing.name) {
        updateData.slug = await generateUniqueSlug(slugify(data.name), id, tx);
      }
    }
    if (data.sortOrder !== undefined) updateData.sortOrder = Number(data.sortOrder);
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updated = await tx.articleCategory.update({
      where: { id }, data: updateData, select: categorySelectAdmin(),
    });
    await recordAuditLogExplicit({
      tx, actorUserId, actorAccessType: 'STAFF', companyId: null,
      action: AUDIT_ACTIONS.CMS_CATEGORY_UPDATED, entityType: 'ArticleCategory',
      entityId: id, before: existing, after: updated,
      metadata: { changedFields: Object.keys(updateData) },
    });
    return updated;
  });
}

async function deleteCategory(id, actorUserId) {
  return prisma.$transaction(async (tx) => {
    const existing = await getAdminById(id, tx);
    const articleCount = await tx.articleCategoryAssignment.count({ where: { categoryId: id } });
    if (articleCount > 0) {
      throw new AppError('این دسته‌بندی دارای مقاله است و نمی‌توان آن را حذف کرد.', 400, true, 'CATEGORY_HAS_ARTICLES');
    }
    await tx.articleCategory.delete({ where: { id } });
    await recordAuditLogExplicit({
      tx, actorUserId, actorAccessType: 'STAFF', companyId: null,
      action: AUDIT_ACTIONS.CMS_CATEGORY_DELETED, entityType: 'ArticleCategory',
      entityId: id, before: existing,
    });
    return { success: true };
  });
}

module.exports = {
  listPublic,
  listAdmin,
  getAdminById,
  createCategory,
  updateCategory,
  deleteCategory,
  slugify,
  generateUniqueSlug,
};