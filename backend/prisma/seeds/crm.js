const prisma = require('../../src/config/db');

async function seedCrm() {
  if (process.env.NODE_ENV === 'production') {
    console.log('[crm-seed] Production detected; demo CRM fixtures skipped.');
    return { skipped: true };
  }

  const staffProfile = await prisma.accessProfile.findFirst({
    where: { type: 'STAFF', isActive: true },
    orderBy: { userId: 'asc' },
    select: { userId: true },
  });
  if (!staffProfile) {
    console.warn('[crm-seed] No active STAFF profile; CRM demo fixtures skipped.');
    return { skipped: true };
  }
  const ownerUserId = staffProfile.userId;

  const sourceFixtures = [
    { code: 'WEB_FORM', label: 'فرم وب‌سایت', sortOrder: 1 },
    { code: 'TRADE_EVENT', label: 'نمایشگاه تخصصی', sortOrder: 2 },
    { code: 'REFERRAL', label: 'معرفی همکار', sortOrder: 3 },
    { code: 'INBOUND_CALL', label: 'تماس ورودی', sortOrder: 4 },
  ];
  const sources = {};
  for (const source of sourceFixtures) {
    sources[source.code] = await prisma.leadSource.upsert({
      where: { code: source.code },
      update: { label: source.label, isActive: true, sortOrder: source.sortOrder },
      create: { ...source, isActive: true },
    });
  }

  const leadFixtures = [
    { leadNumber: 'DEMO-CRM-LEAD-001', displayName: 'گروه شبکه آریا (نمونه)', companyName: 'گروه شبکه آریا (نمونه)', email: 'contact@arya-network.example.test', phone: '+10000001001', sourceId: sources.WEB_FORM.id, status: 'QUALIFIED', score: 86 },
    { leadNumber: 'DEMO-CRM-LEAD-002', displayName: 'مرکز داده سپهر (نمونه)', companyName: 'مرکز داده سپهر (نمونه)', email: 'sales@sepehr-dc.example.test', phone: '+10000001002', sourceId: sources.TRADE_EVENT.id, status: 'CONTACTED', score: 62 },
    { leadNumber: 'DEMO-CRM-LEAD-003', displayName: 'اپراتور ارتباطی نمونه', companyName: 'اپراتور ارتباطی نمونه', email: 'procurement@operator.example.test', phone: '+10000001003', sourceId: sources.REFERRAL.id, status: 'NEW', score: 35 },
  ];
  const leads = {};
  for (const lead of leadFixtures) {
    leads[lead.leadNumber] = await prisma.lead.upsert({
      where: { leadNumber: lead.leadNumber },
      update: { ...lead, ownerUserId },
      create: { ...lead, ownerUserId },
    });
  }

  let pipeline = await prisma.pipeline.findFirst({ where: { name: 'قیف فروش تجهیزات سازمانی (DEMO)' } });
  if (!pipeline) pipeline = await prisma.pipeline.create({ data: { name: 'قیف فروش تجهیزات سازمانی (DEMO)', isDefault: true, isActive: true } });
  const stageFixtures = [
    { code: 'QUALIFICATION', label: 'ارزیابی نیاز', sortOrder: 1, probability: 20 },
    { code: 'PROPOSAL', label: 'ارسال پیشنهاد', sortOrder: 2, probability: 55 },
    { code: 'NEGOTIATION', label: 'مذاکره', sortOrder: 3, probability: 80 },
    { code: 'WON', label: 'موفق', sortOrder: 4, probability: 100, isWon: true },
    { code: 'LOST', label: 'از دست‌رفته', sortOrder: 5, probability: 0, isLost: true },
  ];
  const stages = {};
  for (const stage of stageFixtures) {
    stages[stage.code] = await prisma.pipelineStage.upsert({
      where: { pipelineId_code: { pipelineId: pipeline.id, code: stage.code } },
      update: stage,
      create: { ...stage, pipelineId: pipeline.id },
    });
  }

  let account = await prisma.cRMAccount.findFirst({ where: { displayName: 'گروه شبکه آریا (نمونه)' } });
  if (!account) {
    account = await prisma.cRMAccount.create({
      data: {
        displayName: 'گروه شبکه آریا (نمونه)', accountType: 'PROSPECT', ownerUserId,
        source: 'DEMO-CRM', notes: 'رکورد ساختگی برای محیط توسعه؛ فاقد مشتری واقعی.',
        contacts: { create: { name: 'واحد خرید نمونه', email: 'contact@arya-network.example.test', phone: '+10000001001', isPrimary: true } },
      },
    });
  }
  const opportunity = await prisma.opportunity.upsert({
    where: { opportunityNumber: 'DEMO-CRM-OPP-001' },
    update: { accountId: account.id, pipelineId: pipeline.id, stageId: stages.PROPOSAL.id, ownerUserId, title: 'تأمین سوئیچ شبکه سازمانی (نمونه)', amount: '1250000000', currency: 'IRR', status: 'OPEN' },
    create: { opportunityNumber: 'DEMO-CRM-OPP-001', accountId: account.id, pipelineId: pipeline.id, stageId: stages.PROPOSAL.id, ownerUserId, title: 'تأمین سوئیچ شبکه سازمانی (نمونه)', amount: '1250000000', currency: 'IRR', status: 'OPEN' },
  });

  const activityExists = await prisma.cRMActivity.findFirst({ where: { leadId: leads['DEMO-CRM-LEAD-001'].id, subject: 'تماس اولیه با واحد خرید (DEMO)' } });
  if (!activityExists) await prisma.cRMActivity.create({
    data: { type: 'CALL', subject: 'تماس اولیه با واحد خرید (DEMO)', body: 'نیاز به بررسی ظرفیت پورت و زمان تحویل؛ داده کاملاً ساختگی.', actorUserId: ownerUserId, leadId: leads['DEMO-CRM-LEAD-001'].id },
  });
  const taskExists = await prisma.cRMTask.findFirst({ where: { title: 'ارسال دیتاشیت تجهیزات نمونه', leadId: leads['DEMO-CRM-LEAD-001'].id } });
  if (!taskExists) await prisma.cRMTask.create({
    data: { title: 'ارسال دیتاشیت تجهیزات نمونه', description: 'وظیفه نمایشی CRM؛ بدون ارسال واقعی.', status: 'OPEN', priority: 'HIGH', assigneeUserId: ownerUserId, createdByUserId: ownerUserId, dueAt: new Date(Date.now() + 86400000), leadId: leads['DEMO-CRM-LEAD-001'].id },
  });
  const noteExists = await prisma.cRMNote.findFirst({ where: { leadId: leads['DEMO-CRM-LEAD-001'].id, body: 'یادداشت تیمی نمونه CRM' } });
  if (!noteExists) await prisma.cRMNote.create({
    data: { body: 'یادداشت تیمی نمونه CRM', visibility: 'TEAM', authorUserId: ownerUserId, leadId: leads['DEMO-CRM-LEAD-001'].id },
  });
  const initialHistory = await prisma.opportunityStageHistory.findFirst({ where: { opportunityId: opportunity.id } });
  if (!initialHistory) await prisma.opportunityStageHistory.create({
    data: { opportunityId: opportunity.id, toStageId: stages.PROPOSAL.id, actorUserId: ownerUserId, reason: 'ایجاد فرصت نمایشی CRM' },
  });

  console.log('[crm-seed] CRM demo fixtures ready.');
  return { skipped: false, leads: leadFixtures.length, sources: sourceFixtures.length, opportunities: 1 };
}

module.exports = seedCrm;
