const prisma = require('../src/config/db');

class ExpectedProbeRollback extends Error {}

async function verifyNotificationDedupe(userId, suffix) {
  const dedupeKey = `runtime-notification-${suffix}`;
  await prisma.$transaction(async (tx) => {
    const row = {
      userId,
      type: 'RUNTIME_IDEMPOTENCY_PROBE',
      title: 'Runtime idempotency probe',
      message: 'Disposable validation row',
      data: null,
      dedupeKey,
    };
    const first = await tx.notification.createMany({ data: [row], skipDuplicates: true });
    const second = await tx.notification.createMany({ data: [row], skipDuplicates: true });
    const count = await tx.notification.count({
      where: { userId, type: row.type, dedupeKey },
    });
    if (first.count !== 1 || second.count !== 0 || count !== 1) {
      throw new Error(`Notification idempotency failed: first=${first.count}, second=${second.count}, count=${count}`);
    }
    await tx.notification.deleteMany({ where: { userId, type: row.type, dedupeKey } });
  });
}

async function verifyAuditIdempotency(suffix) {
  const idempotencyKey = `runtime-audit-${suffix}`;
  const data = {
    idempotencyKey,
    actorUserId: null,
    actorAccessType: 'SYSTEM',
    companyId: null,
    action: 'RUNTIME_IDEMPOTENCY_PROBE',
    entityType: 'RuntimeProbe',
    entityId: idempotencyKey,
    requestId: idempotencyKey,
    source: 'SYSTEM',
    outcome: 'SUCCESS',
    severity: 'INFO',
    ipAddress: 'unknown',
    userAgent: 'runtime-probe',
    metadata: null,
    occurredAt: new Date(),
  };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.auditLog.create({ data });
      try {
        await tx.auditLog.create({ data });
      } catch (error) {
        if (error?.code === 'P2002') throw new ExpectedProbeRollback();
        throw error;
      }
      throw new Error('AuditLog accepted a duplicate idempotency key.');
    });
  } catch (error) {
    if (!(error instanceof ExpectedProbeRollback)) throw error;
  }
}

async function main() {
  const user = await prisma.user.findFirst({ select: { id: true } });
  if (!user) throw new Error('No seeded user is available for the notification idempotency probe.');

  const suffix = `${process.pid}-${Date.now()}`;
  await verifyNotificationDedupe(user.id, suffix);
  await verifyAuditIdempotency(suffix);
  console.log('PASS: in-app notification dedupe and AuditLog idempotency unique constraints reject duplicate operations; probe data is cleaned up or rolled back.');
}

main()
  .catch((error) => {
    console.error('Notification idempotency validation failed:', {
      code: error?.code || null,
      message: error?.message || 'Unknown error',
      meta: error?.meta || null,
    });
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
