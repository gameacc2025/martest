const prisma = require('../../config/db');
const { createError } = require('../audit/audit.utils');

const transitions = {
  NEW: ['CONTACTED', 'QUALIFIED', 'DISQUALIFIED', 'DUPLICATE', 'LOST'],
  CONTACTED: ['QUALIFIED', 'DISQUALIFIED', 'DUPLICATE', 'LOST'],
  QUALIFIED: ['CONVERTED', 'DISQUALIFIED', 'DUPLICATE', 'LOST'],
  CONVERTED: [], DISQUALIFIED: [], DUPLICATE: [], LOST: [],
};
const fail = (status, code, message) => { throw createError(status, code, message); };
const idOf = (value) => {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) fail(400, 'INVALID_ID', 'شناسه نامعتبر است.');
  return id;
};
const pageOf = (v, d, max) => Number.isInteger(Number(v)) && Number(v) > 0 ? Math.min(Number(v), max) : d;
const safe = (v) => {
  if (typeof v === 'bigint') return v.toString();
  if (Array.isArray(v)) return v.map(safe);
  if (v && typeof v === 'object' && !(v instanceof Date)) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, safe(x)]));
  return v;
};
async function assertStaff(db, userId) {
  const id = idOf(userId);
  const profile = await db.accessProfile.findFirst({ where: { userId: id, type: 'STAFF', isActive: true }, select: { userId: true } });
  if (!profile) fail(400, 'CRM_STAFF_REQUIRED', 'مسئول انتخاب‌شده باید کارمند فعال سامانه باشد.');
  return id;
}
function exactlyOneParent(input) {
  const keys = ['leadId', 'accountId', 'opportunityId'].filter((k) => input[k] !== undefined && input[k] !== null && input[k] !== '');
  if (keys.length !== 1) fail(400, 'CRM_PARENT_REQUIRED', 'رکورد باید دقیقاً به یک سرنخ، حساب یا فرصت متصل باشد.');
  return { [keys[0]]: idOf(input[keys[0]]) };
}
const leadInclude = { source: { select: { id: true, code: true, label: true } }, owner: { select: { id: true, email: true } } };
const leadDto = (x) => safe({
  id: x.id, leadNumber: x.leadNumber, displayName: x.displayName, companyName: x.companyName,
  email: x.email, phone: x.phone, status: x.status, score: x.score, sourceId: x.sourceId,
  ownerUserId: x.ownerUserId, convertedAccountId: x.convertedAccountId, convertedAt: x.convertedAt,
  disqualifiedReason: x.disqualifiedReason, createdAt: x.createdAt, updatedAt: x.updatedAt,
  source: x.source, owner: x.owner,
});
async function listLeads(q = {}) {
  const page = pageOf(q.page, 1, 100000), limit = pageOf(q.limit, 25, 100);
  const where = {};
  if (q.status) where.status = q.status;
  if (q.sourceId) where.sourceId = idOf(q.sourceId);
  if (q.ownerUserId) where.ownerUserId = idOf(q.ownerUserId);
  if (q.search) {
    const search = String(q.search).trim().slice(0, 120);
    where.OR = ['displayName', 'companyName', 'email', 'phone', 'leadNumber'].map((key) => ({ [key]: { contains: search, mode: 'insensitive' } }));
  }
  if (q.scoreMin !== undefined || q.scoreMax !== undefined) {
    where.score = {};
    if (q.scoreMin !== undefined) where.score.gte = Math.max(0, Math.min(100, Number(q.scoreMin)));
    if (q.scoreMax !== undefined) where.score.lte = Math.max(0, Math.min(100, Number(q.scoreMax)));
  }
  const [total, rows] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.findMany({ where, include: leadInclude, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
  ]);
  return { data: rows.map(leadDto), meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}
async function getLead(id) {
  const row = await prisma.lead.findUnique({ where: { id: idOf(id) }, include: leadInclude });
  if (!row) fail(404, 'CRM_LEAD_NOT_FOUND', 'سرنخ پیدا نشد.');
  return leadDto(row);
}
async function createLead(input, actorId) {
  const ownerUserId = await assertStaff(prisma, actorId);
  const displayName = String(input.displayName || '').trim();
  const score = input.score === undefined ? 0 : Number(input.score);
  if (!displayName) fail(400, 'CRM_NAME_REQUIRED', 'نام سرنخ الزامی است.');
  if (!Number.isInteger(score) || score < 0 || score > 100) fail(400, 'CRM_INVALID_SCORE', 'امتیاز باید بین صفر تا صد باشد.');
  const leadNumber = 'CRM-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 7).toUpperCase();
  const row = await prisma.lead.create({ data: {
    leadNumber, displayName: displayName.slice(0, 240),
    companyName: input.companyName ? String(input.companyName).trim().slice(0, 240) : null,
    email: input.email ? String(input.email).trim().toLowerCase().slice(0, 320) : null,
    phone: input.phone ? String(input.phone).trim().slice(0, 40) : null,
    sourceId: input.sourceId ? idOf(input.sourceId) : null, score, ownerUserId,
  }, include: leadInclude });
  return leadDto(row);
}
async function updateLead(id, input) {
  const leadId = idOf(id);
  const current = await prisma.lead.findUnique({ where: { id: leadId }, select: { status: true } });
  if (!current) fail(404, 'CRM_LEAD_NOT_FOUND', 'سرنخ پیدا نشد.');
  if (['CONVERTED', 'DISQUALIFIED', 'DUPLICATE', 'LOST'].includes(current.status)) fail(409, 'CRM_LEAD_TERMINAL', 'سرنخ پایانی قابل ویرایش نیست.');
  const data = {};
  for (const key of ['displayName', 'companyName', 'email', 'phone']) if (input[key] !== undefined) data[key] = input[key] === null ? null : String(input[key]).trim();
  if (input.score !== undefined) {
    const score = Number(input.score);
    if (!Number.isInteger(score) || score < 0 || score > 100) fail(400, 'CRM_INVALID_SCORE', 'امتیاز باید بین صفر تا صد باشد.');
    data.score = score;
  }
  if (input.sourceId !== undefined) data.sourceId = input.sourceId === null ? null : idOf(input.sourceId);
  return leadDto(await prisma.lead.update({ where: { id: leadId }, data, include: leadInclude }));
}
async function assignLead(id, ownerId) {
  const leadId = idOf(id), ownerUserId = await assertStaff(prisma, ownerId);
  if (!(await prisma.lead.findUnique({ where: { id: leadId }, select: { id: true } }))) fail(404, 'CRM_LEAD_NOT_FOUND', 'سرنخ پیدا نشد.');
  return leadDto(await prisma.lead.update({ where: { id: leadId }, data: { ownerUserId }, include: leadInclude }));
}
async function changeLeadStatus(id, status, reason) {
  const leadId = idOf(id), current = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!current) fail(404, 'CRM_LEAD_NOT_FOUND', 'سرنخ پیدا نشد.');
  if (!transitions[current.status] || !transitions[current.status].includes(status)) fail(409, 'CRM_INVALID_LEAD_TRANSITION', 'تغییر وضعیت مجاز نیست.');
  if (status === 'CONVERTED') fail(409, 'CRM_CONVERSION_REQUIRED', 'برای تبدیل از عملیات تبدیل استفاده کنید.');
  return leadDto(await prisma.lead.update({ where: { id: leadId }, data: {
    status, disqualifiedReason: ['DISQUALIFIED', 'LOST'].includes(status) ? String(reason || '').slice(0, 500) || null : null,
  }, include: leadInclude }));
}
async function convertLead(id, actorId) {
  const leadId = idOf(id), converter = await assertStaff(prisma, actorId);
  return prisma.$transaction(async (tx) => {
    const lead = await tx.lead.findUnique({ where: { id: leadId } });
    if (!lead) fail(404, 'CRM_LEAD_NOT_FOUND', 'سرنخ پیدا نشد.');
    if (lead.status === 'CONVERTED' && lead.convertedAccountId) {
      const existing = await tx.cRMAccount.findUnique({ where: { id: lead.convertedAccountId }, include: { contacts: true } });
      if (existing) return safe({ leadId, account: existing, alreadyConverted: true });
    }
    if (lead.status !== 'QUALIFIED') fail(409, 'CRM_LEAD_NOT_QUALIFIED', 'فقط سرنخ واجد شرایط قابل تبدیل است.');
    // Claim the conversion atomically. A concurrent request can win only once.
    const claimed = await tx.lead.updateMany({
      where: { id: leadId, status: 'QUALIFIED', convertedAccountId: null },
      data: { status: 'CONVERTED', convertedByUserId: converter, convertedAt: new Date() },
    });
    if (claimed.count !== 1) {
      const latest = await tx.lead.findUnique({ where: { id: leadId } });
      if (latest?.status === 'CONVERTED' && latest.convertedAccountId) {
        const existing = await tx.cRMAccount.findUnique({ where: { id: latest.convertedAccountId }, include: { contacts: true } });
        if (existing) return safe({ leadId, account: existing, alreadyConverted: true });
      }
      fail(409, 'CRM_CONVERSION_CONFLICT', 'تبدیل این سرنخ هم‌زمان توسط درخواست دیگری انجام شده است.');
    }
    const account = await tx.cRMAccount.create({ data: {
      displayName: lead.companyName || lead.displayName, accountType: 'PROSPECT', ownerUserId: lead.ownerUserId,
      source: lead.sourceId ? String(lead.sourceId) : null,
      contacts: { create: { name: lead.displayName, email: lead.email, phone: lead.phone, isPrimary: true } },
    }, include: { contacts: true } });
    await tx.lead.update({ where: { id: leadId }, data: { convertedAccountId: account.id } });
    return safe({ leadId, account, alreadyConverted: false });
  });
}
async function listSources() {
  return prisma.leadSource.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }], select: { id: true, code: true, label: true, sortOrder: true } });
}
async function manageSource(input, id) {
  const data = {};
  if (input.code !== undefined) data.code = String(input.code).trim().toUpperCase().slice(0, 60);
  if (input.label !== undefined) data.label = String(input.label).trim().slice(0, 120);
  if (input.isActive !== undefined) data.isActive = Boolean(input.isActive);
  if (input.sortOrder !== undefined) data.sortOrder = Number(input.sortOrder) || 0;
  if (!id) {
    if (!data.code || !data.label) fail(400, 'CRM_SOURCE_FIELDS_REQUIRED', 'کد و عنوان الزامی است.');
    return prisma.leadSource.create({ data });
  }
  if (!Object.keys(data).length) fail(400, 'CRM_EMPTY_UPDATE', 'فیلدی برای ویرایش ارسال نشده است.');
  return prisma.leadSource.update({ where: { id: idOf(id) }, data });
}
async function dashboard() {
  const [total, fresh, qualified, converted, openTasks, overdueTasks, opportunities] = await Promise.all([
    prisma.lead.count(), prisma.lead.count({ where: { status: 'NEW' } }),
    prisma.lead.count({ where: { status: 'QUALIFIED' } }), prisma.lead.count({ where: { status: 'CONVERTED' } }),
    prisma.cRMTask.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    prisma.cRMTask.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] }, dueAt: { lt: new Date() } } }),
    prisma.opportunity.groupBy({ by: ['currency', 'status'], _sum: { amount: true }, _count: { id: true } }),
  ]);
  return { leads: { total, new: fresh, qualified, converted }, tasks: { open: openTasks, overdue: overdueTasks },
    opportunitiesByCurrency: opportunities.map((x) => ({ currency: x.currency, status: x.status, amount: x._sum.amount, count: x._count.id })) };
}
async function listAccounts(q = {}) {
  const page = pageOf(q.page, 1, 100000), limit = pageOf(q.limit, 25, 100);
  const where = q.search ? { displayName: { contains: String(q.search).slice(0, 120), mode: 'insensitive' } } : {};
  const [total, data] = await Promise.all([
    prisma.cRMAccount.count({ where }),
    prisma.cRMAccount.findMany({ where, include: { contacts: true }, orderBy: { updatedAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
  ]);
  return { data: safe(data), meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}
async function createAccount(input, actorId) {
  const ownerUserId = input.ownerUserId ? await assertStaff(prisma, input.ownerUserId) : await assertStaff(prisma, actorId);
  const displayName = String(input.displayName || '').trim();
  if (!displayName) fail(400, 'CRM_ACCOUNT_NAME_REQUIRED', 'نام حساب الزامی است.');
  return safe(await prisma.cRMAccount.create({ data: { displayName: displayName.slice(0, 240), accountType: input.accountType || 'PROSPECT', ownerUserId, source: input.source || null, notes: input.notes || null } }));
}
async function listTasks(q = {}) {
  const where = {};
  if (q.status) where.status = q.status;
  if (q.assigneeUserId) where.assigneeUserId = idOf(q.assigneeUserId);
  if (q.overdue === 'true') where.dueAt = { lt: new Date() };
  return safe(await prisma.cRMTask.findMany({ where, include: {
    assignee: { select: { id: true, email: true } },
    lead: { select: { id: true, leadNumber: true, displayName: true } },
    account: { select: { id: true, displayName: true } },
  }, orderBy: [{ dueAt: 'asc' }, { createdAt: 'desc' }], take: 100 }));
}
async function createTask(input, actorId) {
  const creator = await assertStaff(prisma, actorId), assignee = creator;
  const parent = exactlyOneParent(input), title = String(input.title || '').trim();
  if (!title) fail(400, 'CRM_TASK_TITLE_REQUIRED', 'عنوان وظیفه الزامی است.');
  return safe(await prisma.cRMTask.create({ data: { ...parent, title: title.slice(0, 240), description: input.description || null,
    priority: input.priority || 'NORMAL', dueAt: input.dueAt ? new Date(input.dueAt) : null, assigneeUserId: assignee, createdByUserId: creator } }));
}
async function listActivities(q = {}) {
  const where = {};
  for (const key of ['leadId', 'accountId', 'opportunityId']) if (q[key]) where[key] = idOf(q[key]);
  return safe(await prisma.cRMActivity.findMany({ where, orderBy: { occurredAt: 'desc' }, take: 100,
    select: { id: true, type: true, subject: true, body: true, occurredAt: true, durationMinutes: true, outcome: true, actorUserId: true, accountId: true, leadId: true, opportunityId: true } }));
}
async function createActivity(input, actorId) {
  const actorUserId = await assertStaff(prisma, actorId), parent = exactlyOneParent(input), subject = String(input.subject || '').trim();
  if (!subject) fail(400, 'CRM_ACTIVITY_SUBJECT_REQUIRED', 'موضوع فعالیت الزامی است.');
  return safe(await prisma.cRMActivity.create({ data: { ...parent, actorUserId, type: input.type || 'OTHER', subject: subject.slice(0, 240),
    body: input.body || null, occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
    durationMinutes: input.durationMinutes ? Number(input.durationMinutes) : null, outcome: input.outcome || null } }));
}
async function listNotes(q = {}, actorId) {
  const where = { OR: [{ visibility: 'TEAM' }, { visibility: 'PRIVATE', authorUserId: Number(actorId) }] };
  for (const key of ['leadId', 'accountId', 'opportunityId']) if (q[key]) where[key] = idOf(q[key]);
  return safe(await prisma.cRMNote.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100,
    select: { id: true, body: true, visibility: true, authorUserId: true, accountId: true, leadId: true, opportunityId: true, createdAt: true } }));
}
async function createNote(input, actorId) {
  const authorUserId = await assertStaff(prisma, actorId), parent = exactlyOneParent(input), body = String(input.body || '').trim();
  if (!body) fail(400, 'CRM_NOTE_BODY_REQUIRED', 'متن یادداشت الزامی است.');
  return safe(await prisma.cRMNote.create({ data: { ...parent, authorUserId, body, visibility: input.visibility === 'PRIVATE' ? 'PRIVATE' : 'TEAM' } }));
}

async function duplicateCandidates(id) {
  const leadId = idOf(id);
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) fail(404, 'CRM_LEAD_NOT_FOUND', 'سرنخ پیدا نشد.');
  const or = [];
  if (lead.email) or.push({ email: { equals: lead.email, mode: 'insensitive' } });
  if (lead.phone) or.push({ phone: lead.phone });
  if (lead.displayName) or.push({ displayName: { equals: lead.displayName, mode: 'insensitive' } });
  if (lead.companyName) or.push({ companyName: { equals: lead.companyName, mode: 'insensitive' } });
  if (!or.length) return [];
  const rows = await prisma.lead.findMany({ where: { id: { not: leadId }, OR: or }, include: leadInclude, take: 20, orderBy: { updatedAt: 'desc' } });
  return rows.map((row) => ({ ...leadDto(row), matchReasons: [
    ...(lead.email && row.email && lead.email.toLowerCase() === row.email.toLowerCase() ? ['EMAIL'] : []),
    ...(lead.phone && row.phone === lead.phone ? ['PHONE'] : []),
    ...(lead.displayName.toLowerCase() === row.displayName.toLowerCase() ? ['NAME'] : []),
    ...(lead.companyName && row.companyName && lead.companyName.toLowerCase() === row.companyName.toLowerCase() ? ['COMPANY'] : []),
  ] }));
}
async function leadTimeline(id, actorId) {
  const leadId = idOf(id);
  if (!(await prisma.lead.findUnique({ where: { id: leadId }, select: { id: true } }))) fail(404, 'CRM_LEAD_NOT_FOUND', 'سرنخ پیدا نشد.');
  const [activities, tasks, notes] = await Promise.all([
    prisma.cRMActivity.findMany({ where: { leadId }, orderBy: { occurredAt: 'desc' }, take: 100 }),
    prisma.cRMTask.findMany({ where: { leadId }, orderBy: { createdAt: 'desc' }, take: 100 }),
    prisma.cRMNote.findMany({ where: { leadId, OR: [{ visibility: 'TEAM' }, { visibility: 'PRIVATE', authorUserId: Number(actorId) }] }, orderBy: { createdAt: 'desc' }, take: 100 }),
  ]);
  return safe([
    ...activities.map((x) => ({ kind: 'ACTIVITY', id: x.id, at: x.occurredAt, title: x.subject, body: x.body, type: x.type })),
    ...tasks.map((x) => ({ kind: 'TASK', id: x.id, at: x.createdAt, title: x.title, status: x.status, dueAt: x.dueAt })),
    ...notes.map((x) => ({ kind: 'NOTE', id: x.id, at: x.createdAt, body: x.body, visibility: x.visibility })),
  ].sort((a, b) => new Date(b.at) - new Date(a.at)));
}


async function listPipelines() {
  return safe(await prisma.pipeline.findMany({
    where: { isActive: true },
    include: { stages: { orderBy: { sortOrder: 'asc' }, select: { id: true, pipelineId: true, code: true, label: true, sortOrder: true, probability: true, isWon: true, isLost: true } } },
    orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
  }));
}
async function createPipeline(input) {
  const name = String(input.name || '').trim();
  if (!name) fail(400, 'CRM_PIPELINE_NAME_REQUIRED', 'نام قیف فروش الزامی است.');
  return safe(await prisma.pipeline.create({ data: { name: name.slice(0, 120), isDefault: Boolean(input.isDefault), isActive: true } }));
}
async function createPipelineStage(pipelineId, input) {
  const id = idOf(pipelineId), pipeline = await prisma.pipeline.findUnique({ where: { id }, select: { id: true } });
  if (!pipeline) fail(404, 'CRM_PIPELINE_NOT_FOUND', 'قیف فروش پیدا نشد.');
  const code = String(input.code || '').trim().toUpperCase();
  const label = String(input.label || '').trim();
  const probability = Number(input.probability ?? 0);
  if (!code || !label || !Number.isInteger(probability) || probability < 0 || probability > 100) fail(400, 'CRM_STAGE_INVALID', 'کد، عنوان و احتمال معتبر مرحله الزامی است.');
  if (input.isWon && input.isLost) fail(400, 'CRM_STAGE_FLAGS_INVALID', 'یک مرحله نمی‌تواند هم‌زمان موفق و ناموفق باشد.');
  return safe(await prisma.pipelineStage.create({ data: { pipelineId: id, code: code.slice(0, 60), label: label.slice(0, 120), sortOrder: Number(input.sortOrder) || 0, probability, isWon: Boolean(input.isWon), isLost: Boolean(input.isLost) } }));
}
async function listOpportunities(query = {}) {
  const where = {};
  if (query.pipelineId) where.pipelineId = idOf(query.pipelineId);
  if (query.stageId) where.stageId = idOf(query.stageId);
  if (query.status) where.status = query.status;
  return safe(await prisma.opportunity.findMany({
    where, include: { account: { select: { id: true, displayName: true } }, stage: { select: { id: true, label: true, code: true, probability: true, isWon: true, isLost: true } }, owner: { select: { id: true, email: true } } },
    orderBy: [{ expectedCloseAt: 'asc' }, { updatedAt: 'desc' }], take: 200,
  }));
}
async function createOpportunity(input, actorId) {
  const creatorUserId = await assertStaff(prisma, actorId);
  const ownerUserId = input.ownerUserId ? await assertStaff(prisma, input.ownerUserId) : creatorUserId;
  const accountId = idOf(input.accountId), pipelineId = idOf(input.pipelineId), stageId = idOf(input.stageId);
  const [account, stage] = await Promise.all([
    prisma.cRMAccount.findUnique({ where: { id: accountId }, select: { id: true } }),
    prisma.pipelineStage.findFirst({ where: { id: stageId, pipelineId }, select: { id: true, isWon: true, isLost: true } }),
  ]);
  if (!account) fail(404, 'CRM_ACCOUNT_NOT_FOUND', 'حساب CRM پیدا نشد.');
  if (!stage) fail(400, 'CRM_STAGE_PIPELINE_MISMATCH', 'مرحله انتخاب‌شده متعلق به این قیف نیست.');
  const title = String(input.title || '').trim();
  if (!title) fail(400, 'CRM_OPPORTUNITY_TITLE_REQUIRED', 'عنوان فرصت الزامی است.');
  const currency = String(input.currency || 'IRR').trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) fail(400, 'CRM_CURRENCY_INVALID', 'کد ارز باید سه حرف باشد.');
  const status = stage.isWon ? 'WON' : stage.isLost ? 'LOST' : 'OPEN';
  const opportunityNumber = 'CRM-OPP-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
  return safe(await prisma.$transaction(async (tx) => {
    const row = await tx.opportunity.create({ data: {
      opportunityNumber, accountId, pipelineId, stageId, ownerUserId, title: title.slice(0, 240),
      amount: String(input.amount || 0), currency, expectedCloseAt: input.expectedCloseAt ? new Date(input.expectedCloseAt) : null,
      status, closedAt: status === 'OPEN' ? null : new Date(),
    }, include: { account: { select: { id: true, displayName: true } }, stage: true } });
    await tx.opportunityStageHistory.create({ data: { opportunityId: row.id, toStageId: stageId, actorUserId: creatorUserId, reason: 'ایجاد فرصت CRM' } });
    return row;
  }));
}
async function changeOpportunityStage(id, input, actorId) {
  const opportunityId = idOf(id), actorUserId = await assertStaff(prisma, actorId), stageId = idOf(input.stageId);
  return safe(await prisma.$transaction(async (tx) => {
    const current = await tx.opportunity.findUnique({ where: { id: opportunityId } });
    if (!current) fail(404, 'CRM_OPPORTUNITY_NOT_FOUND', 'فرصت فروش پیدا نشد.');
    const target = await tx.pipelineStage.findFirst({ where: { id: stageId, pipelineId: current.pipelineId } });
    if (!target) fail(400, 'CRM_STAGE_PIPELINE_MISMATCH', 'مرحله انتخاب‌شده متعلق به قیف این فرصت نیست.');
    const status = target.isWon ? 'WON' : target.isLost ? 'LOST' : 'OPEN';
    const updated = await tx.opportunity.update({ where: { id: opportunityId }, data: { stageId, status, closedAt: status === 'OPEN' ? null : new Date() } });
    await tx.opportunityStageHistory.create({ data: { opportunityId, fromStageId: current.stageId, toStageId: stageId, actorUserId, reason: input.reason ? String(input.reason).slice(0, 500) : null } });
    return updated;
  }));
}


async function getAccount(id) {
  const row = await prisma.cRMAccount.findUnique({ where: { id: idOf(id) }, include: { contacts: true } });
  if (!row) fail(404, 'CRM_ACCOUNT_NOT_FOUND', 'حساب CRM پیدا نشد.');
  return safe(row);
}
async function updateAccount(id, input) {
  const accountId = idOf(id), data = {};
  for (const key of ['displayName', 'lifecycle', 'source', 'notes']) if (input[key] !== undefined) data[key] = input[key] === null ? null : String(input[key]).trim();
  if (input.ownerUserId !== undefined) data.ownerUserId = await assertStaff(prisma, input.ownerUserId);
  if (!Object.keys(data).length) fail(400, 'CRM_EMPTY_UPDATE', 'فیلدی برای ویرایش ارسال نشده است.');
  try { return safe(await prisma.cRMAccount.update({ where: { id: accountId }, data, include: { contacts: true } })); }
  catch (error) { if (error.code === 'P2025') fail(404, 'CRM_ACCOUNT_NOT_FOUND', 'حساب CRM پیدا نشد.'); throw error; }
}
async function listContacts(accountId) {
  const id = idOf(accountId);
  if (!(await prisma.cRMAccount.findUnique({ where: { id }, select: { id: true } }))) fail(404, 'CRM_ACCOUNT_NOT_FOUND', 'حساب CRM پیدا نشد.');
  return safe(await prisma.cRMContact.findMany({ where: { accountId: id }, orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }] }));
}
async function createContact(accountId, input) {
  const id = idOf(accountId), name = String(input.name || '').trim();
  if (!name) fail(400, 'CRM_CONTACT_NAME_REQUIRED', 'نام مخاطب الزامی است.');
  if (!(await prisma.cRMAccount.findUnique({ where: { id }, select: { id: true } }))) fail(404, 'CRM_ACCOUNT_NOT_FOUND', 'حساب CRM پیدا نشد.');
  return safe(await prisma.cRMContact.create({ data: { accountId: id, name: name.slice(0, 200), title: input.title || null, email: input.email || null, phone: input.phone || null, isPrimary: Boolean(input.isPrimary), notes: input.notes || null } }));
}
async function updateContact(id, input) {
  const contactId = idOf(id), data = {};
  for (const key of ['name', 'title', 'email', 'phone', 'notes']) if (input[key] !== undefined) data[key] = input[key] === null ? null : String(input[key]).trim();
  if (input.isPrimary !== undefined) data.isPrimary = Boolean(input.isPrimary);
  if (!Object.keys(data).length) fail(400, 'CRM_EMPTY_UPDATE', 'فیلدی برای ویرایش ارسال نشده است.');
  try { return safe(await prisma.cRMContact.update({ where: { id: contactId }, data })); }
  catch (error) { if (error.code === 'P2025') fail(404, 'CRM_CONTACT_NOT_FOUND', 'مخاطب پیدا نشد.'); throw error; }
}
async function updateTask(id, input) {
  const taskId = idOf(id), data = {};
  for (const key of ['title', 'description', 'priority', 'status']) if (input[key] !== undefined) data[key] = input[key];
  if (input.dueAt !== undefined) data.dueAt = input.dueAt ? new Date(input.dueAt) : null;
  if (input.status === 'COMPLETED') data.completedAt = new Date();
  else if (input.status && input.status !== 'COMPLETED') data.completedAt = null;
  try { return safe(await prisma.cRMTask.update({ where: { id: taskId }, data })); }
  catch (error) { if (error.code === 'P2025') fail(404, 'CRM_TASK_NOT_FOUND', 'وظیفه پیدا نشد.'); throw error; }
}
async function assignTask(id, assigneeId) {
  const taskId = idOf(id), assigneeUserId = await assertStaff(prisma, assigneeId);
  try { return safe(await prisma.cRMTask.update({ where: { id: taskId }, data: { assigneeUserId } })); }
  catch (error) { if (error.code === 'P2025') fail(404, 'CRM_TASK_NOT_FOUND', 'وظیفه پیدا نشد.'); throw error; }
}
async function completeTask(id) {
  const taskId = idOf(id);
  try { return safe(await prisma.cRMTask.update({ where: { id: taskId }, data: { status: 'COMPLETED', completedAt: new Date() } })); }
  catch (error) { if (error.code === 'P2025') fail(404, 'CRM_TASK_NOT_FOUND', 'وظیفه پیدا نشد.'); throw error; }
}


async function mergeLeads(sourceId, targetId, reason, actorId) {
  const sourceLeadId = idOf(sourceId), targetLeadId = idOf(targetId), actorUserId = await assertStaff(prisma, actorId);
  if (sourceLeadId === targetLeadId) fail(400, 'CRM_MERGE_SAME_LEAD', 'ادغام یک سرنخ در خودش مجاز نیست.');
  const note = String(reason || '').trim();
  if (!note) fail(400, 'CRM_MERGE_REASON_REQUIRED', 'دلیل ادغام الزامی است.');
  return prisma.$transaction(async (tx) => {
    const [source, target] = await Promise.all([
      tx.lead.findUnique({ where: { id: sourceLeadId } }),
      tx.lead.findUnique({ where: { id: targetLeadId } }),
    ]);
    if (!source || !target) fail(404, 'CRM_LEAD_NOT_FOUND', 'یکی از سرنخ‌های انتخاب‌شده پیدا نشد.');
    if (source.status === 'CONVERTED' || source.status === 'DUPLICATE') fail(409, 'CRM_LEAD_NOT_MERGEABLE', 'سرنخ تبدیل‌شده یا ادغام‌شده قابل ادغام مجدد نیست.');
    if (target.status === 'DUPLICATE' || target.status === 'DISQUALIFIED' || target.status === 'LOST') fail(409, 'CRM_TARGET_NOT_MERGEABLE', 'سرنخ مقصد در وضعیت قابل پذیرش نیست.');

    await tx.cRMActivity.updateMany({ where: { leadId: sourceLeadId }, data: { leadId: targetLeadId } });
    await tx.cRMTask.updateMany({ where: { leadId: sourceLeadId }, data: { leadId: targetLeadId } });
    await tx.cRMNote.updateMany({ where: { leadId: sourceLeadId }, data: { leadId: targetLeadId } });
    const merged = await tx.lead.update({ where: { id: targetLeadId }, data: {
      email: target.email || source.email,
      phone: target.phone || source.phone,
      companyName: target.companyName || source.companyName,
      sourceId: target.sourceId || source.sourceId,
      score: Math.max(target.score, source.score),
    }, include: leadInclude });
    const marked = await tx.lead.updateMany({
      where: { id: sourceLeadId, status: { notIn: ['CONVERTED', 'DUPLICATE'] } },
      data: { status: 'DUPLICATE', disqualifiedReason: ('MERGED_INTO:' + targetLeadId + ' — ' + note).slice(0, 500) },
    });
    if (marked.count !== 1) fail(409, 'CRM_MERGE_CONFLICT', 'این سرنخ هم‌زمان توسط عملیات دیگری تغییر کرده است.');
    await tx.auditLog.create({ data: {
      actorUserId, actorAccessType: 'STAFF', action: 'CRM_LEAD_MERGED',
      entityType: 'Lead', entityId: String(targetLeadId), source: 'ADMIN',
      metadata: { sourceLeadId, targetLeadId, reason: note },
    } });
    return { mergedLead: leadDto(merged), duplicateLeadId: sourceLeadId, movedRelations: true };
  });
}


async function exportLeads(query = {}) {
  const where = {};
  if (query.status) where.status = query.status;
  if (query.sourceId) where.sourceId = idOf(query.sourceId);
  if (query.ownerUserId) where.ownerUserId = idOf(query.ownerUserId);
  if (query.search) {
    const search = String(query.search).trim().slice(0, 120);
    where.OR = ['displayName', 'companyName', 'email', 'phone', 'leadNumber'].map((key) => ({ [key]: { contains: search, mode: 'insensitive' } }));
  }
  const rows = await prisma.lead.findMany({ where, include: leadInclude, orderBy: { createdAt: 'desc' }, take: 5000 });
  return rows.map(leadDto);
}


async function updatePipeline(id, input) {
  const pipelineId = idOf(id), data = {};
  if (input.name !== undefined) data.name = String(input.name).trim().slice(0, 120);
  if (input.isActive !== undefined) data.isActive = Boolean(input.isActive);
  if (input.isDefault !== undefined) data.isDefault = Boolean(input.isDefault);
  return prisma.$transaction(async (tx) => {
    if (data.isDefault) await tx.pipeline.updateMany({ where: { id: { not: pipelineId } }, data: { isDefault: false } });
    try { return safe(await tx.pipeline.update({ where: { id: pipelineId }, data })); }
    catch (error) { if (error.code === 'P2025') fail(404, 'CRM_PIPELINE_NOT_FOUND', 'قیف فروش پیدا نشد.'); throw error; }
  });
}
async function updatePipelineStage(pipelineId, stageId, input) {
  const pipeline = idOf(pipelineId), stage = idOf(stageId), data = {};
  if (input.code !== undefined) data.code = String(input.code).trim().toUpperCase().slice(0, 60);
  if (input.label !== undefined) data.label = String(input.label).trim().slice(0, 120);
  if (input.sortOrder !== undefined) data.sortOrder = Number(input.sortOrder);
  if (input.probability !== undefined) {
    const probability = Number(input.probability);
    if (!Number.isInteger(probability) || probability < 0 || probability > 100) fail(400, 'CRM_STAGE_INVALID', 'احتمال مرحله باید بین صفر تا صد باشد.');
    data.probability = probability;
  }
  if (input.isWon !== undefined) data.isWon = Boolean(input.isWon);
  if (input.isLost !== undefined) data.isLost = Boolean(input.isLost);
  if (data.isWon && data.isLost) fail(400, 'CRM_STAGE_FLAGS_INVALID', 'مرحله نمی‌تواند هم‌زمان موفق و ناموفق باشد.');
  const current = await prisma.pipelineStage.findFirst({ where: { id: stage, pipelineId: pipeline }, select: { id: true } });
  if (!current) fail(404, 'CRM_STAGE_NOT_FOUND', 'مرحله در این قیف پیدا نشد.');
  return safe(await prisma.pipelineStage.update({ where: { id: stage }, data }));
}
async function getOpportunity(id) {
  const row = await prisma.opportunity.findUnique({ where: { id: idOf(id) }, include: {
    account: { include: { contacts: true } }, pipeline: { include: { stages: { orderBy: { sortOrder: 'asc' } } } },
    stage: true, owner: { select: { id: true, email: true } }, stageHistory: { include: { fromStage: true, toStage: true }, orderBy: { createdAt: 'desc' } },
  } });
  if (!row) fail(404, 'CRM_OPPORTUNITY_NOT_FOUND', 'فرصت فروش پیدا نشد.');
  return safe(row);
}
async function updateOpportunity(id, input) {
  const opportunityId = idOf(id), data = {};
  if (input.title !== undefined) data.title = String(input.title).trim().slice(0, 240);
  if (input.amount !== undefined) data.amount = String(input.amount);
  if (input.currency !== undefined) {
    const currency = String(input.currency).trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) fail(400, 'CRM_CURRENCY_INVALID', 'کد ارز باید سه حرف باشد.');
    data.currency = currency;
  }
  if (input.expectedCloseAt !== undefined) data.expectedCloseAt = input.expectedCloseAt ? new Date(input.expectedCloseAt) : null;
  if (input.ownerUserId !== undefined) data.ownerUserId = await assertStaff(prisma, input.ownerUserId);
  try { return safe(await prisma.opportunity.update({ where: { id: opportunityId }, data })); }
  catch (error) { if (error.code === 'P2025') fail(404, 'CRM_OPPORTUNITY_NOT_FOUND', 'فرصت فروش پیدا نشد.'); throw error; }
}

module.exports = { updatePipeline, updatePipelineStage, getOpportunity, updateOpportunity, exportLeads, mergeLeads, getAccount, updateAccount, listContacts, createContact, updateContact, updateTask, assignTask, completeTask, listPipelines, createPipeline, createPipelineStage, listOpportunities, createOpportunity, changeOpportunityStage, duplicateCandidates, leadTimeline, listLeads, getLead, createLead, updateLead, assignLead, changeLeadStatus, convertLead,
  listSources, manageSource, dashboard, listAccounts, createAccount, listTasks, createTask, listActivities, createActivity, listNotes, createNote };
