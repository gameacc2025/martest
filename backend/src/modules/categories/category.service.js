const prisma = require('../../config/db');

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

async function getCategoryById(id) {
  return prisma.category.findUnique({
    where: { id: Number(id) },
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

async function getSubcategoryById(id) {
  return prisma.subcategory.findUnique({
    where: { id: Number(id) },
    include: {
      category: true,
      specificationTemplate: { include: { fields: { orderBy: { sortOrder: 'asc' } } } },
    },
  });
}

async function createCategory(data) {
  return prisma.category.create({ data });
}

async function updateCategory(id, data) {
  return prisma.category.update({ where: { id: Number(id) }, data });
}

async function deleteCategory(id) {
  const hasProducts = await prisma.product.count({ where: { categoryId: Number(id) } });
  if (hasProducts) throw { statusCode: 400, message: 'این دسته دارای محصول است. ابتدا محصولات را منتقل کنید.' };
  return prisma.category.delete({ where: { id: Number(id) } });
}

async function createSubcategory(data) {
  return prisma.subcategory.create({ data: { ...data, categoryId: Number(data.categoryId) } });
}

async function updateSubcategory(id, data) {
  const payload = { ...data };
  if (payload.categoryId !== undefined) payload.categoryId = Number(payload.categoryId);
  return prisma.subcategory.update({ where: { id: Number(id) }, data: payload });
}

async function deleteSubcategory(id) {
  const hasProducts = await prisma.product.count({ where: { subcategoryId: Number(id) } });
  if (hasProducts) throw { statusCode: 400, message: 'این زیردسته دارای محصول است. ابتدا محصولات را منتقل کنید.' };
  return prisma.subcategory.delete({ where: { id: Number(id) } });
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
