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

  // Notify only active staff who currently hold assignments in this queue.
  if (ticket.assignedQueueId) {
    const queueAssignments = await prismaClient.supportAssignment.findMany({
      where: {
        queueId: ticket.assignedQueueId,
        endedAt: null,
        assignedUserId: { not: null },
        assignee: {
          is: {
            status: 'ACTIVE',
            accessProfile: { is: { type: 'STAFF', isActive: true } },
          },
        },
      },
      select: { assignedUserId: true },
    });
    queueAssignments.forEach((assignment) => {
      if (assignment.assignedUserId) recipientIds.add(assignment.assignedUserId);
    });
  }

  if (recipientIds.size === 0) {
    console.warn('[sla-monitor] escalation has no eligible assignee; broad staff broadcast skipped', {
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      queueId: ticket.assignedQueueId,
    });
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

  // Include only active staff currently assigned within this queue.
  if (ticket.assignedQueueId) {
    const queueAssignments = await prismaClient.supportAssignment.findMany({
      where: {
        queueId: ticket.assignedQueueId,
        endedAt: null,
        assignedUserId: { not: null },
        assignee: {
          is: {
            status: 'ACTIVE',
            accessProfile: { is: { type: 'STAFF', isActive: true } },
          },
        },
      },
      select: { assignedUserId: true },
    });
    queueAssignments.forEach((assignment) => {
      if (assignment.assignedUserId) recipientIds.add(assignment.assignedUserId);
    });
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

async function runOnce() {
  try {
    const result = await checkAndEscalateTickets();
    const total = result.escalated + result.warned + result.breached;
    if (total > 0) {
      console.log('[sla-monitor] batch completed', JSON.stringify(result));
    }
    return result;
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

module.exports = { runOnce, checkAndEscalateTickets, escalateTicket, warnTicketStakeholders };

if (require.main === module) {
  process.on('SIGINT', () => stop('SIGINT'));
  process.on('SIGTERM', () => stop('SIGTERM'));

  main().catch(async (error) => {
    console.error('[sla-monitor] fatal error', error?.message || error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
}