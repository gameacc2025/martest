const prisma = require('../../config/db');

/**
 * Search specification library fields by title or slug.
 * Used by the product form autocomplete.
 */
async function searchFields(query, { limit = 20 } = {}) {
  const trimmed = (query || '').trim();
  if (!trimmed) return [];

  const take = Math.min(Math.max(Number(limit) || 20, 1), 50);

  const results = await prisma.specificationLibraryField.findMany({
    where: {
      isActive: true,
      OR: [
        { title: { contains: trimmed, mode: 'insensitive' } },
        { slug: { contains: trimmed, mode: 'insensitive' } },
      ],
    },
    orderBy: [
      { title: 'asc' },
    ],
    take,
    select: {
      id: true,
      title: true,
      slug: true,
      type: true,
      defaultUnit: true,
      description: true,
    },
  });

  return results;
}

/**
 * List all active specification library fields.
 */
async function listFields() {
  return prisma.specificationLibraryField.findMany({
    where: { isActive: true },
    orderBy: { title: 'asc' },
    select: {
      id: true,
      title: true,
      slug: true,
      type: true,
      defaultUnit: true,
      description: true,
    },
  });
}

module.exports = {
  searchFields,
  listFields,
};
