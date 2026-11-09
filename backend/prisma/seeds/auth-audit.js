// =============================================================
// Development-only Auth & Audit Demo Seed
//
// Creates realistic demo data for:
//   - AuthChallenge: PASSWORD_RESET, PHONE_VERIFICATION, EMAIL_VERIFICATION, LOGIN_MFA
//   - AuditLog: various action types across all three contexts (STAFF, COMPANY, CUSTOMER)
//
// Run: node prisma/seed.js (will be called from main seed if SEED_AUTH_AUDIT=true)
// =============================================================

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { hashPassword } = require('../src/utils/password');

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000
  })
});

// Demo user accounts for auth-audit scenarios
const DEMO_USERS = [
  // STAFF users
  { phone: '09900000001', email: 'admin1@demo.local', password: 'A123@456', role: 'SUPER_ADMIN', context: 'STAFF' },
  { phone: '09900000002', email: 'admin2@demo.local', password: 'A123@456', role: 'ADMIN', context: 'STAFF' },
  { phone: '09900000003', email: 'moderator@demo.local', password: 'A123@456', role: 'MODERATOR', context: 'STAFF' },

  // COMPANY users (linked to first demo company)
  { phone: '09900000101', email: 'manager@demo.local', password: 'A123@456', role: 'COMPANY_MANAGER', context: 'COMPANY', companyName: 'آرمان شبکه پارس' },
  { phone: '09900000102', email: 'catalog@demo.local', password: 'A123@456', role: 'COMPANY_USER', context: 'COMPANY', companyName: 'آرمان شبکه پارس' },
  { phone: '09900000103', email: 'sales@demo.local', password: 'A123@456', role: 'COMPANY_USER', context: 'COMPANY', companyName: 'آرمان شبکه پارس' },

  // CUSTOMER users
  { phone: '09900000201', email: 'customer1@demo.local', password: 'A123@456', role: 'CUSTOMER_USER', context: 'CUSTOMER', firstName: 'مهدی', lastName: 'احمدی' },
  { phone: '09900000202', email: 'customer2@demo.local', password: 'A123@456', role: 'CUSTOMER_USER', context: 'CUSTOMER', firstName: 'سارا', lastName: 'محمدی' },
  { phone: '09900000203', email: 'customer3@demo.local', password: 'A123@456', role: 'CUSTOMER_USER', context: 'CUSTOMER', firstName: 'علی', lastName: 'رضایی' },
];

// Auth challenge purposes we'll seed
const CHALLENGE_PURPOSES = ['PASSWORD_RESET', 'PHONE_VERIFICATION', 'EMAIL_VERIFICATION', 'LOGIN_MFA'];

// Audit action types by context
const AUDIT_ACTIONS = {
  STAFF: [
    'USER_CREATE', 'USER_UPDATE', 'USER_DELETE', 'USER_ACTIVATE', 'USER_DEACTIVATE',
    'ROLE_ASSIGN', 'ROLE_REVOKE', 'PERMISSION_ASSIGN',
    'COMPANY_CREATE', 'COMPANY_UPDATE', 'COMPANY_DELETE', 'COMPANY_VERIFY',
    'PRODUCT_APPROVE', 'PRODUCT_REJECT', 'PRODUCT_PUBLISH', 'PRODUCT_HIDE',
    'CATEGORY_CREATE', 'CATEGORY_UPDATE', 'CATEGORY_DELETE',
    'BANNER_CREATE', 'BANNER_UPDATE', 'BANNER_DELETE',
    'CMS_ARTICLE_CREATE', 'CMS_ARTICLE_UPDATE', 'CMS_ARTICLE_DELETE',
    'SYSTEM_SETTINGS_UPDATE', 'INQUIRY_PLAN_CREATE', 'INQUIRY_SUBSCRIPTION_ACTIVATE',
  ],
  COMPANY: [
    'COMPANY_PROFILE_UPDATE', 'COMPANY_LOGO_UPDATE',
    'PRODUCT_CREATE', 'PRODUCT_UPDATE', 'PRODUCT_DELETE', 'PRODUCT_SUBMIT_REVIEW', 'PRODUCT_PUBLISH',
    'PRODUCT_IMAGE_UPLOAD', 'PRODUCT_DOCUMENT_UPLOAD',
    'INQUIRY_RESPOND', 'INQUIRY_MESSAGE_SEND',
    'USER_INVITE', 'USER_UPDATE', 'USER_DEACTIVATE',
    'SETTINGS_UPDATE',
  ],
  CUSTOMER: [
    'PROFILE_UPDATE', 'PASSWORD_CHANGE', 'AVATAR_UPLOAD', 'AVATAR_DELETE',
    'ADDRESS_CREATE', 'ADDRESS_UPDATE', 'ADDRESS_DELETE',
    'INQUIRY_CREATE', 'INQUIRY_MESSAGE_SEND',
    'ORDER_CREATE', 'ORDER_CANCEL',
    'NOTIFICATION_PREFERENCE_UPDATE',
    'PHONE_VERIFY', 'EMAIL_VERIFY', 'MFA_ENABLE', 'MFA_DISABLE',
    'SESSION_REVOKE', 'SESSION_REVOKE_ALL',
  ],
};

// Audit entity types
const ENTITY_TYPES = ['User', 'Company', 'Product', 'Category', 'Inquiry', 'Order', 'Banner', 'CMSArticle', 'Role', 'Permission', 'Settings', 'Profile', 'Address', 'Session'];

// IP ranges for realistic geo distribution
const IP_RANGES = [
  { prefix: '185.143', city: 'تهران', country: 'ایران' },
  { prefix: '185.144', city: 'مشهد', country: 'ایران' },
  { prefix: '185.145', city: 'اصفهان', country: 'ایران' },
  { prefix: '185.146', city: 'شیراز', country: 'ایران' },
  { prefix: '185.147', city: 'تبریز', country: 'ایران' },
  { prefix: '2.180', city: 'تهران', country: 'ایران' },
  { prefix: '2.181', city: 'مشهد', country: 'ایران' },
  { prefix: '2.182', city: 'اصفهان', country: 'ایران' },
  { prefix: '5.144', city: 'تهران', country: 'ایران' },
  { prefix: '5.145', city: 'کرج', country: 'ایران' },
];

// User agents for realistic device diversity
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
  'TelecomMarket/1.0 (iOS 17.2; iPhone15,2)',
  'TelecomMarket/1.0 (Android 14; Pixel 8)',
];

function randomIp() {
  const range = IP_RANGES[Math.floor(Math.random() * IP_RANGES.length)];
  const octet3 = Math.floor(Math.random() * 256);
  const octet4 = Math.floor(Math.random() * 256);
  return `${range.prefix}.${octet3}.${octet4}`;
}

function randomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function randomDate(daysBack = 30) {
  const now = new Date();
  const past = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
}

async function seedAuthAuditDemo() {
  console.log('Seeding Auth & Audit demo data...\n');

  // Check if we should run this seed
  if (process.env.NODE_ENV !== 'development' || process.env.SEED_AUTH_AUDIT === 'false') {
    console.log('Skipping auth-audit demo data outside development or explicitly disabled.');
    return { authChallenges: 0, auditLogs: 0 };
  }

  // Get existing users and roles
  const users = await prisma.user.findMany({
    where: { phone: { in: DEMO_USERS.map(u => u.phone) } },
    include: {
      accessProfile: true,
      roles: { include: { role: true } },
      profile: true,
      company: true,
    },
  });

  if (users.length === 0) {
    console.log('No demo users found. Run main seed first.');
    return { authChallenges: 0, auditLogs: 0 };
  }

  // Get companies
  const companies = await prisma.company.findMany({
    where: { name: { in: ['آرمان شبکه پارس', 'پارس فیبر ایرانیان'] } },
  });
  const companyByName = new Map(companies.map(c => [c.name, c]));

  // Get roles
  const roles = await prisma.role.findMany({
    where: { name: { in: ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'COMPANY_MANAGER', 'COMPANY_USER', 'CUSTOMER_USER'] } },
  });
  const roleByName = new Map(roles.map(r => [r.name, r]));

  // ────────────────────────────────────────────────────────────
  // 1. Seed AuthChallenges
  // ────────────────────────────────────────────────────────────
  console.log('Creating AuthChallenges...');
  let challengeCount = 0;

  for (const user of users) {
    const context = user.accessProfile?.type || 'CUSTOMER';

    // Each user gets 3-5 challenges across different purposes
    const numChallenges = 3 + Math.floor(Math.random() * 3);

    for (let i = 0; i < numChallenges; i++) {
      const purpose = CHALLENGE_PURPOSES[Math.floor(Math.random() * CHALLENGE_PURPOSES.length)];
      const createdAt = randomDate(14); // Within last 2 weeks

      // Most challenges are consumed (used), some expired, few pending
      const statusRand = Math.random();
      let status, consumedAt, expiredAt;

      if (statusRand < 0.7) {
        status = 'CONSUMED';
        consumedAt = new Date(createdAt.getTime() + Math.random() * 300000); // Consumed within 5 min
        expiredAt = new Date(createdAt.getTime() + 15 * 60 * 1000); // 15 min TTL
      } else if (statusRand < 0.9) {
        status = 'EXPIRED';
        expiredAt = new Date(createdAt.getTime() + 15 * 60 * 1000);
      } else {
        status = 'PENDING';
        expiredAt = new Date(createdAt.getTime() + 15 * 60 * 1000);
      }

      // Generate challenge code (6 digits for MFA/verification, longer token for password reset)
      const code = purpose === 'LOGIN_MFA' || purpose === 'PHONE_VERIFICATION' || purpose === 'EMAIL_VERIFICATION'
        ? String(Math.floor(100000 + Math.random() * 900000))
        : `pwd_reset_${Math.random().toString(36).substring(2, 15)}`;

      const challenge = await prisma.authChallenge.create({
        data: {
          userId: user.id,
          purpose,
          code,
          status,
          channel: purpose === 'PHONE_VERIFICATION' || purpose === 'LOGIN_MFA' ? 'SMS' : 'EMAIL',
          sentTo: purpose === 'PHONE_VERIFICATION' || purpose === 'LOGIN_MFA'
            ? user.phone
            : user.email,
          meta: {
            ipAddress: randomIp(),
            userAgent: randomUserAgent(),
            deviceFingerprint: `fp_${Math.random().toString(36).substring(2, 10)}`,
          },
          createdAt,
          consumedAt,
          expiredAt,
        },
      });
      challengeCount++;
    }
  }
  console.log(`  ✓ ${challengeCount} AuthChallenges created`);

  // ────────────────────────────────────────────────────────────
  // 2. Seed AuditLogs
  // ────────────────────────────────────────────────────────────
  console.log('Creating AuditLogs...');
  let auditCount = 0;

  // Get some entities to reference
  const products = await prisma.product.findMany({ take: 10, select: { id: true, title: true } });
  const categories = await prisma.category.findMany({ take: 5, select: { id: true, slug: true } });
  const inquiries = await prisma.inquiry.findMany({ take: 5, select: { id: true } });
  const orders = await prisma.order.findMany({ take: 5, select: { id: true } });

  // Build pool of target entities
  const entityPool = [
    ...users.map(u => ({ type: 'User', id: u.id, label: u.phone })),
    ...companies.map(c => ({ type: 'Company', id: c.id, label: c.name })),
    ...products.map(p => ({ type: 'Product', id: p.id, label: p.title })),
    ...categories.map(c => ({ type: 'Category', id: c.id, label: c.slug })),
    ...inquiries.map(i => ({ type: 'Inquiry', id: i.id, label: `INQ-${i.id.slice(-6)}` })),
    ...orders.map(o => ({ type: 'Order', id: o.id, label: `ORD-${o.id.slice(-6)}` })),
    { type: 'Settings', id: 'platform', label: 'Platform Settings' },
    { type: 'Settings', id: 'company', label: 'Company Settings' },
    { type: 'Role', id: roleByName.get('SUPER_ADMIN')?.id, label: 'SUPER_ADMIN' },
    { type: 'Role', id: roleByName.get('ADMIN')?.id, label: 'ADMIN' },
    { type: 'Role', id: roleByName.get('COMPANY_MANAGER')?.id, label: 'COMPANY_MANAGER' },
  ];

  // Helper to get actions for a user's context
  function getActionsForContext(context) {
    return AUDIT_ACTIONS[context] || AUDIT_ACTIONS.CUSTOMER;
  }

  // Seed audit logs for each user
  for (const user of users) {
    const context = user.accessProfile?.type || 'CUSTOMER';
    const actions = getActionsForContext(context);

    // Each user gets 10-30 audit log entries
    const numLogs = 10 + Math.floor(Math.random() * 20);

    for (let i = 0; i < numLogs; i++) {
      const action = actions[Math.floor(Math.random() * actions.length)];
      const occurredAt = randomDate(30);

      // Pick a relevant target entity
      const relevantEntities = entityPool.filter(e => {
        // STAFF can touch anything
        if (context === 'STAFF') return true;
        // COMPANY users touch their company's entities + products + inquiries
        if (context === 'COMPANY') {
          if (e.type === 'Company' && e.id !== user.company?.id) return false;
          return true;
        }
        // CUSTOMER users touch their own profile, addresses, inquiries, orders
        if (context === 'CUSTOMER') {
          if (e.type === 'User' && e.id !== user.id) return false;
          return ['Profile', 'Address', 'Inquiry', 'Order', 'Session'].includes(e.type);
        }
        return true;
      });

      const targetEntity = relevantEntities.length > 0
        ? relevantEntities[Math.floor(Math.random() * relevantEntities.length)]
        : entityPool[Math.floor(Math.random() * entityPool.length)];

      // Build metadata
      const meta = {
        ipAddress: randomIp(),
        userAgent: randomUserAgent(),
        requestId: `req_${Math.random().toString(36).substring(2, 15)}`,
      };

      // Add context-specific metadata
      if (action.includes('PASSWORD') || action.includes('MFA') || action.includes('VERIFY')) {
        meta.authMethod = action.includes('SMS') || action.includes('PHONE') ? 'SMS' : 'EMAIL';
      }
      if (action.includes('SESSION')) {
        meta.sessionId = `sess_${Math.random().toString(36).substring(2, 10)}`;
      }

      // Actor info
      const actor = {
        id: user.id,
        phone: user.phone,
        email: user.email,
        context,
        roles: user.roles.map(ur => ur.role.name),
      };

      // Randomly include a target entity (80% chance)
      let entityType = null;
      let entityId = null;
      if (Math.random() < 0.8) {
        entityType = targetEntity.type;
        entityId = targetEntity.id;
      }

      // Before/after snapshots for update actions
      let before = null;
      let after = null;
      if (action.includes('UPDATE') || action.includes('CHANGE') || action.includes('ASSIGN') || action.includes('REVOKE')) {
        before = { updatedAt: new Date(occurredAt.getTime() - 86400000).toISOString() };
        after = { updatedAt: occurredAt.toISOString() };
      }

      await prisma.auditLog.create({
        data: {
          actorUserId: user.id,
          actorContext: context,
          action,
          entityType,
          entityId,
          before,
          after,
          meta,
          occurredAt,
        },
      });
      auditCount++;
    }
  }

  // Add some system-generated audit logs (no actor user)
  const systemActions = [
    'SYSTEM_BACKUP', 'SYSTEM_MAINTENANCE_START', 'SYSTEM_MAINTENANCE_END',
    'SCHEDULED_JOB_RUN', 'CACHE_CLEAR', 'TOKEN_CLEANUP',
    'PASSWORD_EXPIRY_NOTICE', 'SUBSCRIPTION_RENEWAL', 'SETTLEMENT_PROCESS',
  ];

  for (let i = 0; i < 20; i++) {
    const action = systemActions[Math.floor(Math.random() * systemActions.length)];
    const occurredAt = randomDate(30);

    await prisma.auditLog.create({
      data: {
        actorUserId: null,
        actorContext: 'SYSTEM',
        action,
        entityType: 'System',
        entityId: 'platform',
        meta: {
          jobId: `job_${Math.random().toString(36).substring(2, 10)}`,
          durationMs: Math.floor(Math.random() * 5000),
        },
        occurredAt,
      },
    });
    auditCount++;
  }

  console.log(`  ✓ ${auditCount} AuditLogs created`);
  console.log('\nAuth & Audit demo seed completed!');
  console.log(`  AuthChallenges: ${challengeCount}`);
  console.log(`  AuditLogs: ${auditCount}`);

  return { authChallenges: challengeCount, auditLogs: auditCount };
}

// Allow running standalone
if (require.main === module) {
  seedAuthAuditDemo()
    .catch(e => {
      console.error('Auth-audit seed failed:', e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

module.exports = { seedAuthAuditDemo };