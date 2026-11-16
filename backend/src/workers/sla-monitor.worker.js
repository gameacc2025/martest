// SLA Monitor Worker for Support Tickets
// Monitors SLA deadlines, triggers escalations, and updates ticket statuses

const prisma = require('../config/db');
const { dispatchNotification } = require('../modules/notifications/notification.dispatch.service');
const supportService = require('../modules/support/support.service');

const intervalMs = Math.max(60000, Number(process.env.SLA_WORKER_INTERVAL_MS) || 300000); // Default 5 minutes
const batchSize = Math.min(500, Math.max(1, Number(process.env.SLA_WORKER_BATCH_SIZE) || 100));
let stopping = false;

async function checkAndEscalateTickets() {
  const now = new Date();
  let escalated = 0;
  let warned = 0;
  let breached = 0;

  // Find tickets with active SLA deadlines that are approaching or breached
  const tickets = await prisma.supportTicket.findMany({
    where: {
      status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'WAITING_COMPANY'] },
      OR: [
        { firstResponseDueAt: { lte: now } },
        { resolveDueAt: { lte: now } },
      ],
    },
    include: {
      category: { include: { slaPolicies: { where: { isActive: true } } } },
      assignedUser: { select: { id: true, email: true } },
      assignedQueue: { select: { id: true, name: true } },
      requester: { select: { id: true, email: true } },
      requesterCompany: { select: { id: true, name: true } },
    },
    take: batchSize,
  });

  for (const ticket of tickets) {
    try {
      const slaDetails = await supportService.getSlaDetails(prisma, ticket.id);
      if (!slaDetails) continue;

      const { firstResponse, resolution } = slaDetails;

      // Check first response SLA
      if (!ticket.firstRespondedAt) {
        if (firstResponse.isBreached) {
          // First response SLA breached - escalate
          await escalateTicket(prisma, ticket, 'FIRST_RESPONSE_BREACHED', slaDetails);
          breached++;
        } else if (firstResponse.isAtRisk) {
          // First response SLA at risk - warn
          await warnTicketStakeholders(prisma, ticket, 'FIRST_RESPONSE_AT_RISK', firstResponse);
          warned++;
        }
      }

      // Check resolution SLA
      if (!ticket.resolvedAt && !ticket.closedAt) {
        if (resolution.isBreached) {
          // Resolution SLA breached - escalate
          await escalateTicket(prisma, ticket, 'RESOLUTION_BREACHED', slaDetails);
          breached++;
        } else if (resolution.isAtRisk) {
          // Resolution SLA at risk - warn
          await warnTicketStakeholders(prisma, ticket, 'RESOLUTION_AT_RISK', resolution);
          warned++;
        }
      }
    } catch (error) {
      console.error(`[sla-monitor] Error processing ticket ${ticket.id}:`, error?.message || error);
    }
  }

  return { escalated, warned, breached };
}

async function escalateTicket(prismaClient, ticket, escalationType, slaDetails) {
  // Check if already escalated for this type recently
  const recentEvent = await prismaClient.supportEvent.findFirst({
    where: {
      ticketId: ticket.id,
      eventType: `SLA_${escalationType}`,
      occurredAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
    },
  });

  if (recentEvent) return; // Already escalated recently

  // Record escalation event
  await prismaClient.supportEvent.create({
    data: {
      ticketId: ticket.id,
      actorUserId: null, // System event
      eventType: `SLA_${escalationType}`,
      dedupeKey: `sla-${escalationType.toLowerCase()}:${ticket.id}`,
      payload: {
        escalationType,
        slaDetails,
        ticketNumber: ticket.ticketNumber,
        ticketSubject: ticket.subject,
        escalatedAt: new Date().toISOString(),
      },
    },
  });

  // Determine escalation recipients
  const recipientIds = new Set();

  // Current assignee
  if (ticket.assignedUserId) recipientIds.add(ticket.assignedUserId);

  // Queue members
  if (ticket.assignedQueueId) {
    const queueMembers = await prismaClient.user.findMany({
      where: {
        accessProfile: { type: 'STAFF', isActive: true },
        status: 'ACTIVE',
      },
      select: { id: true },
    });
    queueMembers.forEach(m => recipientIds.add(m.id));
  }

  // Fallback: all STAFF with tickets.read permission
  if (recipientIds.size === 0) {
    const staff = await prismaClient.user.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { roles: { some: { role: { name: 'SUPER_ADMIN' } } } },
          {
            roles: {
              some: { role: { permissions: { some: { permission: { name: 'tickets.read' } } } } },
            },
          },
        ],
      },
      select: { id: true },
    });
    staff.forEach(s => recipientIds.add(s.id));
  }

  // Send escalation notification
  if (recipientIds.size > 0) {
    await dispatchNotification('SUPPORT_SLA_ESCALATED', [...recipientIds], {
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
      },
      escalationType,
      slaDetails,
    }, {
      dedupeKey: (uid) => `sla-escalated:${ticket.id}:${escalationType}-${uid}`,
    });
  }
}

async function warnTicketStakeholders(prismaClient, ticket, warningType, slaInfo) {
  // Check if already warned recently
  const recentEvent = await prismaClient.supportEvent.findFirst({
    where: {
      ticketId: ticket.id,
      eventType: `SLA_${warningType}`,
      occurredAt: { gte: new Date(Date.now() - 4 * 60 * 60 * 1000) }, // Last 4 hours
    },
  });

  if (recentEvent) return;

  // Record warning event
  await prismaClient.supportEvent.create({
    data: {
      ticketId: ticket.id,
      actorUserId: null,
      eventType: `SLA_${warningType}`,
      dedupeKey: `sla-${warningType.toLowerCase()}:${ticket.id}`,
      payload: {
        warningType,
        slaInfo,
        ticketNumber: ticket.ticketNumber,
        ticketSubject: ticket.subject,
        warnedAt: new Date().toISOString(),
      },
    },
  });

  // Notify assignee and queue members
  const recipientIds = new Set();
  if (ticket.assignedUserId) recipientIds.add(ticket.assignedUserId);

  if (ticket.assignedQueueId) {
    const queueMembers = await prismaClient.user.findMany({
      where: {
        accessProfile: { type: 'STAFF', isActive: true },
        status: 'ACTIVE',
      },
      select: { id: true },
    });
    queueMembers.forEach(m => recipientIds.add(m.id));
  }

  if (recipientIds.size > 0) {
    await dispatchNotification('SUPPORT_SLA_WARNING', [...recipientIds], {
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
      },
      warningType,
      slaInfo,
    }, {
      dedupeKey: (uid) => `sla-warning:${ticket.id}:${warningType}-${uid}`,
    });
  }
}

async function checkPausedSlas() {
  // Check for tickets with paused SLA that should be auto-resumed
  // This is a placeholder for future implementation of SLA pause/resume logic
  // Could check for events like SLA_PAUSED and auto-resume after certain conditions
  return { resumed: 0 };
}

async function runOnce() {
  const startedAt = Date.now();
  try {
    const [escalationResult, resumeResult] = await Promise.all([
      checkAndEscalateTickets(),
      checkPausedSlas(),
    ]);

    const total = escalationResult.escalated + escalationResult.warned + escalationResult.breached + resumeResult.resumed;
    if (total > 0) {
      console.log('[sla-monitor] batch completed', JSON.stringify({ ...escalationResult, ...resumeResult }));
    }
    return { ...escalationResult, ...resumeResult };
  } catch (error) {
    console.error('[sla-monitor] batch failed', error?.message || error);
    throw error;
  }
}

async function main() {
  console.log(`[sla-monitor] started; interval=${intervalMs}ms batch=${batchSize}`);
  while (!stopping) {
    const startedAt = Date.now();
    try {
      await runOnce();
    } catch (error) {
      console.error('[sla-monitor] batch failed', error?.message || error);
    }
    if (!stopping) {
      const waitMs = Math.max(0, intervalMs - (Date.now() - startedAt));
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
  await prisma.$disconnect();
  console.log('[sla-monitor] stopped');
}

function stop(signal) {
  if (stopping) return;
  stopping = true;
  console.log(`[sla-monitor] received ${signal}; stopping after current batch`);
}

process.on('SIGINT', () => stop('SIGINT'));
process.on('SIGTERM', () => stop('SIGTERM'));

main().catch(async (error) => {
  console.error('[sla-monitor] fatal error', error?.message || error);
  await prisma.$disconnect();
  process.exitCode = 1;
});

module.exports = { checkAndEscalateTickets, escalateTicket, warnTicketStakeholders };