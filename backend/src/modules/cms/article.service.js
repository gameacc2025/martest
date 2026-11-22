const prisma = require('../../config/db');
const { AppError } = require('../../utils/error');
const { recordAuditLogExplicit } = require('../audit/audit.service');
const { AUDIT_ACTIONS } = require('../audit/audit.events');

const PUBLIC_STATUS = 'PUBLISHED';

function slugify(text) {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

async function generateUniqueSlug(baseSlug, excludeId = null, client = prisma) {
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const where = { slug };
    if (excludeId) where.id = { not: excludeId };
    const existing = await client.article.findFirst({ where });
    if (!existing) return slug;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

function publicArticleWhere() {
  const now = new Date();
  return {
    status: PUBLIC_STATUS,
    OR: [
      { publishedAt: { lte: now } },
      { publishedAt: null },
    ],
  };
}

function articleSelectPublic() {
  return {
    id: true,
    slug: true,
    title: true,
    excerpt: true,
    content: true,
    contentFormat: true,
    type: true,
    coverImageKey: true,
    publishedAt: true,
    metaTitle: true,
    metaDescription: true,
    canonicalUrl: true,
    isIndexable: true,
    author: { select: { id: true, profile: { select: { firstName: true, lastName: true, avatar: true } } } },
    // Category deactivation removes the category from public taxonomy and
    // article payloads without unpublishing the article itself.
    categories: {
      where: { category: { isActive: true } },
      select: { category: { select: { id: true, slug: true, name: true } } },
    },
    tags: { select: { tag: { select: { id: true, slug: true, name: true } } } },
  };
}

function articleSelectAdmin() {
  return {
    id: true,
    slug: true,
    title: true,
    excerpt: true,
    content: true,
    contentFormat: true,
    type: true,
    status: true,
    coverImageKey: true,
    authorUserId: true,
    publishedByUserId: true,
    publishedAt: true,
    scheduledAt: true,
    metaTitle: true,
    metaDescription: true,
    canonicalUrl: true,
    isIndexable: true,
    createdAt: true,
    updatedAt: true,
    author: { select: { id: true, profile: { select: { firstName: true, lastName: true } } } },
    publishedBy: { select: { id: true, profile: { select: { firstName: true, lastName: true } } } },
    categories: { select: { category: { select: { id: true, slug: true, name: true } }, sortOrder: true } },
    tags: { select: { tag: { select: { id: true, slug: true, name: true } } } },
  };
}

function normalizeRelationshipIds(values, getId, label) {
  const ids = (values || []).map(getId).map(Number);
  if (ids.some((id) => !Number.isInteger(id) || id < 1)) {
    throw new AppError(`شناسه ${label} نامعتبر است.`, 400, true, `INVALID_ARTICLE_${label.toUpperCase()}`);
  }
  if (new Set(ids).size !== ids.length) {
    throw new AppError(`موارد تکراری در ${label} مجاز نیست.`, 400, true, `DUPLICATE_ARTICLE_${label.toUpperCase()}`);
  }
  return ids;
}

async function validateArticleRelationships(tx, { categories, tags } = {}) {
  if (categories !== undefined) {
    const categoryIds = normalizeRelationshipIds(categories, (item) => item?.categoryId, 'category');
    if (categoryIds.length) {
      const activeCategories = await tx.articleCategory.findMany({
        where: { id: { in: categoryIds }, isActive: true },
        select: { id: true },
      });
      if (activeCategories.length !== categoryIds.length) {
        throw new AppError('دسته‌بندی نامعتبر یا غیرفعال است.', 400, true, 'INVALID_ARTICLE_CATEGORY');
      }
    }
  }
  if (tags !== undefined) {
    const tagIds = normalizeRelationshipIds(tags, (item) => item, 'tag');
    if (tagIds.length) {
      const existingTags = await tx.articleTag.findMany({
        where: { id: { in: tagIds } },
        select: { id: true },
      });
      if (existingTags.length !== tagIds.length) {
        throw new AppError('برچسب نامعتبر است.', 400, true, 'INVALID_ARTICLE_TAG');
      }
    }
  }
}

async function listPublic({ page = 1, limit = 10, category, tag, type, search, featured } = {}) {
  // Keep publication visibility independent from user-supplied search filters.
  // A top-level OR for search would otherwise overwrite publicArticleWhere().OR
  // and could expose a PUBLISHED article whose publishedAt is still in the future.
  const { OR: publicationWindow, ...publicationBase } = publicArticleWhere();
  const and = [{ OR: publicationWindow }];
  if (search) {
    and.push({
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ],
    });
  }
  const where = {
    ...publicationBase,
    AND: and,
    ...(category ? { categories: { some: { category: { slug: category, isActive: true } } } } : {}),
    ...(tag ? { tags: { some: { tag: { slug: tag } } } } : {}),
    ...(type ? { type } : {}),
  };

  const orderBy = featured ? [{ publishedAt: 'desc' }] : [{ publishedAt: 'desc' }, { createdAt: 'desc' }];

  const [data, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: articleSelectPublic(),
    }),
    prisma.article.count({ where }),
  ]);

  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function getPublicBySlug(slug) {
  const article = await prisma.article.findFirst({
    where: { slug, ...publicArticleWhere() },
    select: articleSelectPublic(),
  });
  if (!article) throw new AppError('مقاله یافت نشد.', 404, true, 'ARTICLE_NOT_FOUND');
  return article;
}

async function getPublicById(id) {
  const article = await prisma.article.findFirst({
    where: { id, ...publicArticleWhere() },
    select: articleSelectPublic(),
  });
  if (!article) throw new AppError('مقاله یافت نشد.', 404, true, 'ARTICLE_NOT_FOUND');
  return article;
}

async function listAdmin({ page = 1, limit = 20, search = '', status, type, authorUserId } = {}) {
  const where = {
    ...(search ? { OR: [{ title: { contains: search, mode: 'insensitive' } }, { slug: { contains: search, mode: 'insensitive' } }] } : {}),
    ...(status ? { status } : {}),
    ...(type ? { type } : {}),
    ...(authorUserId ? { authorUserId } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
      select: articleSelectAdmin(),
    }),
    prisma.article.count({ where }),
  ]);

  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function getAdminById(id, client = prisma) {
  const article = await client.article.findUnique({
    where: { id },
    select: articleSelectAdmin(),
  });
  if (!article) throw new AppError('مقاله یافت نشد.', 404, true, 'ARTICLE_NOT_FOUND');
  return article;
}

async function createArticle(data, authorUserId) {
  const baseSlug = slugify(data.title);
  const slug = await generateUniqueSlug(baseSlug);

  const articleData = {
    slug,
    title: data.title.trim(),
    excerpt: data.excerpt?.trim() || null,
    content: data.content,
    contentFormat: data.contentFormat || 'HTML',
    type: data.type || 'ARTICLE',
    status: data.status || 'DRAFT',
    coverImageKey: data.coverImageKey || null,
    authorUserId,
    metaTitle: data.metaTitle?.trim() || null,
    metaDescription: data.metaDescription?.trim() || null,
    canonicalUrl: data.canonicalUrl?.trim() || null,
    isIndexable: data.isIndexable ?? true,
  };

  if (data.status === 'PUBLISHED') {
    articleData.publishedAt = new Date();
    articleData.publishedByUserId = authorUserId;
  }
  if (data.scheduledAt) {
    articleData.scheduledAt = new Date(data.scheduledAt);
    if (data.status === 'SCHEDULED' && articleData.scheduledAt <= new Date()) {
      articleData.status = 'PUBLISHED';
      articleData.publishedAt = new Date();
      articleData.publishedByUserId = authorUserId;
    }
  }

  return prisma.$transaction(async (tx) => {
    await validateArticleRelationships(tx, data);
    const article = await tx.article.create({
      data: {
        ...articleData,
        categories: data.categories !== undefined ? { create: data.categories.map((category, index) => ({ categoryId: Number(category.categoryId), sortOrder: category.sortOrder ?? index })) } : undefined,
        tags: data.tags !== undefined ? { create: data.tags.map((tagId) => ({ tagId: Number(tagId) })) } : undefined,
      },
      select: articleSelectAdmin(),
    });

    await createRevision(article.id, authorUserId, 1, article, 'ایجاد مقاله', tx);
    await recordAuditLogExplicit({
      tx,
      actorUserId: authorUserId,
      actorAccessType: 'STAFF',
      companyId: null,
      action: AUDIT_ACTIONS.CMS_ARTICLE_CREATED,
      entityType: 'Article',
      entityId: article.id,
      metadata: { status: article.status, type: article.type, revisionNo: 1 },
    });
    return article;
  });
}

async function updateArticle(id, data, editorUserId) {
  const existing = await getAdminById(id);

  const updateData = {};
  const allowedFields = [
    'title', 'excerpt', 'content', 'contentFormat', 'type', 'status',
    'coverImageKey', 'metaTitle', 'metaDescription', 'canonicalUrl', 'isIndexable',
    'scheduledAt',
  ];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      if (field === 'scheduledAt') {
        updateData[field] = data[field] ? new Date(data[field]) : null;
      } else if (typeof data[field] === 'string') {
        updateData[field] = data[field].trim() || null;
      } else {
        updateData[field] = data[field];
      }
    }
  }

  if (data.title && data.title !== existing.title) {
    const baseSlug = slugify(data.title);
    updateData.slug = await generateUniqueSlug(baseSlug, id);
  }

  if (data.status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
    updateData.publishedAt = new Date();
    updateData.publishedByUserId = editorUserId;
  }
  if (data.status === 'SCHEDULED' && data.scheduledAt) {
    const scheduledAt = new Date(data.scheduledAt);
    if (scheduledAt <= new Date()) {
      updateData.status = 'PUBLISHED';
      updateData.publishedAt = new Date();
      updateData.publishedByUserId = editorUserId;
    }
  }

  if (data.categories !== undefined && data.categories.length > 0) {
    updateData.categories = { create: data.categories.map((category, index) => ({ categoryId: Number(category.categoryId), sortOrder: category.sortOrder ?? index })) };
  }
  if (data.tags !== undefined && data.tags.length > 0) {
    updateData.tags = { create: data.tags.map((tagId) => ({ tagId: Number(tagId) })) };
  }

  return prisma.$transaction(async (tx) => {
    await validateArticleRelationships(tx, data);
    if (data.categories !== undefined) {
      await tx.articleCategoryAssignment.deleteMany({ where: { articleId: id } });
    }
    if (data.tags !== undefined) {
      await tx.articleTagAssignment.deleteMany({ where: { articleId: id } });
    }

    const article = await tx.article.update({
      where: { id },
      data: updateData,
      select: articleSelectAdmin(),
    });

    const nextRevisionNo = await tx.articleRevision.count({ where: { articleId: id } }) + 1;
    await createRevision(id, editorUserId, nextRevisionNo, article, data.changeNote || 'ویرایش مقاله', tx);
    await recordAuditLogExplicit({
      tx,
      actorUserId: editorUserId,
      actorAccessType: 'STAFF',
      companyId: null,
      action: AUDIT_ACTIONS.CMS_ARTICLE_UPDATED,
      entityType: 'Article',
      entityId: id,
      metadata: { changedFields: Object.keys(updateData), revisionNo: nextRevisionNo },
    });
    return article;
  });
}

async function changeStatus(id, status, userId) {
  const article = await getAdminById(id);
  const updateData = { status };

  if (status === 'PUBLISHED' && article.status !== 'PUBLISHED') {
    updateData.publishedAt = new Date();
    updateData.publishedByUserId = userId;
  }
  if (status === 'ARCHIVED') {
    updateData.isIndexable = false;
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.article.update({
      where: { id },
      data: updateData,
      select: articleSelectAdmin(),
    });

    const nextRevisionNo = await tx.articleRevision.count({ where: { articleId: id } }) + 1;
    await createRevision(id, userId, nextRevisionNo, updated, `تغییر وضعیت به ${status}`, tx);
    await recordAuditLogExplicit({
      tx,
      actorUserId: userId,
      actorAccessType: 'STAFF',
      companyId: null,
      action: AUDIT_ACTIONS.CMS_ARTICLE_STATUS_CHANGED,
      entityType: 'Article',
      entityId: id,
      metadata: { previousStatus: article.status, nextStatus: status, revisionNo: nextRevisionNo },
    });
    return updated;
  });
}

async function deleteArticle(id, editorUserId = null) {
  const existing = await getAdminById(id);
  return prisma.$transaction(async (tx) => {
    const archived = await tx.article.update({
      where: { id },
      data: { status: 'ARCHIVED', isActive: false, isIndexable: false },
      select: articleSelectAdmin(),
    });
    const nextRevisionNo = await tx.articleRevision.count({ where: { articleId: id } }) + 1;
    await createRevision(id, editorUserId, nextRevisionNo, archived, 'آرشیو مقاله', tx);
    await recordAuditLogExplicit({
      tx,
      actorUserId: editorUserId,
      actorAccessType: 'STAFF',
      companyId: null,
      action: AUDIT_ACTIONS.CMS_ARTICLE_ARCHIVED,
      entityType: 'Article',
      entityId: id,
      metadata: { previousStatus: existing.status, nextStatus: 'ARCHIVED', revisionNo: nextRevisionNo },
    });
    return { success: true };
  });
}

async function createRevision(articleId, editorUserId, revisionNo, snapshot, changeNote, client = prisma) {
  // Prisma Json fields cannot safely receive Date instances or other non-JSON values.
  const jsonSnapshot = JSON.parse(JSON.stringify(snapshot));
  return client.articleRevision.create({
    data: { articleId, editorUserId, revisionNo, snapshot: jsonSnapshot, changeNote },
  });
}

async function listRevisions(articleId) {
  return prisma.articleRevision.findMany({
    where: { articleId },
    orderBy: { revisionNo: 'desc' },
    select: { id: true, revisionNo: true, changeNote: true, createdAt: true, editor: { select: { id: true, profile: { select: { firstName: true, lastName: true } } } } },
  });
}

async function getRevision(articleId, revisionNo) {
  return prisma.articleRevision.findUnique({
    where: { articleId_revisionNo: { articleId, revisionNo } },
    select: { id: true, revisionNo: true, snapshot: true, changeNote: true, createdAt: true, editor: { select: { id: true, profile: { select: { firstName: true, lastName: true } } } } },
  });
}

async function restoreRevision(articleId, revisionNo, editorUserId) {
  return prisma.$transaction(async (tx) => {
    const revision = await tx.articleRevision.findUnique({
      where: { articleId_revisionNo: { articleId: Number(articleId), revisionNo: Number(revisionNo) } },
      select: { id: true, articleId: true, revisionNo: true, snapshot: true, changeNote: true },
    });
    if (!revision || Number(revision.articleId) !== Number(articleId)) {
      throw new AppError('نسخه درخواستی یافت نشد.', 404, true, 'REVISION_NOT_FOUND');
    }

    const existing = await getAdminById(Number(articleId), tx);
    const snapshot = revision.snapshot;
    if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
      throw new AppError('محتوای نسخه معتبر نیست.', 400, true, 'INVALID_REVISION_SNAPSHOT');
    }

    const allowedFields = [
      'title', 'excerpt', 'content', 'contentFormat', 'type', 'status',
      'coverImageKey', 'metaTitle', 'metaDescription', 'canonicalUrl', 'isIndexable',
      'scheduledAt',
    ];
    const updateData = {};
    for (const field of allowedFields) {
      if (snapshot[field] !== undefined) {
        if (field === 'scheduledAt') updateData[field] = snapshot[field] ? new Date(snapshot[field]) : null;
        else if (typeof snapshot[field] === 'string') updateData[field] = snapshot[field].trim() || null;
        else updateData[field] = snapshot[field];
      }
    }

    if (snapshot.title && snapshot.title !== existing.title) {
      updateData.slug = await generateUniqueSlug(slugify(snapshot.title), articleId, tx);
    }

    if (snapshot.status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
      updateData.publishedAt = new Date();
      updateData.publishedByUserId = editorUserId;
    }
    if (snapshot.status === 'SCHEDULED' && snapshot.scheduledAt) {
      const scheduledAt = new Date(snapshot.scheduledAt);
      if (scheduledAt <= new Date()) {
        updateData.status = 'PUBLISHED';
        updateData.publishedAt = new Date();
        updateData.publishedByUserId = editorUserId;
      }
    }

    if (snapshot.categories !== undefined) {
      const categoryIds = normalizeRelationshipIds(snapshot.categories, (item) => item.categoryId || item.category?.id || item.id, 'category');
      const availableCategories = categoryIds.length
        ? await tx.articleCategory.findMany({ where: { id: { in: categoryIds } }, select: { id: true } })
        : [];
      const availableCategoryIds = new Set(availableCategories.map((item) => Number(item.id)));
      updateData.categories = {
        create: snapshot.categories.flatMap((item, index) => {
          const id = Number(item.categoryId || item.category?.id || item.id);
          return availableCategoryIds.has(id) ? [{ categoryId: id, sortOrder: item.sortOrder ?? index }] : [];
        }),
      };
    }
    if (snapshot.tags !== undefined) {
      const tagIds = normalizeRelationshipIds(snapshot.tags, (item) => item.tagId || item.tag?.id || item.id, 'tag');
      const availableTags = tagIds.length
        ? await tx.articleTag.findMany({ where: { id: { in: tagIds } }, select: { id: true } })
        : [];
      const availableTagIds = new Set(availableTags.map((item) => Number(item.id)));
      updateData.tags = {
        create: tagIds.filter((id) => availableTagIds.has(id)).map((tagId) => ({ tagId })),
      };
    }

    if (snapshot.categories !== undefined) {
      await tx.articleCategoryAssignment.deleteMany({ where: { articleId: Number(articleId) } });
    }
    if (snapshot.tags !== undefined) {
      await tx.articleTagAssignment.deleteMany({ where: { articleId: Number(articleId) } });
    }

    const article = await tx.article.update({
      where: { id: Number(articleId) },
      data: updateData,
      select: articleSelectAdmin(),
    });

    const nextRevisionNo = await tx.articleRevision.count({ where: { articleId: Number(articleId) } }) + 1;
    await createRevision(Number(articleId), editorUserId, nextRevisionNo, article, `بازگردانی به نسخه ${revisionNo}: ${revision.changeNote || ''}`, tx);
    await recordAuditLogExplicit({
      tx,
      actorUserId: editorUserId,
      actorAccessType: 'STAFF',
      companyId: null,
      action: AUDIT_ACTIONS.CMS_ARTICLE_REVISION_RESTORED,
      entityType: 'Article',
      entityId: articleId,
      metadata: { sourceRevisionNo: revisionNo, revisionNo: nextRevisionNo },
    });
    return article;
  });
}

module.exports = {
  listPublic,
  getPublicBySlug,
  getPublicById,
  listAdmin,
  getAdminById,
  createArticle,
  updateArticle,
  changeStatus,
  deleteArticle,
  listRevisions,
  getRevision,
  restoreRevision,
  slugify,
  generateUniqueSlug,
};