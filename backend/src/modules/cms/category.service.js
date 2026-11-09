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
    const existing = await prisma.articleCategory.findFirst({ where });
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
    ...(isActive !== undefined ? { isActive: isActive === 'true' } : {}),
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

async function getAdminById(id) {
  const category = await prisma.articleCategory.findUnique({
    where: { id },
    select: categorySelectAdmin(),
  });
  if (!category) throw new AppError('دسته‌بندی یافت نشد.', 404, true, 'CATEGORY_NOT_FOUND');
  return category;
}

async function createCategory(data) {
  const baseSlug = slugify(data.name);
  const slug = await generateUniqueSlug(baseSlug);

  return prisma.articleCategory.create({
    data: {
      slug,
      name: data.name.trim(),
      sortOrder: Number(data.sortOrder || 0),
      isActive: data.isActive ?? true,
    },
    select: categorySelectAdmin(),
  });
}

async function updateCategory(id, data) {
  const existing = await getAdminById(id);

  const updateData = {};
  if (data.name !== undefined) {
    updateData.name = data.name.trim();
    if (data.name !== existing.name) {
      const baseSlug = slugify(data.name);
      updateData.slug = await generateUniqueSlug(baseSlug, id);
    }
  }
  if (data.sortOrder !== undefined) updateData.sortOrder = Number(data.sortOrder);
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  return prisma.articleCategory.update({
    where: { id },
    data: updateData,
    select: categorySelectAdmin(),
  });
}

async function deleteCategory(id) {
  await getAdminById(id);
  const articleCount = await prisma.articleCategoryAssignment.count({ where: { categoryId: id } });
  if (articleCount > 0) {
    throw new AppError('این دسته‌بندی دارای مقاله است و نمی‌توان آن را حذف کرد.', 400, true, 'CATEGORY_HAS_ARTICLES');
  }
  await prisma.articleCategory.delete({ where: { id } });
  return { success: true };
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