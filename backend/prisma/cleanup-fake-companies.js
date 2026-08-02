/**
 * Cleanup Script: Remove fake companies created by the old register() function.
 *
 * Run once after deploy:
 *   node prisma/cleanup-fake-companies.js
 *
 * What it does:
 *   1. Finds users with companyId but NO COMPANY/COMPANY_ADMIN role
 *      (these are "fake company buyers" from the old register())
 *   2. Nulls out their companyId
 *   3. Assigns BUYER role if missing
 *   4. Lists orphaned companies for manual review (does NOT auto-delete)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== Cleanup: Fake Companies from Old register() ===\n');

  // 1. Find users with companyId but NO company role
  const fakeBuyers = await prisma.user.findMany({
    where: {
      companyId: { not: null },
      roles: {
        none: {
          role: { name: { in: ['COMPANY_ADMIN', 'COMPANY'] } }
        }
      }
    },
    include: {
      company: { select: { id: true, name: true } },
      roles: { include: { role: { select: { name: true } } } }
    }
  });

  console.log(`Found ${fakeBuyers.length} users with fake companies\n`);

  if (fakeBuyers.length === 0) {
    console.log('Nothing to clean up. Exiting.');
    return;
  }

  // 2 & 3. Clean up each user
  for (const user of fakeBuyers) {
    const companyName = user.company?.name || 'unknown';
    const oldCompanyId = user.companyId;

    // Null out companyId
    await prisma.user.update({
      where: { id: user.id },
      data: { companyId: null }
    });

    // Assign BUYER role if missing
    const hasBuyerRole = user.roles.some(ur => ur.role?.name === 'BUYER');
    if (!hasBuyerRole) {
      const buyerRole = await prisma.role.findUnique({ where: { name: 'BUYER' } });
      if (buyerRole) {
        await prisma.userRole.create({
          data: { userId: user.id, roleId: buyerRole.id }
        });
        console.log(`  [${user.id}] ${user.email} — removed companyId:${oldCompanyId} ("${companyName}"), assigned BUYER role`);
      } else {
        console.log(`  [${user.id}] ${user.email} — removed companyId:${oldCompanyId} ("${companyName}"), WARNING: BUYER role not found in DB`);
      }
    } else {
      console.log(`  [${user.id}] ${user.email} — removed companyId:${oldCompanyId} ("${companyName}"), already has BUYER role`);
    }
  }

  // 4. List orphaned companies for manual review
  const orphanedCompanies = await prisma.company.findMany({
    where: {
      users: {
        none: {
          role: { name: { in: ['COMPANY_ADMIN', 'COMPANY'] } }
        }
      }
    },
    select: { id: true, name: true, status: true, createdAt: true },
    orderBy: { createdAt: 'asc' }
  });

  if (orphanedCompanies.length > 0) {
    console.log(`\n=== Orphaned Companies (review manually, do NOT auto-delete) ===`);
    for (const c of orphanedCompanies) {
      console.log(`  [${c.id}] ${c.name} (${c.status}) — created ${c.createdAt.toISOString()}`);
    }
    console.log(`\nTotal orphaned: ${orphanedCompanies.length}`);
    console.log('These companies have no users with COMPANY/COMPANY_ADMIN roles.');
    console.log('Review them before deciding whether to delete.');
  } else {
    console.log('\nNo orphaned companies found.');
  }

  console.log('\n=== Cleanup complete ===');
}

main()
  .catch((err) => {
    console.error('Cleanup failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
