const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const prisma = require('../../config/db');
const { AppError } = require('../../utils/error');

const UPLOAD_ROOT = path.join(process.cwd(), 'uploads', 'banners');
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function validatePayload(data) {
  const title = String(data.title || '').trim();
  if (!title || title.length > 120) throw new AppError('عنوان بنر الزامی و حداکثر ۱۲۰ کاراکتر است.', 400, true, 'INVALID_BANNER_TITLE');
  if (!data.imageUrl || typeof data.imageUrl !== 'string' || data.imageUrl.length > 1000) throw new AppError('تصویر بنر الزامی است.', 400, true, 'BANNER_IMAGE_REQUIRED');
  if (data.targetUrl && !/^\/(?!\/)|^https:\/\//i.test(data.targetUrl)) throw new AppError('لینک مقصد باید مسیر داخلی یا آدرس HTTPS باشد.', 400, true, 'INVALID_BANNER_URL');
  const start = data.startsAt ? new Date(data.startsAt) : null;
  const end = data.endsAt ? new Date(data.endsAt) : null;
  if ((start && Number.isNaN(start.getTime())) || (end && Number.isNaN(end.getTime()))) throw new AppError('زمان‌بندی بنر معتبر نیست.', 400, true, 'INVALID_BANNER_SCHEDULE');
  if (start && end && end <= start) throw new AppError('زمان پایان باید بعد از زمان شروع باشد.', 400, true, 'INVALID_BANNER_SCHEDULE');
}

function activeWhere(placement) {
  const now = new Date();
  return {
    placement,
    status: 'PUBLISHED',
    isActive: true,
    deletedAt: null,
    AND: [
      { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
      { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
    ],
  };
}

async function listPublic(placement = 'HOME_HERO') {
  return prisma.banner.findMany({
    where: activeWhere(placement),
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    select: { id: true, title: true, description: true, imageUrl: true, targetUrl: true, ctaLabel: true, placement: true },
  });
}

async function listAdmin({ page = 1, limit = 20, search = '', status } = {}) {
  const where = { deletedAt: null, ...(status ? { status } : {}), ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}) };
  const [data, total] = await Promise.all([
    prisma.banner.findMany({ where, orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }], skip: (page - 1) * limit, take: limit }),
    prisma.banner.count({ where }),
  ]);
  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function getById(id) {
  const item = await prisma.banner.findFirst({ where: { id, deletedAt: null } });
  if (!item) throw new AppError('بنر پیدا نشد.', 404, true, 'BANNER_NOT_FOUND');
  return item;
}

async function create(data) {
  validatePayload(data);
  return prisma.banner.create({ data: {
    title: data.title.trim(), description: data.description?.trim() || null,
    imageUrl: data.imageUrl, targetUrl: data.targetUrl || null, ctaLabel: data.ctaLabel?.trim() || null,
    placement: data.placement || 'HOME_HERO', sortOrder: Number(data.sortOrder || 0),
    status: data.status || 'DRAFT', isActive: data.isActive ?? true,
    startsAt: data.startsAt ? new Date(data.startsAt) : null, endsAt: data.endsAt ? new Date(data.endsAt) : null,
  } });
}

async function update(id, data) {
  const existing = await getById(id);
  const merged = { ...existing, ...data };
  validatePayload(merged);
  const updateData = {};
  for (const key of ['title','description','imageUrl','targetUrl','ctaLabel','placement','sortOrder','status','isActive']) {
    if (data[key] !== undefined) updateData[key] = data[key];
  }
  for (const key of ['startsAt','endsAt']) if (data[key] !== undefined) updateData[key] = data[key] ? new Date(data[key]) : null;
  return prisma.banner.update({ where: { id }, data: updateData });
}

async function archive(id) {
  await getById(id);
  return prisma.banner.update({ where: { id }, data: { status: 'ARCHIVED', isActive: false, deletedAt: new Date() } });
}

function imageSignature(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'image/png';
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

async function uploadImage(file) {
  if (!file) throw new AppError('فایل تصویر ارسال نشده است.', 400, true, 'FILE_REQUIRED');
  const buffer = await file.toBuffer();
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) throw new AppError('حجم تصویر باید حداکثر ۸ مگابایت باشد.', 413, true, 'BANNER_IMAGE_TOO_LARGE');
  const detected = imageSignature(buffer);
  if (!detected || detected !== file.mimetype) throw new AppError('فرمت واقعی تصویر معتبر نیست. فقط JPG، PNG و WebP مجاز است.', 400, true, 'INVALID_BANNER_IMAGE');
  await fs.mkdir(UPLOAD_ROOT, { recursive: true });
  const filename = `${Date.now()}-${crypto.randomBytes(12).toString('hex')}.${detected === 'image/jpeg' ? 'jpg' : detected.split('/')[1]}`;
  await fs.writeFile(path.join(UPLOAD_ROOT, filename), buffer, { flag: 'wx' });
  return { url: `/uploads/banners/${filename}`, size: buffer.length, mimeType: detected };
}

module.exports = { listPublic, listAdmin, getById, create, update, archive, uploadImage };
