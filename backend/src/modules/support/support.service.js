const prisma = require('../../config/db');

const STATUSES = new Set(['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'WAITING_COMPANY', 'RESOLVED', 'CLOSED', 'SPAM']);
const TRANSITIONS = {
  OPEN: ['IN_PROGRESS', 'WAITING_CUSTOMER', 'WAITING_COMPANY', 'RESOLVED', 'SPAM'],
  IN_PROGRESS: ['WAITING_CUSTOMER', 'WAITING_COMPANY', 'RESOLVED', 'SPAM'],
  WAITING_CUSTOMER: ['IN_PROGRESS', 'RESOLVED', 'CLOSED'],
  WAITING_COMPANY: ['IN_PROGRESS', 'RESOLVED', 'CLOSED'],
  RESOLVED: ['IN_PROGRESS', 'CLOSED'],
  CLOSED: ['IN_PROGRESS'],
  SPAM: [],
};

function fail(statusCode, code, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  throw error;
}
function toId(value, field = 'id') {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) fail(400, 'SUPPORT_INVALID_ID', `شناسه ${field} معتبر نیست.`);
  return id;
}
function context(user) {
  if (!user?.id) fail(401, 'UNAUTHORIZED', 'برای ادامه وارد حساب شوید.');
  const accessType = user.accessType || ((user.roles || []).includes('CUSTOMER_USER') ? 'CUSTOMER' : null);
  return {
    userId: toId(user.id, 'user'),
    accessType: accessType || null,
    companyId: user.companyId ? toId(user.companyId, 'company') : null,
  };
}
function scopeWhere(ctx) {
  if (ctx.accessType === 'STAFF') return {};
  if (ctx.accessType === 'COMPANY') {
    if (!ctx.companyId) fail(403, 'SUPPORT_COMPANY_CONTEXT_REQUIRED', 'حساب شرکت فعال در دسترس نیست.');
    return { requesterCompanyId: ctx.companyId };
  }
  if (ctx.accessType === 'CUSTOMER') return { requesterUserId: ctx.userId };
  fail(403, 'SUPPORT_ACCESS_DENIED', 'دسترسی به تیکت‌های پشتیبانی مجاز نیست.');
}
function createdFrom(accessType) {
  return accessType === 'STAFF' ? 'ADMIN' : accessType === 'COMPANY' ? 'COMPANY' : 'WEBSITE';
}
async function assertStaff(prismaClient, userId) {
  const id = toId(userId, 'assignee');
  const profile = await prismaClient.accessProfile.findFirst({
    where: { userId: id, type: 'STAFF', isActive: true },
    select: { userId: true },
  });
  if (!profile) fail(400, 'SUPPORT_STAFF_REQUIRED', 'مسئول انتخاب‌شده باید کارمند فعال سامانه باشد.');
  return id;
}
function ticketInclude(staff, messages = false) {
  const include = {
    category: true,
    assignedQueue: true,
    assignedUser: { select: { id: true, email: true } },
    requester: { select: { id: true, email: true } },
    requesterCompany: { select: { id: true, name: true } },
  };
  if (messages) include.messages = {
    where: staff ? {} : { visibility: 'PUBLIC' },
    orderBy: { createdAt: 'asc' },
    include: {
      sender: { select: { id: true, email: true } },
      attachments: { where: { status: 'AVAILABLE' } },
    },
  };
  return include;
}
function ticketNumber() {
  return 'SUP-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 7).toUpperCase();
}
async function getSla(prismaClient, categoryId, priority) {
  const policy = await prismaClient.supportSlaPolicy.findFirst({
    where: { categoryId: categoryId || null, priority, isActive: true },
  });
  if (!policy) return {};
  const now = Date.now();
  return {
    firstResponseDueAt: new Date(now + policy.firstResponseMinutes * 60_000),
    resolveDueAt: new Date(now + policy.resolutionMinutes * 60_000),
  };
}

async function listCategories() {
  return prisma.supportCategory.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: { id: true, key: true, name: true, description: true },
  });
}
async function listQueues() {
  return prisma.supportQueue.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });
}
async function listTickets(user, query = {}) {
  const ctx = context(user);
  const where = scopeWhere(ctx);
  if (query.status && STATUSES.has(query.status)) where.status = query.status;
  if (query.categoryId) where.categoryId = toId(query.categoryId, 'category');
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 25));
  const [rows, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      include: { ...ticketInclude(ctx.accessType === 'STAFF'), _count: { select: { messages: true } } },
      orderBy: [{ lastActivityAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.supportTicket.count({ where }),
  ]);
  return { data: rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
async function getTicket(user, ticketId) {
  const ctx = context(user);
  const ticket = await prisma.supportTicket.findFirst({
    where: { id: toId(ticketId), ...scopeWhere(ctx) },
    include: ticketInclude(ctx.accessType === 'STAFF', true),
  });
  if (!ticket) fail(404, 'SUPPORT_TICKET_NOT_FOUND', 'تیکت پیدا نشد.');
  return ticket;
}
async function createTicket(user, input) {
  const ctx = context(user);
  const subject = String(input.subject || '').trim();
  const body = String(input.body || '').trim();
  if (!subject || subject.length > 200) fail(400, 'SUPPORT_SUBJECT_INVALID', 'موضوع تیکت الزامی و حداکثر ۲۰۰ نویسه است.');
  if (!body || body.length > 10_000) fail(400, 'SUPPORT_MESSAGE_INVALID', 'متن پیام الزامی و حداکثر ۱۰۰۰۰ نویسه است.');
  let categoryId = null;
  if (input.categoryId !== undefined && input.categoryId !== null && input.categoryId !== '') {
    categoryId = toId(input.categoryId, 'category');
    const category = await prisma.supportCategory.findFirst({ where: { id: categoryId, isActive: true }, select: { id: true } });
    if (!category) fail(400, 'SUPPORT_CATEGORY_INVALID', 'دسته‌بندی انتخاب‌شده معتبر یا فعال نیست.');
  }
  const priority = ctx.accessType === 'STAFF' && input.priority && ['LOW', 'NORMAL', 'HIGH', 'URGENT'].includes(input.priority)
    ? input.priority : 'NORMAL';
  const sla = await getSla(prisma, categoryId, priority);
  const companyId = ctx.accessType === 'COMPANY' ? ctx.companyId : null;
  return prisma.$transaction(async (tx) => {
    const ticket = await tx.supportTicket.create({
      data: {
        ticketNumber: ticketNumber(),
        requesterUserId: ctx.userId,
        requesterCompanyId: companyId,
        categoryId,
        createdFrom: createdFrom(ctx.accessType),
        priority,
        subject,
        ...sla,
        lastActivityAt: new Date(),
      },
    });
    const message = await tx.supportMessage.create({
      data: { ticketId: ticket.id, senderUserId: ctx.userId, visibility: 'PUBLIC', body },
      include: { sender: { select: { id: true, email: true } } },
    });
    await tx.supportStatusHistory.create({
      data: { ticketId: ticket.id, previous: null, next: 'OPEN', actorUserId: ctx.userId, reason: 'Ticket created' },
    });
    await tx.supportEvent.create({
      data: {
        ticketId: ticket.id,
        actorUserId: ctx.userId,
        eventType: 'TICKET_CREATED',
        dedupeKey: `ticket-created:${ticket.id}`,
        payload: { createdFrom: createdFrom(ctx.accessType), categoryId },
      },
    });
    return { ...ticket, messages: [message] };
  });
}
async function addMessage(user, ticketId, input) {
  const ctx = context(user);
  const body = String(input.body || '').trim();
  if (!body || body.length > 10_000) fail(400, 'SUPPORT_MESSAGE_INVALID', 'متن پیام الزامی و حداکثر ۱۰۰۰۰ نویسه است.');
  const visibility = input.visibility === 'INTERNAL' && ctx.accessType === 'STAFF' ? 'INTERNAL' : 'PUBLIC';
  if (input.visibility === 'INTERNAL' && (ctx.accessType !== 'STAFF' || !(user.permissions || []).some((permission) => permission === '*' || permission === 'tickets.update'))) fail(403, 'SUPPORT_INTERNAL_MESSAGE_FORBIDDEN', 'یادداشت داخلی فقط برای کارکنان دارای دسترسی ویرایش تیکت مجاز است.');
  const id = toId(ticketId);
  const ticket = await prisma.supportTicket.findFirst({ where: { id, ...scopeWhere(ctx) } });
  if (!ticket) fail(404, 'SUPPORT_TICKET_NOT_FOUND', 'تیکت پیدا نشد.');
  if (ticket.status === 'CLOSED' || ticket.status === 'SPAM') fail(409, 'SUPPORT_TICKET_LOCKED', 'این تیکت بسته است و امکان ارسال پیام ندارد.');
  const now = new Date();
  return prisma.$transaction(async (tx) => {
    const message = await tx.supportMessage.create({
      data: { ticketId: id, senderUserId: ctx.userId, visibility, body },
      include: { sender: { select: { id: true, email: true } } },
    });
    const data = { lastActivityAt: now };
    if (ctx.accessType === 'STAFF' && visibility === 'PUBLIC' && !ticket.firstRespondedAt) data.firstRespondedAt = now;
    if (ctx.accessType !== 'STAFF' && ['WAITING_CUSTOMER', 'WAITING_COMPANY'].includes(ticket.status)) data.status = 'IN_PROGRESS';
    await tx.supportTicket.update({ where: { id }, data });
    await tx.supportEvent.create({
      data: {
        ticketId: id, actorUserId: ctx.userId, eventType: 'MESSAGE_CREATED',
        dedupeKey: `ticket-message:${id}:${message.id}`,
        payload: { visibility },
      },
    });
    return message;
  });
}
async function changeStatus(user, ticketId, next, reason) {
  const ctx = context(user);
  if (ctx.accessType !== 'STAFF') fail(403, 'SUPPORT_STAFF_ONLY', 'تغییر وضعیت تیکت فقط برای کارکنان مجاز است.');
  if (!STATUSES.has(next)) fail(400, 'SUPPORT_STATUS_INVALID', 'وضعیت انتخاب‌شده معتبر نیست.');
  const id = toId(ticketId);
  return prisma.$transaction(async (tx) => {
    const current = await tx.supportTicket.findUnique({ where: { id } });
    if (!current) fail(404, 'SUPPORT_TICKET_NOT_FOUND', 'تیکت پیدا نشد.');
    if (!TRANSITIONS[current.status]?.includes(next)) fail(409, 'SUPPORT_TRANSITION_INVALID', 'انتقال وضعیت تیکت مجاز نیست.');
    const now = new Date();
    const updated = await tx.supportTicket.update({
      where: { id },
      data: {
        status: next,
        resolvedAt: next === 'RESOLVED' ? now : current.resolvedAt,
        closedAt: next === 'CLOSED' ? now : next === 'IN_PROGRESS' ? null : current.closedAt,
        lastActivityAt: now,
      },
    });
    await tx.supportStatusHistory.create({
      data: { ticketId: id, previous: current.status, next, actorUserId: ctx.userId, reason: reason ? String(reason).slice(0, 1000) : null },
    });
    await tx.supportEvent.create({
      data: { ticketId: id, actorUserId: ctx.userId, eventType: 'STATUS_CHANGED', payload: { previous: current.status, next } },
    });
    return updated;
  });
}
async function assignTicket(user, ticketId, input) {
  const ctx = context(user);
  if (ctx.accessType !== 'STAFF') fail(403, 'SUPPORT_STAFF_ONLY', 'تخصیص تیکت فقط برای کارکنان مجاز است.');
  const id = toId(ticketId);
  const queueId = input.queueId ? toId(input.queueId, 'queue') : null;
  const assigneeId = input.assignedUserId ? await assertStaff(prisma, input.assignedUserId) : null;
  if (!queueId && !assigneeId) fail(400, 'SUPPORT_ASSIGNMENT_REQUIRED', 'انتخاب صف یا مسئول الزامی است.');
  if (queueId) {
    const queue = await prisma.supportQueue.findFirst({ where: { id: queueId, isActive: true }, select: { id: true } });
    if (!queue) fail(400, 'SUPPORT_QUEUE_INVALID', 'صف انتخاب‌شده معتبر یا فعال نیست.');
  }
  return prisma.$transaction(async (tx) => {
    const ticket = await tx.supportTicket.findUnique({ where: { id } });
    if (!ticket) fail(404, 'SUPPORT_TICKET_NOT_FOUND', 'تیکت پیدا نشد.');
    const now = new Date();
    await tx.supportAssignment.updateMany({ where: { ticketId: id, endedAt: null }, data: { endedAt: now } });
    await tx.supportAssignment.create({
      data: { ticketId: id, queueId, assignedUserId: assigneeId, assignedByUserId: ctx.userId, reason: input.reason ? String(input.reason).slice(0, 500) : null },
    });
    const updated = await tx.supportTicket.update({
      where: { id },
      data: { assignedQueueId: queueId, assignedUserId: assigneeId, lastActivityAt: now },
      include: ticketInclude(true),
    });
    await tx.supportEvent.create({
      data: { ticketId: id, actorUserId: ctx.userId, eventType: 'TICKET_ASSIGNED', payload: { queueId, assigneeId } },
    });
    return updated;
  });
}

module.exports = { listCategories, listQueues, listTickets, getTicket, createTicket, addMessage, changeStatus, assignTicket };
