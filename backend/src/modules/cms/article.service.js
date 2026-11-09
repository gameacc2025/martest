const prisma = require('../../config/db');
const { AppError } = require('../../utils/error');

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

async function generateUniqueSlug(baseSlug, excludeId = null) {
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const where = { slug };
    if (excludeId) where.id = { not: excludeId };
    const existing = await prisma.article.findFirst({ where });
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
    categories: { select: { category: { select: { id: true, slug: true, name: true } } } },
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

async function listPublic({ page = 1, limit = 10, category, tag, type, search, featured } = {}) {
  const where = {
    ...publicArticleWhere(),
    ...(category ? { categories: { some: { category: { slug: category } } } } : {}),
    ...(tag ? { tags: { some: { tag: { slug: tag } } } } : {}),
    ...(type ? { type } : {}),
    ...(search ? { OR: [{ title: { contains: search, mode: 'insensitive' } }, { excerpt: { contains: search, mode: 'insensitive' } }, { content: { contains: search, mode: 'insensitive' } }] } : {}),
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

async function getAdminById(id) {
  const article = await prisma.article.findUnique({
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

  const article = await prisma.article.create({
    data: {
      ...articleData,
      categories: data.categories ? { create: data.categories.map((c, i) => ({ categoryId: c, sortOrder: c.sortOrder ?? i })) } : undefined,
      tags: data.tags ? { create: data.tags.map(t => ({ tagId: t })) } : undefined,
    },
    select: articleSelectAdmin(),
  });

  await createRevision(article.id, authorUserId, 1, article, 'ایجاد مقاله');

  return article;
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

  if (data.categories !== undefined) {
    await prisma.articleCategoryAssignment.deleteMany({ where: { articleId: id } });
    if (data.categories.length > 0) {
      updateData.categories = { create: data.categories.map((c, i) => ({ categoryId: c, sortOrder: c.sortOrder ?? i })) };
    }
  }
  if (data.tags !== undefined) {
    await prisma.articleTagAssignment.deleteMany({ where: { articleId: id } });
    if (data.tags.length > 0) {
      updateData.tags = { create: data.tags.map(t => ({ tagId: t })) };
    }
  }

  const article = await prisma.article.update({
    where: { id },
    data: updateData,
    select: articleSelectAdmin(),
  });

  const nextRevisionNo = await prisma.articleRevision.count({ where: { articleId: id } }) + 1;
  await createRevision(id, editorUserId, nextRevisionNo, article, data.changeNote || 'ویرایش مقاله');

  return article;
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

  const updated = await prisma.article.update({
    where: { id },
    data: updateData,
    select: articleSelectAdmin(),
  });

  const nextRevisionNo = await prisma.articleRevision.count({ where: { articleId: id } }) + 1;
  await createRevision(id, userId, nextRevisionNo, updated, `تغییر وضعیت به ${status}`);

  return updated;
}

async function deleteArticle(id) {
  await getAdminById(id);
  await prisma.article.update({ where: { id }, data: { status: 'ARCHIVED', isActive: false } });
  return { success: true };
}

async function createRevision(articleId, editorUserId, revisionNo, snapshot, changeNote) {
  return prisma.articleRevision.create({
    data: { articleId, editorUserId, revisionNo, snapshot, changeNote },
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
  slugify,
  generateUniqueSlug,
};