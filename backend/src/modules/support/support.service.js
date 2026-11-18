const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');
const prisma = require('../../config/db');
const { dispatchNotification } = require('../notifications/notification.dispatch.service');

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

// ─── Attachment constants ───
const SUPPORT_UPLOAD_ROOT = path.join(process.cwd(), 'uploads', 'support');
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB
const SUPPORTED_ATTACHMENT_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

function sanitizeFilename(filename) {
  const ext = path.extname(filename || '').toLowerCase();
  const basename = path.basename(filename || 'file', ext).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 60) || 'file';
  return `${Date.now()}-${crypto.randomBytes(8).toString('hex')}-${basename}${ext}`;
}

function assertUploadedFile(file) {
  if (!file) throw { statusCode: 400, code: 'FILE_REQUIRED', message: 'A file upload is required.' };
}

function assertFileType(file, allowedTypes, code) {
  const ext = path.extname(file.filename || '').toLowerCase();
  if (!allowedTypes.has(file.mimetype)) {
    throw { statusCode: 400, code, message: `Unsupported file type: ${file.mimetype || ext}.` };
  }
}

async function saveUploadedFile(file, folder, maxBytes) {
  const uploadDir = path.join(SUPPORT_UPLOAD_ROOT, folder);
  await fs.promises.mkdir(uploadDir, { recursive: true });

  const filename = sanitizeFilename(file.filename);
  const destination = path.join(uploadDir, filename);
  let bytesWritten = 0;

  file.file.on('data', (chunk) => {
    bytesWritten += chunk.length;
    if (bytesWritten > maxBytes) file.file.destroy(Object.assign(new Error('File too large'), { statusCode: 413 }));
  });

  try {
    await pipeline(file.file, fs.createWriteStream(destination));
  } catch (error) {
    await fs.promises.rm(destination, { force: true }).catch(() => {});
    throw { statusCode: error.statusCode || 413, code: 'FILE_TOO_LARGE', message: 'Uploaded file exceeds the allowed size.' };
  }

  // Compute checksum for integrity
  const hash = crypto.createHash('sha256');
  const buffer = await fs.promises.readFile(destination);
  hash.update(buffer);
  const checksum = hash.digest('hex');

  return {
    storageKey: `/support/${folder}/${filename}`,
    url: destination,
    bytes: bytesWritten,
    checksum,
  };
}

async function removeStoredFile(storageKey) {
  if (!storageKey || !storageKey.startsWith('/support/')) return;
  const relativePath = storageKey.replace(/^\/support\//, '');
  const filePath = path.join(SUPPORT_UPLOAD_ROOT, relativePath);
  await fs.promises.rm(filePath, { force: true }).catch(() => {});
}
// ─── SLA Calculation with Working Calendar ───

// Default working calendar: Mon-Fri 09:00-18:00 (Iran time), no holidays
const DEFAULT_WORKING_CALENDAR = {
  timezone: 'Asia/Tehran',
  workDays: [1, 2, 3, 4, 5], // Mon-Fri (1=Mon, 7=Sun)
  workStartHour: 9,
  workEndHour: 18,
  holidays: [], // Array of 'YYYY-MM-DD' strings
};

function parseWorkingCalendar(calendarJson) {
  if (!calendarJson) return DEFAULT_WORKING_CALENDAR;
  try {
    const cal = typeof calendarJson === 'string' ? JSON.parse(calendarJson) : calendarJson;
    const timezone = typeof cal.timezone === 'string' && cal.timezone.trim()
      ? cal.timezone.trim()
      : DEFAULT_WORKING_CALENDAR.timezone;
    // Validate the IANA timezone once while parsing persisted policy data.
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(new Date());
    const workDays = Array.isArray(cal.workDays) ? cal.workDays : DEFAULT_WORKING_CALENDAR.workDays;
    const workStartHour = Number.isInteger(cal.workStartHour) ? cal.workStartHour : DEFAULT_WORKING_CALENDAR.workStartHour;
    const workEndHour = Number.isInteger(cal.workEndHour) ? cal.workEndHour : DEFAULT_WORKING_CALENDAR.workEndHour;
    const holidays = Array.isArray(cal.holidays) ? cal.holidays : DEFAULT_WORKING_CALENDAR.holidays;
    if (!workDays.length || workDays.some((day) => !Number.isInteger(day) || day < 1 || day > 7)) return DEFAULT_WORKING_CALENDAR;
    if (workStartHour < 0 || workStartHour > 23 || workEndHour < 1 || workEndHour > 24 || workEndHour <= workStartHour) return DEFAULT_WORKING_CALENDAR;
    if (holidays.some((holiday) => typeof holiday !== 'string' || !/^\\d{4}-\\d{2}-\\d{2}$/.test(holiday))) return DEFAULT_WORKING_CALENDAR;
    return { timezone, workDays, workStartHour, workEndHour, holidays };
  } catch {
    return DEFAULT_WORKING_CALENDAR;
  }
}

function getCalendarDateParts(date, timezone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(date));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const weekdayByName = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    weekday: weekdayByName[values.weekday],
    hour: Number(values.hour),
    minute: Number(values.minute),
  };
}

function calendarDateKey(parts) {
  return `${String(parts.year).padStart(4, '0')}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

function addCalendarDays(parts, days) {
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

function zonedDateTimeToUtc({ year, month, day, hour = 0, minute = 0 }, timezone) {
  const targetUtc = Date.UTC(year, month - 1, day, hour, minute);
  let candidate = targetUtc;
  // Resolve the IANA timezone offset iteratively. This avoids relying on the
  // host/container timezone and handles DST offset changes for the target date.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const local = getCalendarDateParts(new Date(candidate), timezone);
    const representedUtc = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute);
    const offset = representedUtc - candidate;
    const next = targetUtc - offset;
    if (next === candidate) break;
    candidate = next;
  }
  return new Date(candidate);
}

function isWorkingDay(date, calendar) {
  const parts = getCalendarDateParts(date, calendar.timezone);
  return calendar.workDays.includes(parts.weekday) && !calendar.holidays.includes(calendarDateKey(parts));
}

function addWorkingMinutes(startDate, minutes, calendar) {
  let current = new Date(startDate);
  let remainingMinutes = Math.max(0, Number(minutes) || 0);
  if (!Number.isFinite(current.getTime())) throw new TypeError('Invalid SLA start date');
  if (remainingMinutes === 0) return current;

  let guard = 0;
  while (remainingMinutes > 0) {
    if (++guard > 10000) throw new Error('SLA working calendar exceeded its safety limit');
    const parts = getCalendarDateParts(current, calendar.timezone);
    const localMinutes = parts.hour * 60 + parts.minute;
    const startMinutes = calendar.workStartHour * 60;
    const endMinutes = calendar.workEndHour * 60;

    if (!calendar.workDays.includes(parts.weekday) || calendar.holidays.includes(calendarDateKey(parts)) || localMinutes >= endMinutes) {
      let nextDay = addCalendarDays(parts, 1);
      while (!calendar.workDays.includes(getCalendarDateParts(zonedDateTimeToUtc(nextDay, calendar.timezone), calendar.timezone).weekday)
        || calendar.holidays.includes(calendarDateKey(nextDay))) {
        nextDay = addCalendarDays(nextDay, 1);
      }
      current = zonedDateTimeToUtc({ ...nextDay, hour: calendar.workStartHour }, calendar.timezone);
      continue;
    }

    if (localMinutes < startMinutes) {
      current = zonedDateTimeToUtc({ ...parts, hour: calendar.workStartHour }, calendar.timezone);
      continue;
    }

    const availableMinutes = endMinutes - localMinutes;
    if (remainingMinutes <= availableMinutes) {
      return new Date(current.getTime() + remainingMinutes * 60000);
    }

    remainingMinutes -= availableMinutes;
    let nextDay = addCalendarDays(parts, 1);
    while (!calendar.workDays.includes(getCalendarDateParts(zonedDateTimeToUtc(nextDay, calendar.timezone), calendar.timezone).weekday)
      || calendar.holidays.includes(calendarDateKey(nextDay))) {
      nextDay = addCalendarDays(nextDay, 1);
    }
    current = zonedDateTimeToUtc({ ...nextDay, hour: calendar.workStartHour }, calendar.timezone);
  }

  return current;
}

function calculateWorkingMinutesBetween(startDate, endDate, calendar) {
  const startMs = new Date(startDate).getTime();
  const endMs = new Date(endDate).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return 0;

  let totalMinutes = 0;
  let day = getCalendarDateParts(new Date(startMs), calendar.timezone);
  day = { year: day.year, month: day.month, day: day.day };
  const finalDay = getCalendarDateParts(new Date(endMs), calendar.timezone);
  const finalDateKey = calendarDateKey(finalDay);
  let guard = 0;

  while (calendarDateKey(day) <= finalDateKey) {
    if (++guard > 10000) throw new Error('SLA working calendar exceeded its safety limit');
    if (isWorkingDay(zonedDateTimeToUtc(day, calendar.timezone), calendar)) {
      const workStart = zonedDateTimeToUtc({ ...day, hour: calendar.workStartHour }, calendar.timezone).getTime();
      const workEnd = zonedDateTimeToUtc({ ...day, hour: calendar.workEndHour }, calendar.timezone).getTime();
      const overlapStart = Math.max(startMs, workStart);
      const overlapEnd = Math.min(endMs, workEnd);
      if (overlapEnd > overlapStart) totalMinutes += Math.floor((overlapEnd - overlapStart) / 60000);
    }
    day = addCalendarDays(day, 1);
  }

  return totalMinutes;
}

async function findSlaPolicy(prismaClient, ticket) {
  return ticket.category?.slaPolicies?.find((policy) => policy.priority === ticket.priority)
    || await prismaClient.supportSlaPolicy.findFirst({ where: { categoryId: ticket.categoryId, priority: ticket.priority, isActive: true } })
    || await prismaClient.supportSlaPolicy.findFirst({ where: { categoryId: null, priority: ticket.priority, isActive: true } })
    || await prismaClient.supportSlaPolicy.findFirst({ where: { priority: ticket.priority, isActive: true } });
}

async function getActiveSlaPause(prismaClient, ticketId) {
  const [lastPause, lastResume] = await Promise.all([
    prismaClient.supportEvent.findFirst({
      where: { ticketId, eventType: 'SLA_PAUSED' },
      orderBy: { occurredAt: 'desc' },
    }),
    prismaClient.supportEvent.findFirst({
      where: { ticketId, eventType: 'SLA_RESUMED' },
      orderBy: { occurredAt: 'desc' },
    }),
  ]);

  if (!lastPause) return null;
  if (lastResume && new Date(lastResume.occurredAt).getTime() >= new Date(lastPause.occurredAt).getTime()) return null;
  return lastPause;
}

async function getSla(prismaClient, categoryId, priority) {
  // Prefer the category-specific policy, then an explicit global policy.
  // If neither exists, fall back to an active policy for the same priority.
  // This keeps uncategorized tickets inside the SLA contract when a project
  // has only category-scoped seed policies.
  const categoryPolicy = categoryId
    ? await prismaClient.supportSlaPolicy.findFirst({ where: { categoryId, priority, isActive: true } })
    : null;
  const defaultPolicy = categoryPolicy || await prismaClient.supportSlaPolicy.findFirst({
    where: { categoryId: null, priority, isActive: true },
  });
  const policy = defaultPolicy || await prismaClient.supportSlaPolicy.findFirst({
    where: { priority, isActive: true },
  });
  if (!policy) return {};

  const calendar = parseWorkingCalendar(policy.workingCalendar);
  const now = new Date();

  return {
    firstResponseDueAt: addWorkingMinutes(now, policy.firstResponseMinutes, calendar),
    resolveDueAt: addWorkingMinutes(now, policy.resolutionMinutes, calendar),
    slaPolicyId: policy.id,
  };
}

// Calculate remaining SLA time in minutes (negative = overdue)
function calculateSlaRemaining(dueAt, now = new Date()) {
  if (!dueAt) return null;
  const diffMs = new Date(dueAt).getTime() - new Date(now).getTime();
  return Math.floor(diffMs / 60000);
}

// Check if SLA is breached
function isSlaBreached(dueAt, now = new Date()) {
  const remaining = calculateSlaRemaining(dueAt, now);
  return remaining !== null && remaining < 0;
}

// Check if SLA is at risk (within 20% of deadline)
function isSlaAtRisk(dueAt, totalMinutes, now = new Date()) {
  if (!dueAt || !totalMinutes) return false;
  const remaining = calculateSlaRemaining(dueAt, now);
  if (remaining === null) return false;
  const threshold = Math.ceil(totalMinutes * 0.2);
  return remaining <= threshold && remaining >= 0;
}

async function getSlaDetails(prismaClient, ticketId, now = new Date()) {
  const ticket = await prismaClient.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      category: { include: { slaPolicies: { where: { isActive: true } } } },
    },
  });
  if (!ticket) return null;

  const policy = await findSlaPolicy(prismaClient, ticket);
  if (!policy) return null;

  const calendar = parseWorkingCalendar(policy.workingCalendar);
  const activePause = await getActiveSlaPause(prismaClient, ticketId);
  const pausedWorkingMinutes = activePause
    ? calculateWorkingMinutesBetween(activePause.occurredAt, now, calendar)
    : 0;

  const baseFirstResponseDueAt = ticket.firstResponseDueAt || addWorkingMinutes(ticket.createdAt, policy.firstResponseMinutes, calendar);
  const baseResolveDueAt = ticket.resolveDueAt || addWorkingMinutes(ticket.createdAt, policy.resolutionMinutes, calendar);
  const firstResponseDueAt = pausedWorkingMinutes > 0
    ? addWorkingMinutes(baseFirstResponseDueAt, pausedWorkingMinutes, calendar)
    : baseFirstResponseDueAt;
  const resolveDueAt = pausedWorkingMinutes > 0
    ? addWorkingMinutes(baseResolveDueAt, pausedWorkingMinutes, calendar)
    : baseResolveDueAt;

  return {
    isPaused: Boolean(activePause),
    pausedAt: activePause?.occurredAt || null,
    policy: {
      id: policy.id,
      firstResponseMinutes: policy.firstResponseMinutes,
      resolutionMinutes: policy.resolutionMinutes,
    },
    firstResponse: {
      dueAt: firstResponseDueAt,
      remainingMinutes: Math.floor((new Date(firstResponseDueAt).getTime() - new Date(now).getTime()) / 60000),
      isBreached: new Date(firstResponseDueAt).getTime() < new Date(now).getTime(),
      isAtRisk: isSlaAtRisk(firstResponseDueAt, policy.firstResponseMinutes, now),
      respondedAt: ticket.firstRespondedAt,
    },
    resolution: {
      dueAt: resolveDueAt,
      remainingMinutes: Math.floor((new Date(resolveDueAt).getTime() - new Date(now).getTime()) / 60000),
      isBreached: new Date(resolveDueAt).getTime() < new Date(now).getTime(),
      isAtRisk: isSlaAtRisk(resolveDueAt, policy.resolutionMinutes, now),
      resolvedAt: ticket.resolvedAt,
    },
  };
}

async function pauseSla(prismaClient, ticketId, userId, reason, now = new Date()) {
  const execute = async (tx) => {
    const ticket = await tx.supportTicket.findUnique({ where: { id: ticketId }, select: { id: true, status: true } });
    if (!ticket) fail(404, 'SUPPORT_TICKET_NOT_FOUND', 'تیکت پیدا نشد.');
    if (['RESOLVED', 'CLOSED', 'SPAM'].includes(ticket.status)) {
      fail(409, 'SUPPORT_SLA_TICKET_LOCKED', 'برای تیکت حل‌شده یا بسته‌شده امکان توقف SLA وجود ندارد.');
    }
    if (await getActiveSlaPause(tx, ticketId)) {
      fail(409, 'SUPPORT_SLA_ALREADY_PAUSED', 'SLA این تیکت از قبل متوقف شده است.');
    }
    return tx.supportEvent.create({
      data: {
        ticketId,
        actorUserId: userId,
        eventType: 'SLA_PAUSED',
        dedupeKey: `sla-paused:${ticketId}:${now.getTime()}`,
        occurredAt: now,
        payload: { reason: String(reason).slice(0, 500) },
      },
    });
  };
  return typeof prismaClient.$transaction === 'function'
    ? prismaClient.$transaction(execute)
    : execute(prismaClient);
}

async function resumeSla(prismaClient, ticketId, userId, reason, now = new Date()) {
  const execute = async (tx) => {
    const ticket = await tx.supportTicket.findUnique({
      where: { id: ticketId },
      include: { category: { include: { slaPolicies: { where: { isActive: true } } } } },
    });
    if (!ticket) fail(404, 'SUPPORT_TICKET_NOT_FOUND', 'تیکت پیدا نشد.');
    const activePause = await getActiveSlaPause(tx, ticketId);
    if (!activePause) fail(409, 'SUPPORT_SLA_NOT_PAUSED', 'SLA این تیکت متوقف نیست.');

    const policy = await findSlaPolicy(tx, ticket);
    const calendar = parseWorkingCalendar(policy?.workingCalendar);
    const pausedWorkingMinutes = calculateWorkingMinutesBetween(activePause.occurredAt, now, calendar);
    const baseFirstResponseDueAt = ticket.firstResponseDueAt
      || (policy ? addWorkingMinutes(ticket.createdAt, policy.firstResponseMinutes, calendar) : null);
    const baseResolveDueAt = ticket.resolveDueAt
      || (policy ? addWorkingMinutes(ticket.createdAt, policy.resolutionMinutes, calendar) : null);
    const update = {};
    if (pausedWorkingMinutes > 0) {
      if (baseFirstResponseDueAt) {
        update.firstResponseDueAt = addWorkingMinutes(baseFirstResponseDueAt, pausedWorkingMinutes, calendar);
      }
      if (baseResolveDueAt) {
        update.resolveDueAt = addWorkingMinutes(baseResolveDueAt, pausedWorkingMinutes, calendar);
      }
    }

    if (Object.keys(update).length) {
      await tx.supportTicket.update({ where: { id: ticketId }, data: update });
    }

    return tx.supportEvent.create({
      data: {
        ticketId,
        actorUserId: userId,
        eventType: 'SLA_RESUMED',
        dedupeKey: `sla-resumed:${ticketId}:${now.getTime()}`,
        occurredAt: now,
        payload: { reason: String(reason).slice(0, 500), pausedWorkingMinutes },
      },
    });
  };
  return typeof prismaClient.$transaction === 'function'
    ? prismaClient.$transaction(execute)
    : execute(prismaClient);
}

module.exports = {
  listCategories,
  listQueues,
  listTickets,
  getTicket,
  createTicket,
  addMessage,
  changeStatus,
  assignTicket,
  getSla,
  getSlaDetails,
  uploadAttachment,
  downloadAttachment,
  deleteAttachment,
  // SLA utilities
  parseWorkingCalendar,
  addWorkingMinutes,
  calculateWorkingMinutesBetween,
  isWorkingDay,
  calculateSlaRemaining,
  isSlaBreached,
  isSlaAtRisk,
  pauseSla,
  resumeSla,
};

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
  if (query.status) {
    if (!STATUSES.has(query.status)) fail(400, 'SUPPORT_STATUS_INVALID', 'وضعیت انتخاب‌شده معتبر نیست.');
    where.status = query.status;
  }
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

    // Notify ticket requester
    await dispatchNotification('SUPPORT_TICKET_CREATED', [ctx.userId], { ticket }, {
      tx,
      dedupeKey: `ticket-created:${ticket.id}-requester`,
    });

    // Notify staff with tickets.read permission
    await dispatchNotification('SUPPORT_TICKET_CREATED', { permission: 'tickets.read' }, { ticket }, {
      tx,
      dedupeKey: (uid) => `ticket-created:${ticket.id}-staff-${uid}`,
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
    const reopened = ctx.accessType !== 'STAFF' && ['WAITING_CUSTOMER', 'WAITING_COMPANY', 'RESOLVED'].includes(ticket.status);
    if (reopened) {
      data.status = 'IN_PROGRESS';
      data.resolvedAt = null;
    }
    await tx.supportTicket.update({ where: { id }, data });
    if (reopened) {
      await tx.supportStatusHistory.create({ data: { ticketId: id, previous: ticket.status, next: 'IN_PROGRESS', actorUserId: ctx.userId, reason: 'Requester replied to the ticket' } });
    }
    await tx.supportEvent.create({
      data: {
        ticketId: id, actorUserId: ctx.userId, eventType: 'MESSAGE_CREATED',
        dedupeKey: `ticket-message:${id}:${message.id}`,
        payload: { visibility },
      },
    });

    // Notify ticket participants (requester + assignee) if message is public
    if (visibility === 'PUBLIC') {
      const recipientIds = [];
      if (ticket.requesterUserId && ticket.requesterUserId !== ctx.userId) {
        recipientIds.push(ticket.requesterUserId);
      }
      if (ticket.assignedUserId && ticket.assignedUserId !== ctx.userId) {
        recipientIds.push(ticket.assignedUserId);
      }
      // Also notify queue members if assigned queue
      if (ticket.assignedQueueId) {
        const queueMembers = await tx.user.findMany({
          where: {
            accessProfile: { type: 'STAFF', isActive: true },
            status: 'ACTIVE',
          },
          select: { id: true },
        });
        for (const member of queueMembers) {
          if (!recipientIds.includes(member.id) && member.id !== ctx.userId) {
            recipientIds.push(member.id);
          }
        }
      }

      if (recipientIds.length > 0) {
        await dispatchNotification('SUPPORT_MESSAGE_RECEIVED', recipientIds, { ticket, message, sender: user }, {
          tx,
          dedupeKey: (uid) => `ticket-message:${id}:${message.id}-${uid}`,
        });
      }
    }

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
        resolvedAt: next === 'RESOLVED' ? now : next === 'IN_PROGRESS' ? null : current.resolvedAt,
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

    // Notify ticket participants (requester + assignee) of status change
    const recipientIds = [];
    if (current.requesterUserId) {
      recipientIds.push(current.requesterUserId);
    }
    if (current.assignedUserId && current.assignedUserId !== current.requesterUserId) {
      recipientIds.push(current.assignedUserId);
    }
    // Also notify queue members
    if (current.assignedQueueId) {
      const queueMembers = await tx.user.findMany({
        where: {
          accessProfile: { type: 'STAFF', isActive: true },
          status: 'ACTIVE',
        },
        select: { id: true },
      });
      for (const member of queueMembers) {
        if (!recipientIds.includes(member.id)) {
          recipientIds.push(member.id);
        }
      }
    }

    if (recipientIds.length > 0) {
      await dispatchNotification('SUPPORT_TICKET_STATUS_CHANGED', recipientIds, { ticket: current, status: next, previousStatus: current.status }, {
        tx,
        dedupeKey: (uid) => `ticket-status:${id}:${next}-${uid}`,
      });
    }

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
    if (['CLOSED', 'SPAM'].includes(ticket.status)) fail(409, 'SUPPORT_TICKET_LOCKED', 'تیکت بسته یا هرزنامه قابل تخصیص نیست.');
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

    // Notify assignee
    if (assigneeId) {
      await dispatchNotification('SUPPORT_TICKET_ASSIGNED', [assigneeId], { ticket, assignee: { id: assigneeId }, queue: { id: queueId } }, {
        tx,
        dedupeKey: `ticket-assigned:${id}:${assigneeId}`,
      });
    }

    // Notify requester
    if (ticket.requesterUserId && ticket.requesterUserId !== assigneeId) {
      await dispatchNotification('SUPPORT_TICKET_ASSIGNED', [ticket.requesterUserId], { ticket, assignee: { id: assigneeId }, queue: { id: queueId } }, {
        tx,
        dedupeKey: `ticket-assigned:${id}:requester-${ticket.requesterUserId}`,
      });
    }

    return updated;
  });
}

// ─── Attachment functions ───
async function uploadAttachment(user, ticketId, messageId, file) {
  const ctx = context(user);
  const ticket = await prisma.supportTicket.findFirst({
    where: { id: toId(ticketId), ...scopeWhere(ctx) },
    select: { id: true, requesterUserId: true, requesterCompanyId: true, assignedUserId: true },
  });
  if (!ticket) fail(404, 'SUPPORT_TICKET_NOT_FOUND', 'تیکت پیدا نشد.');

  // Verify message exists and belongs to this ticket
  const message = await prisma.supportMessage.findFirst({
    where: { id: toId(messageId), ticketId: ticket.id },
    select: { id: true, senderUserId: true, visibility: true },
  });
  if (!message) fail(404, 'SUPPORT_MESSAGE_NOT_FOUND', 'پیام پیدا نشد.');

  // Permission check: users can only attach to their own messages, STAFF can attach to any
  const isOwnMessage = message.senderUserId === ctx.userId;
  const isStaff = ctx.accessType === 'STAFF';
  if (!isOwnMessage && !isStaff) fail(403, 'SUPPORT_ATTACHMENT_FORBIDDEN', 'شما نمی‌توانید به پیام دیگران فایل پیوست کنید.');

  // For internal messages, only STAFF can attach
  if (message.visibility === 'INTERNAL' && !isStaff) fail(403, 'SUPPORT_ATTACHMENT_FORBIDDEN', 'پیوست به یادداشت داخلی فقط برای کارکنان مجاز است.');

  assertUploadedFile(file);
  assertFileType(file, SUPPORTED_ATTACHMENT_TYPES, 'SUPPORT_INVALID_FILE_TYPE');

  const stored = await saveUploadedFile(file, 'attachments', MAX_ATTACHMENT_BYTES);

  return prisma.$transaction(async (tx) => {
    const attachment = await tx.supportAttachment.create({
      data: {
        messageId: message.id,
        uploadedByUserId: ctx.userId,
        storageKey: stored.storageKey,
        originalName: file.filename,
        mimeType: file.mimetype,
        sizeBytes: stored.bytes,
        checksum: stored.checksum,
        status: 'AVAILABLE',
      },
    });

    // Notify ticket participants if message is public
    if (message.visibility === 'PUBLIC') {
      const recipientIds = [];
      if (ticket.requesterUserId && ticket.requesterUserId !== ctx.userId) {
        recipientIds.push(ticket.requesterUserId);
      }
      if (ticket.assignedUserId && ticket.assignedUserId !== ctx.userId) {
        recipientIds.push(ticket.assignedUserId);
      }
      if (recipientIds.length > 0) {
        await dispatchNotification('SUPPORT_MESSAGE_RECEIVED', recipientIds, {
          ticket,
          message: { ...message, attachments: [attachment] },
          sender: user,
        }, { tx, dedupeKey: (uid) => `ticket-message:${ticket.id}:${message.id}-${uid}` });
      }
    }

    return attachment;
  });
}

async function downloadAttachment(user, ticketId, attachmentId) {
  const ctx = context(user);
  const ticket = await prisma.supportTicket.findFirst({
    where: { id: toId(ticketId), ...scopeWhere(ctx) },
    select: { id: true, requesterUserId: true, requesterCompanyId: true, assignedUserId: true },
  });
  if (!ticket) fail(404, 'SUPPORT_TICKET_NOT_FOUND', 'تیکت پیدا نشد.');

  const attachment = await prisma.supportAttachment.findFirst({
    where: { id: toId(attachmentId), message: { ticketId: ticket.id } },
    include: { message: { select: { visibility: true } } },
  });
  if (!attachment) fail(404, 'SUPPORT_ATTACHMENT_NOT_FOUND', 'پیوست پیدا نشد.');

  // Check authorization: internal attachments only for STAFF
  if (attachment.message.visibility === 'INTERNAL' && ctx.accessType !== 'STAFF') {
    fail(403, 'SUPPORT_ATTACHMENT_FORBIDDEN', 'دسترسی به این پیوست مجاز نیست.');
  }

  // Only allow download of AVAILABLE attachments
  if (attachment.status !== 'AVAILABLE') {
    fail(404, 'SUPPORT_ATTACHMENT_NOT_FOUND', 'پیوست برای دانلود موجود نیست.');
  }

  const filePath = path.join(SUPPORT_UPLOAD_ROOT, attachment.storageKey.replace(/^\/support\//, ''));
  const exists = await fs.promises.access(filePath).then(() => true).catch(() => false);
  if (!exists) {
    fail(404, 'SUPPORT_ATTACHMENT_NOT_FOUND', 'فایل پیوست در سرور یافت نشد.');
  }

  return {
    filePath,
    originalName: attachment.originalName,
    mimeType: attachment.mimeType,
    sizeBytes: attachment.sizeBytes,
  };
}

async function deleteAttachment(user, ticketId, attachmentId) {
  const ctx = context(user);
  const ticket = await prisma.supportTicket.findFirst({
    where: { id: toId(ticketId), ...scopeWhere(ctx) },
    select: { id: true },
  });
  if (!ticket) fail(404, 'SUPPORT_TICKET_NOT_FOUND', 'تیکت پیدا نشد.');

  const attachment = await prisma.supportAttachment.findFirst({
    where: { id: toId(attachmentId), message: { ticketId: ticket.id } },
    include: { message: { select: { senderUserId: true, visibility: true } } },
  });
  if (!attachment) fail(404, 'SUPPORT_ATTACHMENT_NOT_FOUND', 'پیوست پیدا نشد.');

  // Permission check: only uploader or STAFF can delete
  const isUploader = attachment.uploadedByUserId === ctx.userId;
  const isStaff = ctx.accessType === 'STAFF';
  if (!isUploader && !isStaff) fail(403, 'SUPPORT_ATTACHMENT_FORBIDDEN', 'شما نمی‌توانید این پیوست را حذف کنید.');

  await prisma.$transaction(async (tx) => {
    await tx.supportAttachment.delete({ where: { id: attachment.id } });
    await removeStoredFile(attachment.storageKey);
  });

  return { success: true };
}

// ─── Queue-level Authorization & Visibility ───

async function listTicketsByQueue(user, queueId, query = {}) {
  const ctx = context(user);
  if (ctx.accessType !== 'STAFF') fail(403, 'SUPPORT_STAFF_ONLY', 'فقط کارکنان می‌توانند تیکت‌های صف را ببینند.');

  // Verify queue exists and is active
  const queue = await prisma.supportQueue.findFirst({ where: { id: queueId, isActive: true }, select: { id: true } });
  if (!queue) fail(404, 'SUPPORT_QUEUE_NOT_FOUND', 'صف پیدا نشد.');

  const where = { assignedQueueId: queueId };
  if (query.status) {
    if (!STATUSES.has(query.status)) fail(400, 'SUPPORT_STATUS_INVALID', 'وضعیت انتخاب‌شده معتبر نیست.');
    where.status = query.status;
  }
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 25));
  const [rows, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      include: { ...ticketInclude(true), _count: { select: { messages: true } } },
      orderBy: [{ lastActivityAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.supportTicket.count({ where }),
  ]);
  return { data: rows, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function getQueueStats(user, queueId) {
  const ctx = context(user);
  if (ctx.accessType !== 'STAFF') fail(403, 'SUPPORT_STAFF_ONLY', 'فقط کارکنان می‌توانند آمار صف را ببینند.');

  const queue = await prisma.supportQueue.findFirst({ where: { id: queueId, isActive: true }, select: { id: true, name: true } });
  if (!queue) fail(404, 'SUPPORT_QUEUE_NOT_FOUND', 'صف پیدا نشد.');

  const [
    total,
    open,
    inProgress,
    waitingCustomer,
    waitingCompany,
    resolved,
    closed,
    spam,
    highPriority,
    urgentPriority,
    slaBreached,
    slaAtRisk,
    unassigned,
  ] = await Promise.all([
    prisma.supportTicket.count({ where: { assignedQueueId: queueId } }),
    prisma.supportTicket.count({ where: { assignedQueueId: queueId, status: 'OPEN' } }),
    prisma.supportTicket.count({ where: { assignedQueueId: queueId, status: 'IN_PROGRESS' } }),
    prisma.supportTicket.count({ where: { assignedQueueId: queueId, status: 'WAITING_CUSTOMER' } }),
    prisma.supportTicket.count({ where: { assignedQueueId: queueId, status: 'WAITING_COMPANY' } }),
    prisma.supportTicket.count({ where: { assignedQueueId: queueId, status: 'RESOLVED' } }),
    prisma.supportTicket.count({ where: { assignedQueueId: queueId, status: 'CLOSED' } }),
    prisma.supportTicket.count({ where: { assignedQueueId: queueId, status: 'SPAM' } }),
    prisma.supportTicket.count({ where: { assignedQueueId: queueId, priority: 'HIGH' } }),
    prisma.supportTicket.count({ where: { assignedQueueId: queueId, priority: 'URGENT' } }),
    prisma.supportTicket.count({
      where: {
        assignedQueueId: queueId,
        status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'WAITING_COMPANY'] },
        OR: [
          { firstResponseDueAt: { lt: new Date() }, firstRespondedAt: null },
          { resolveDueAt: { lt: new Date() }, resolvedAt: null, closedAt: null },
        ],
      },
    }),
    prisma.supportTicket.count({
      where: {
        assignedQueueId: queueId,
        status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'WAITING_COMPANY'] },
        OR: [
          { firstResponseDueAt: { lte: new Date(Date.now() + 2 * 60 * 60 * 1000) }, firstRespondedAt: null },
          { resolveDueAt: { lte: new Date(Date.now() + 2 * 60 * 60 * 1000) }, resolvedAt: null, closedAt: null },
        ],
      },
    }),
    prisma.supportTicket.count({ where: { assignedQueueId: queueId, assignedUserId: null } }),
  ]);

  return {
    queue: { id: queue.id, name: queue.name },
    totals: {
      total,
      byStatus: { open, inProgress, waitingCustomer, waitingCompany, resolved, closed, spam },
      byPriority: { high: highPriority, urgent: urgentPriority },
      sla: { breached: slaBreached, atRisk: slaAtRisk },
      unassigned,
    },
  };
}

async function getQueueAssignments(queueId) {
  const queue = await prisma.supportQueue.findFirst({ where: { id: queueId, isActive: true }, select: { id: true } });
  if (!queue) fail(404, 'SUPPORT_QUEUE_NOT_FOUND', 'صف پیدا نشد.');

  const assignments = await prisma.supportAssignment.findMany({
    where: { queueId, endedAt: null },
    include: {
      assignee: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } },
      assignedBy: { select: { id: true, email: true } },
    },
    orderBy: { assignedAt: 'desc' },
  });

  return assignments;
}

module.exports = {
  listCategories,
  listQueues,
  listTickets,
  getTicket,
  createTicket,
  addMessage,
  changeStatus,
  assignTicket,
  getSla,
  getSlaDetails,
  uploadAttachment,
  downloadAttachment,
  deleteAttachment,
  // Queue-level
  listTicketsByQueue,
  getQueueStats,
  getQueueAssignments,
  // SLA utilities
  parseWorkingCalendar,
  addWorkingMinutes,
  calculateWorkingMinutesBetween,
  isWorkingDay,
  calculateSlaRemaining,
  isSlaBreached,
  isSlaAtRisk,
  pauseSla,
  resumeSla,
};
