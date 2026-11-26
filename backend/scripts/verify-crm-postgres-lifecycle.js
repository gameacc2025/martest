const crypto = require('node:crypto');
const Module = require('node:module');
const prisma = require('../src/config/db');

let failAuditAction = null;
const auditPath = require.resolve('../src/modules/audit/audit.service');
const auditModule = new Module(auditPath);
auditModule.filename = auditPath;
auditModule.loaded = true;
auditModule.exports = {
  recordAuditLogExplicit: async ({ action }) => {
    if (action === failAuditAction) throw new Error('runtime-probe-audit-failure');
    return { id: 'runtime-probe-audit' };
  },
};
require.cache[auditPath] = auditModule;

const crm = require('../src/modules/crm/crm.service');
const { AUDIT_ACTIONS } = require('../src/modules/audit/audit.events');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const staffProfile = await prisma.accessProfile.findFirst({
    where: { type: 'STAFF', isActive: true },
    orderBy: { userId: 'asc' },
    select: { userId: true },
  });
  if (!staffProfile) throw new Error('No active STAFF profile exists for the CRM PostgreSQL probe.');
  const staffId = staffProfile.userId;
  const suffix = crypto.randomUUID().replace(/-/g, '');
  const leadIds = [];
  const accountNames = [];

  async function makeLead(label, status = 'NEW', score = 50) {
    const displayName = 'Runtime CRM ' + label + ' ' + suffix;
    const companyName = 'Runtime CRM Company ' + label + ' ' + suffix;
    const lead = await prisma.lead.create({
      data: {
        leadNumber: 'CP-' + suffix.slice(0, 12) + '-' + label,
        displayName,
        companyName: label === 'MERGE-TARGET' ? null : companyName,
        email: label === 'MERGE-TARGET' ? null : 'crm-' + label.toLowerCase() + '-' + suffix + '@example.invalid',
        phone: label === 'MERGE-TARGET' ? null : '+1998' + suffix.slice(0, 10),
        status,
        score,
        ownerUserId: staffId,
      },
      select: { id: true, displayName: true, companyName: true, email: true, phone: true, status: true, score: true },
    });
    leadIds.push(lead.id);
    accountNames.push(companyName);
    return lead;
  }

  let convertedAccountIds = [];
  try {
    // Two real concurrent requests must converge on one CRMAccount and one primary contact.
    const conversionLead = await makeLead('CONVERT', 'QUALIFIED', 78);
    const conversions = await Promise.allSettled([
      crm.convertLead(conversionLead.id, staffId),
      crm.convertLead(conversionLead.id, staffId),
    ]);
    assert(conversions.every((result) => result.status === 'fulfilled'),
      'Concurrent Lead conversion did not converge idempotently: ' + JSON.stringify(conversions.map((result) => result.status)));

    const convertedLead = await prisma.lead.findUnique({ where: { id: conversionLead.id } });
    assert(convertedLead?.status === 'CONVERTED' && convertedLead.convertedAccountId,
      'Concurrent conversion did not persist the converted Lead and Account reference.');
    convertedAccountIds.push(convertedLead.convertedAccountId);
    const account = await prisma.cRMAccount.findUnique({
      where: { id: convertedLead.convertedAccountId },
      include: { contacts: true },
    });
    assert(account?.displayName === conversionLead.companyName, 'Conversion Account snapshot is incorrect.');
    const conversionAccountCount = await prisma.cRMAccount.count({ where: { displayName: conversionLead.companyName } });
    assert(conversionAccountCount === 1, 'Concurrent conversion created duplicate CRMAccount rows.');
    assert(account.contacts.length === 1 && account.contacts[0].isPrimary,
      'Conversion must create exactly one primary Contact.');
    const conversionHistory = await prisma.leadStatusHistory.count({
      where: { leadId: conversionLead.id, previousStatus: 'QUALIFIED', newStatus: 'CONVERTED' },
    });
    assert(conversionHistory === 1, 'Concurrent conversion wrote an incorrect number of LeadStatusHistory rows.');
    const conversionAudits = await prisma.cRMFieldAudit.count({
      where: { entityType: 'Lead', entityId: String(conversionLead.id) },
    });
    assert(conversionAudits >= 4, 'Conversion field-audit records were not committed.');

    // A thrown audit writer after all business writes must roll the entire transaction back.
    const rollbackLead = await makeLead('ROLLBACK', 'QUALIFIED', 61);
    failAuditAction = AUDIT_ACTIONS.CRM_LEAD_CONVERTED;
    let rollbackError = null;
    try {
      await crm.convertLead(rollbackLead.id, staffId);
    } catch (error) {
      rollbackError = error;
    } finally {
      failAuditAction = null;
    }
    assert(rollbackError?.message === 'runtime-probe-audit-failure',
      'The forced AuditLog failure was not observed by the conversion transaction.');
    const rolledBackLead = await prisma.lead.findUnique({ where: { id: rollbackLead.id } });
    assert(rolledBackLead?.status === 'QUALIFIED' && rolledBackLead.convertedAccountId === null,
      'Lead conversion state escaped a transaction that should have rolled back.');
    const rollbackAccountCount = await prisma.cRMAccount.count({ where: { displayName: rollbackLead.companyName } });
    const rollbackHistoryCount = await prisma.leadStatusHistory.count({ where: { leadId: rollbackLead.id } });
    const rollbackFieldAuditCount = await prisma.cRMFieldAudit.count({
      where: { entityType: 'Lead', entityId: String(rollbackLead.id) },
    });
    assert(rollbackAccountCount === 0 && rollbackHistoryCount === 0 && rollbackFieldAuditCount === 0,
      'Conversion rollback left Account, history or field-audit rows behind.');

    // Competing merge requests must transfer all child records once and mark the source DUPLICATE once.
    const source = await makeLead('MERGE-SOURCE', 'NEW', 88);
    const target = await makeLead('MERGE-TARGET', 'NEW', 24);
    await prisma.cRMActivity.create({
      data: { leadId: source.id, actorUserId: staffId, type: 'CALL', subject: 'Runtime CRM merge activity ' + suffix },
    });
    await prisma.cRMTask.create({
      data: { leadId: source.id, assigneeUserId: staffId, createdByUserId: staffId, title: 'Runtime CRM merge task ' + suffix },
    });
    await prisma.cRMNote.create({
      data: { leadId: source.id, authorUserId: staffId, body: 'Runtime CRM merge note ' + suffix, visibility: 'TEAM' },
    });

    const merges = await Promise.allSettled([
      crm.mergeLeads(source.id, target.id, 'Runtime concurrent duplicate probe', staffId),
      crm.mergeLeads(source.id, target.id, 'Runtime concurrent duplicate probe', staffId),
    ]);
    assert(merges.filter((result) => result.status === 'fulfilled').length === 1,
      'Concurrent Lead merge did not produce exactly one successful transaction.');

    const [sourceAfter, targetAfter] = await Promise.all([
      prisma.lead.findUnique({ where: { id: source.id } }),
      prisma.lead.findUnique({ where: { id: target.id } }),
    ]);
    assert(sourceAfter?.status === 'DUPLICATE', 'Merge source Lead was not marked DUPLICATE.');
    assert(targetAfter?.email === source.email && targetAfter?.phone === source.phone
      && targetAfter?.companyName === source.companyName && targetAfter?.score === source.score,
    'Merge target did not receive the source gaps and higher score.');
    const [targetActivities, targetTasks, targetNotes, sourceActivities, sourceTasks, sourceNotes] = await Promise.all([
      prisma.cRMActivity.count({ where: { leadId: target.id } }),
      prisma.cRMTask.count({ where: { leadId: target.id } }),
      prisma.cRMNote.count({ where: { leadId: target.id } }),
      prisma.cRMActivity.count({ where: { leadId: source.id } }),
      prisma.cRMTask.count({ where: { leadId: source.id } }),
      prisma.cRMNote.count({ where: { leadId: source.id } }),
    ]);
    assert(targetActivities === 1 && targetTasks === 1 && targetNotes === 1
      && sourceActivities === 0 && sourceTasks === 0 && sourceNotes === 0,
    'Merge did not transfer all CRM child records exactly once.');
    const mergeHistory = await prisma.leadStatusHistory.count({
      where: { leadId: source.id, newStatus: 'DUPLICATE' },
    });
    assert(mergeHistory === 1, 'Concurrent merge wrote an incorrect number of source status-history rows.');

    console.log('PASS: PostgreSQL CRM concurrent conversion/idempotent replay, conversion transaction rollback, concurrent merge CAS, child transfer, status history and field audit.');
  } finally {
    failAuditAction = null;
    const ids = [...new Set(leadIds)];
    if (ids.length) {
      await prisma.cRMActivity.deleteMany({ where: { leadId: { in: ids } } });
      await prisma.cRMTask.deleteMany({ where: { leadId: { in: ids } } });
      await prisma.cRMNote.deleteMany({ where: { leadId: { in: ids } } });
      await prisma.leadStatusHistory.deleteMany({ where: { leadId: { in: ids } } });
      await prisma.cRMFieldAudit.deleteMany({ where: { entityType: 'Lead', entityId: { in: ids.map(String) } } });
      await prisma.lead.deleteMany({ where: { id: { in: ids } } });
    }
    const accounts = await prisma.cRMAccount.findMany({
      where: { displayName: { in: accountNames } },
      select: { id: true },
    });
    const accountIds = [...new Set([...convertedAccountIds, ...accounts.map((account) => account.id)])];
    if (accountIds.length) {
      await prisma.cRMFieldAudit.deleteMany({
        where: { entityType: 'CRMAccount', entityId: { in: accountIds.map(String) } },
      });
      await prisma.cRMContact.deleteMany({ where: { accountId: { in: accountIds } } });
      await prisma.cRMAccount.deleteMany({ where: { id: { in: accountIds } } });
    }
  }
}

main()
  .catch((error) => {
    console.error('CRM PostgreSQL lifecycle validation failed:', {
      code: error?.code || null,
      message: error?.message || 'Unknown error',
    });
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
