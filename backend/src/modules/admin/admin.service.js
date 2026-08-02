// =============================================================
// Admin Service — Dashboard statistics + pending products
// =============================================================

const prisma = require('../../config/db');

/**
 * Get admin dashboard statistics.
 * Returns counts of key entities, recent activity, and pending products.
 */
async function getStats() {
  const [
    totalUsers,
    activeUsers,
    totalCompanies,
    totalProducts,
    pendingProducts,
    totalInquiries,
    totalRoles,
    totalPermissions,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.company.count(),
    prisma.product.count(),
    prisma.product.count({ where: { status: 'PENDING_REVIEW' } }),
    prisma.inquiry.count(),
    prisma.role.count(),
    prisma.permission.count(),
  ]);

  // Recent users (last 5)
  const recentUsers = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      status: true,
      createdAt: true,
      profile: { select: { firstName: true, lastName: true } },
    },
  });

  // Pending products (for approval queue)
  const pendingProductsList = await prisma.product.findMany({
    where: { status: 'PENDING_REVIEW' },
    take: 20,
    orderBy: { createdAt: 'desc' },
    include: {
      company: { select: { id: true, name: true } },
      category: { select: { id: true, nameFa: true } },
      subcategory: { select: { id: true, nameFa: true } },
      createdBy: {
        select: {
          id: true,
          email: true,
          profile: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  return {
    counts: {
      users: totalUsers,
      activeUsers,
      companies: totalCompanies,
      products: totalProducts,
      pendingProducts,
      orders: totalInquiries,
      roles: totalRoles,
      permissions: totalPermissions,
    },
    recentUsers,
    pendingProducts: pendingProductsList,
  };
}

module.exports = { getStats };
