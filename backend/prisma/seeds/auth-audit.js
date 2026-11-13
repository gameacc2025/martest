// Development-only, idempotent demo fixtures for AuthChallenge and AuditLog.
// Uses the current Prisma schema and only synthetic demo marketplace accounts.

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { hashPassword } = require('../../src/utils/password');

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
  }),
});

const ACTIONS = {
  STAFF: ['USER_CREATE', 'USER_UPDATE', 'ROLE_ASSIGN', 'COMPANY_VERIFY', 'PRODUCT_APPROVE', 'CMS_ARTICLE_UPDATE', 'SYSTEM_SETTINGS_UPDATE'],
  COMPANY: ['COMPANY_PROFILE_UPDATE', 'PRODUCT_CREATE', 'PRODUCT_UPDATE', 'PRODUCT_SUBMIT_REVIEW', 'INQUIRY_RESPOND', 'USER_INVITE'],
  CUSTOMER: ['PROFILE_UPDATE', 'PASSWORD_CHANGE', 'ADDRESS_CREATE', 'INQUIRY_CREATE', 'NOTIFICATION_PREFERENCE_UPDATE', 'SESSION_REVOKE'],
};
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36',
];

async function seedAuthAuditDemo(db = prisma) {
  console.log('Seeding Auth & Audit demo data...');

  if (process.env.NODE_ENV !== 'development' || process.env.SEED_AUTH_AUDIT === 'false') {
    console.log('Skipping auth-audit demo data outside development or explicitly disabled.');
    return { authChallenges: 0, auditLogs: 0 };
  }

  const users = await db.user.findMany({
    where: {
      OR: [
        { phone: { startsWith: '09911' } },
        { phone: { startsWith: '09912' } },
      ],
    },
    include: { accessProfile: true },
    orderBy: { id: 'asc' },
  });

  if (users.length === 0) {
    console.log('No synthetic demo marketplace users found; skipping Auth & Audit fixtures.');
    return { authChallenges: 0, auditLogs: 0 };
  }

  let challengeCount = 0;
  const challengeDefinitions = [
    { purpose: 'PASSWORD_RESET', channel: 'SMS', ageDays: 20, state: 'EXPIRED' },
    { purpose: 'PHONE_VERIFICATION', channel: 'SMS', ageDays: 10, state: 'CONSUMED' },
    { purpose: 'LOGIN_MFA', channel: 'SMS', ageDays: 3, state: 'INVALIDATED' },
    { purpose: 'EMAIL_VERIFICATION', channel: 'EMAIL', ageDays: 18, state: 'EXPIRED' },
  ];

  for (const user of users) {
    for (const [index, definition] of challengeDefinitions.entries()) {
      if (definition.channel === 'EMAIL' && !user.email) continue;
      const existing = await db.authChallenge.findFirst({
        where: {
          userId: user.id,
          purpose: definition.purpose,
          channel: definition.channel,
        },
        select: { id: true },
      });
      if (existing) continue;

      const createdAt = new Date(Date.now() - definition.ageDays * 24 * 60 * 60 * 1000);
      const expiresAt = new Date(createdAt.getTime() + 15 * 60 * 1000);
      const consumedAt = definition.state === 'CONSUMED' ? new Date(createdAt.getTime() + 30_000) : null;
      const invalidatedAt = definition.state === 'INVALIDATED' ? new Date(createdAt.getTime() + 30_000) : null;
      const code = String(100000 + ((user.id * 137 + index * 7919) % 900000));

      await db.authChallenge.create({
        data: {
          userId: user.id,
          purpose: definition.purpose,
          channel: definition.channel,
          destination: definition.channel === 'SMS' ? user.phone : user.email,
          secretHash: await hashPassword(code),
          expiresAt,
          consumedAt,
          invalidatedAt,
          attemptCount: definition.state === 'INVALIDATED' ? 5 : (definition.state === 'CONSUMED' ? 1 : 0),
          maxAttempts: 5,
          createdAt,
        },
      });
      challengeCount++;
    }
  }

  let auditCount = 0;
  for (const user of users) {
    const context = user.accessProfile?.type || 'CUSTOMER';
    const actions = ACTIONS[context] || ACTIONS.CUSTOMER;
    for (let index = 0; index < 12; index++) {
      const requestId = 'seed-auth-audit-user-' + user.id + '-' + index;
      const existing = await db.auditLog.findFirst({ where: { requestId }, select: { id: true } });
      if (existing) continue;

      const action = actions[index % actions.length];
      const occurredAt = new Date(Date.now() - (index + 1) * 60 * 60 * 1000);
      const severity = /DELETE|DEACTIVATE|REJECT/.test(action) ? 'WARN' : (index % 11 === 0 ? 'ERROR' : 'INFO');
      await db.auditLog.create({
        data: {
          actorUserId: user.id,
          actorAccessType: context,
          companyId: user.accessProfile?.type === 'COMPANY' ? user.accessProfile.companyId : null,
          action,
          entityType: 'User',
          entityId: String(user.id),
          requestId,
          source: 'SEED',
          outcome: 'SUCCESS',
          severity,
          ipAddress: '185.143.' + ((user.id * 17 + index) % 254 + 1) + '.' + ((user.id * 31 + index) % 254 + 1),
          userAgent: USER_AGENTS[index % USER_AGENTS.length],
          metadata: { seedKey: requestId, synthetic: true, device: index % 2 ? 'desktop' : 'mobile' },
          occurredAt,
        },
      });
      auditCount++;
    }
  }

  for (let index = 0; index < 20; index++) {
    const requestId = 'seed-auth-audit-system-' + index;
    const existing = await db.auditLog.findFirst({ where: { requestId }, select: { id: true } });
    if (existing) continue;
    const occurredAt = new Date(Date.now() - (index + 1) * 2 * 60 * 60 * 1000);
    await db.auditLog.create({
      data: {
        actorUserId: null,
        actorAccessType: 'SYSTEM',
        companyId: null,
        action: ['SYSTEM_BACKUP', 'SYSTEM_MAINTENANCE_START', 'SCHEDULED_JOB_RUN', 'CACHE_CLEAR', 'TOKEN_CLEANUP'][index % 5],
        entityType: 'System',
        entityId: 'platform',
        requestId,
        source: 'SEED',
        outcome: 'SUCCESS',
        severity: index % 7 === 0 ? 'WARN' : 'INFO',
        ipAddress: '185.143.10.' + (index + 1),
        userAgent: 'TelecomMarketplaceSeed/1.0',
        metadata: { seedKey: requestId, synthetic: true, durationMs: 100 + index * 25 },
        occurredAt,
      },
    });
    auditCount++;
  }

  console.log('Auth & Audit fixtures ready: ' + challengeCount + ' challenges, ' + auditCount + ' audit logs created.');
  return { authChallenges: challengeCount, auditLogs: auditCount };
}

if (require.main === module) {
  seedAuthAuditDemo()
    .catch((error) => {
      console.error('Auth-audit seed failed:', error);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}

module.exports = { seedAuthAuditDemo };
