const prisma = require('../../config/db');
const { AppError } = require('../../utils/error');

function faqSelectPublic() {
  return {
    id: true,
    question: true,
    answer: true,
    category: true,
    sortOrder: true,
    isActive: true,
  };
}

function faqSelectAdmin() {
  return {
    id: true,
    question: true,
    answer: true,
    category: true,
    sortOrder: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  };
}

async function listPublic({ category } = {}) {
  const where = { isActive: true };
  if (category) where.category = category;

  return prisma.faq.findMany({
    where,
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    select: faqSelectPublic(),
  });
}

async function listAdmin({ page = 1, limit = 50, search = '', category, isActive } = {}) {
  const where = {
    ...(search ? { OR: [{ question: { contains: search, mode: 'insensitive' } }, { answer: { contains: search, mode: 'insensitive' } }] } : {}),
    ...(category ? { category } : {}),
    ...(isActive !== undefined ? { isActive: isActive === true || isActive === 'true' } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.faq.findMany({
      where,
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
      select: faqSelectAdmin(),
    }),
    prisma.faq.count({ where }),
  ]);

  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function getAdminById(id) {
  const faq = await prisma.faq.findUnique({
    where: { id },
    select: faqSelectAdmin(),
  });
  if (!faq) throw new AppError('سوال متداول یافت نشد.', 404, true, 'FAQ_NOT_FOUND');
  return faq;
}

async function createFaq(data) {
  return prisma.faq.create({
    data: {
      question: data.question.trim(),
      answer: data.answer.trim(),
      category: data.category?.trim() || 'عمومی',
      sortOrder: Number(data.sortOrder || 0),
      isActive: data.isActive ?? true,
    },
    select: faqSelectAdmin(),
  });
}

async function updateFaq(id, data) {
  const existing = await getAdminById(id);

  const updateData = {};
  if (data.question !== undefined) updateData.question = data.question.trim();
  if (data.answer !== undefined) updateData.answer = data.answer.trim();
  if (data.category !== undefined) updateData.category = data.category.trim() || 'عمومی';
  if (data.sortOrder !== undefined) updateData.sortOrder = Number(data.sortOrder);
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  return prisma.faq.update({
    where: { id },
    data: updateData,
    select: faqSelectAdmin(),
  });
}

async function deleteFaq(id) {
  await getAdminById(id);
  await prisma.faq.delete({ where: { id } });
  return { success: true };
}

async function listCategories() {
  return prisma.faq.findMany({
    where: { isActive: true },
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' },
  });
}

module.exports = {
  listPublic,
  listAdmin,
  getAdminById,
  createFaq,
  updateFaq,
  deleteFaq,
  listCategories,
};