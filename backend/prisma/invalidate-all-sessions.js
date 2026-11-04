/**
 * Session Invalidation Script
 *
 * Run once after deploy to revoke ALL refresh tokens.
 * Forces all users to re-login under the new role-based access rules.
 *
 * Usage:
 *   node prisma/invalidate-all-sessions.js
 *
 * Why this is safe:
 *   - Access tokens expire in ~15 minutes (short-lived)
 *   - Refresh tokens are deleted, so no token rotation can happen
 *   - All users will be forced to re-authenticate
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== Session Invalidation ===\n');

  const result = await prisma.refreshToken.deleteMany({});

  console.log(`Revoked ${result.count} refresh tokens.`);
  console.log('All users must re-login under the new role-based access rules.');
  console.log('\n=== Done ===');
}

main()
  .catch((err) => {
    console.error('Session invalidation failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
