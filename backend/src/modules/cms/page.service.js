const prisma = require('../../config/db');
const { AppError } = require('../../utils/error');
const { recordAuditLogExplicit } = require('../audit/audit.service');
const { AUDIT_ACTIONS } = require('../audit/audit.events');

const PAGE_SLUGS = ['about', 'contact', 'terms', 'privacy', 'faq'];

function pageSelectPublic() {
  return {
    id: true,
    slug: true,
    title: true,
    content: true,
    contentFormat: true,
    metaTitle: true,
    metaDescription: true,
    canonicalUrl: true,
    isIndexable: true,
    updatedAt: true,
  };
}

function pageSelectAdmin() {
  return {
    id: true,
    slug: true,
    title: true,
    content: true,
    contentFormat: true,
    metaTitle: true,
    metaDescription: true,
    canonicalUrl: true,
    isIndexable: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  };
}

async function listPublic() {
  return prisma.page.findMany({
    where: { isActive: true, slug: { in: PAGE_SLUGS } },
    orderBy: { slug: 'asc' },
    select: pageSelectPublic(),
  });
}

async function getPublicBySlug(slug) {
  const page = await prisma.page.findFirst({
    where: { slug, isActive: true },
    select: pageSelectPublic(),
  });
  if (!page) throw new AppError('صفحه یافت نشد.', 404, true, 'PAGE_NOT_FOUND');
  return page;
}

async function listAdmin({ page = 1, limit = 50, search = '', isActive } = {}) {
  const where = {
    ...(search ? { OR: [{ title: { contains: search, mode: 'insensitive' } }, { slug: { contains: search, mode: 'insensitive' } }] } : {}),
    ...(isActive !== undefined ? { isActive: isActive === true || isActive === 'true' } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.page.findMany({
      where,
      orderBy: { slug: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
      select: pageSelectAdmin(),
    }),
    prisma.page.count({ where }),
  ]);

  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function getAdminById(id, client = prisma) {
  const page = await client.page.findUnique({
    where: { id },
    select: pageSelectAdmin(),
  });
  if (!page) throw new AppError('صفحه یافت نشد.', 404, true, 'PAGE_NOT_FOUND');
  return page;
}

async function getAdminBySlug(slug) {
  const page = await prisma.page.findUnique({
    where: { slug },
    select: pageSelectAdmin(),
  });
  if (!page) throw new AppError('صفحه یافت نشد.', 404, true, 'PAGE_NOT_FOUND');
  return page;
}

async function createPage(data, actorUserId) {
  if (!PAGE_SLUGS.includes(data.slug) && !data.slug.startsWith('custom-')) {
    throw new AppError('اسلاگ نامعتبر است.', 400, true, 'INVALID_PAGE_SLUG');
  }

  return prisma.$transaction(async (tx) => {
    const page = await tx.page.create({
      data: {
        slug: data.slug,
        title: data.title.trim(),
        content: data.content,
        contentFormat: data.contentFormat || 'HTML',
        metaTitle: data.metaTitle?.trim() || null,
        metaDescription: data.metaDescription?.trim() || null,
        canonicalUrl: data.canonicalUrl?.trim() || null,
        isIndexable: data.isIndexable ?? true,
        isActive: data.isActive ?? true,
      },
      select: pageSelectAdmin(),
    });

    await recordAuditLogExplicit({
      tx,
      actorUserId,
      actorAccessType: 'STAFF',
      companyId: null,
      action: AUDIT_ACTIONS.CMS_PAGE_CREATED,
      entityType: 'Page',
      entityId: page.id,
      after: page,
    });
    return page;
  });
}

async function updatePage(id, data, actorUserId) {
  return prisma.$transaction(async (tx) => {
    const existing = await getAdminById(id, tx);
    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title.trim();
    if (data.content !== undefined) updateData.content = data.content;
    if (data.contentFormat !== undefined) updateData.contentFormat = data.contentFormat;
    if (data.metaTitle !== undefined) updateData.metaTitle = data.metaTitle?.trim() || null;
    if (data.metaDescription !== undefined) updateData.metaDescription = data.metaDescription?.trim() || null;
    if (data.canonicalUrl !== undefined) updateData.canonicalUrl = data.canonicalUrl?.trim() || null;
    if (data.isIndexable !== undefined) updateData.isIndexable = data.isIndexable;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updated = await tx.page.update({
      where: { id },
      data: updateData,
      select: pageSelectAdmin(),
    });

    await recordAuditLogExplicit({
      tx,
      actorUserId,
      actorAccessType: 'STAFF',
      companyId: null,
      action: AUDIT_ACTIONS.CMS_PAGE_UPDATED,
      entityType: 'Page',
      entityId: id,
      before: existing,
      after: updated,
      metadata: { changedFields: Object.keys(updateData) },
    });
    return updated;
  });
}

async function upsertPage(slug, data, actorUserId) {
  const existing = await prisma.page.findUnique({ where: { slug } });
  if (existing) return updatePage(existing.id, data, actorUserId);
  return createPage({ slug, ...data }, actorUserId);
}

async function deletePage(id, actorUserId) {
  return prisma.$transaction(async (tx) => {
    const existing = await getAdminById(id, tx);
    await tx.page.delete({ where: { id } });

    await recordAuditLogExplicit({
      tx,
      actorUserId,
      actorAccessType: 'STAFF',
      companyId: null,
      action: AUDIT_ACTIONS.CMS_PAGE_DELETED,
      entityType: 'Page',
      entityId: id,
      before: existing,
    });
    return { success: true };
  });
}

module.exports = {
  listPublic,
  getPublicBySlug,
  listAdmin,
  getAdminById,
  getAdminBySlug,
  createPage,
  updatePage,
  upsertPage,
  deletePage,
  PAGE_SLUGS,
};