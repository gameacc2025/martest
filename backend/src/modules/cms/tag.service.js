const prisma = require('../../config/db');
const { AppError } = require('../../utils/error');

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
    const existing = await prisma.articleTag.findFirst({ where });
    if (!existing) return slug;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

function tagSelectPublic() {
  return {
    id: true,
    slug: true,
    name: true,
    _count: { select: { articles: { where: { article: { status: 'PUBLISHED', OR: [{ publishedAt: { lte: new Date() } }, { publishedAt: null }] } } } } },
  };
}

function tagSelectAdmin() {
  return {
    id: true,
    slug: true,
    name: true,
    createdAt: true,
    _count: { select: { articles: true } },
  };
}

async function listPublic() {
  return prisma.articleTag.findMany({
    orderBy: { name: 'asc' },
    select: tagSelectPublic(),
  });
}

async function listAdmin({ page = 1, limit = 50, search = '' } = {}) {
  const where = search ? { name: { contains: search, mode: 'insensitive' } } : {};

  const [data, total] = await Promise.all([
    prisma.articleTag.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
      select: tagSelectAdmin(),
    }),
    prisma.articleTag.count({ where }),
  ]);

  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function getAdminById(id) {
  const tag = await prisma.articleTag.findUnique({
    where: { id },
    select: tagSelectAdmin(),
  });
  if (!tag) throw new AppError('برچسب یافت نشد.', 404, true, 'TAG_NOT_FOUND');
  return tag;
}

async function createTag(data) {
  const baseSlug = slugify(data.name);
  const slug = await generateUniqueSlug(baseSlug);

  return prisma.articleTag.create({
    data: {
      slug,
      name: data.name.trim(),
    },
    select: tagSelectAdmin(),
  });
}

async function updateTag(id, data) {
  const existing = await getAdminById(id);

  const updateData = {};
  if (data.name !== undefined) {
    updateData.name = data.name.trim();
    if (data.name !== existing.name) {
      const baseSlug = slugify(data.name);
      updateData.slug = await generateUniqueSlug(baseSlug, id);
    }
  }

  return prisma.articleTag.update({
    where: { id },
    data: updateData,
    select: tagSelectAdmin(),
  });
}

async function deleteTag(id) {
  await getAdminById(id);
  const articleCount = await prisma.articleTagAssignment.count({ where: { tagId: id } });
  if (articleCount > 0) {
    throw new AppError('این برچسب دارای مقاله است و نمی‌توان آن را حذف کرد.', 400, true, 'TAG_HAS_ARTICLES');
  }
  await prisma.articleTag.delete({ where: { id } });
  return { success: true };
}

module.exports = {
  listPublic,
  listAdmin,
  getAdminById,
  createTag,
  updateTag,
  deleteTag,
  slugify,
  generateUniqueSlug,
};