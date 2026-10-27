const prisma = require('../../config/db');

const ADDRESS_SELECT = {
  id: true,
  userId: true,
  label: true,
  recipientName: true,
  recipientPhone: true,
  province: true,
  city: true,
  addressLine: true,
  postalCode: true,
  isDefault: true,
  createdAt: true,
  updatedAt: true,
};

function notFound() {
  return { statusCode: 404, code: 'ADDRESS_NOT_FOUND', message: 'آدرس موردنظر پیدا نشد.' };
}

function normalizeAddress(input = {}) {
  const result = {};
  for (const key of ['label', 'recipientName', 'recipientPhone', 'province', 'city', 'addressLine', 'postalCode']) {
    if (input[key] !== undefined) result[key] = typeof input[key] === 'string' ? input[key].trim() : input[key];
  }
  if (input.isDefault !== undefined) result.isDefault = Boolean(input.isDefault);
  return result;
}

async function listAddresses(userId) {
  return prisma.address.findMany({
    where: { userId: Number(userId) },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    select: ADDRESS_SELECT,
  });
}

async function getAddress(userId, addressId) {
  const address = await prisma.address.findFirst({
    where: { id: Number(addressId), userId: Number(userId) },
    select: ADDRESS_SELECT,
  });
  if (!address) throw notFound();
  return address;
}

async function createAddress(userId, input) {
  const data = normalizeAddress(input);
  return prisma.$transaction(async (tx) => {
    const count = await tx.address.count({ where: { userId: Number(userId) } });
    const makeDefault = data.isDefault === true || count === 0;
    if (makeDefault) {
      await tx.address.updateMany({ where: { userId: Number(userId), isDefault: true }, data: { isDefault: false } });
    }
    return tx.address.create({
      data: { ...data, isDefault: makeDefault, userId: Number(userId) },
      select: ADDRESS_SELECT,
    });
  });
}

async function updateAddress(userId, addressId, input) {
  const data = normalizeAddress(input);
  const ownerId = Number(userId);
  return prisma.$transaction(async (tx) => {
    const existing = await tx.address.findFirst({ where: { id: Number(addressId), userId: ownerId } });
    if (!existing) throw notFound();

    if (data.isDefault === true) {
      await tx.address.updateMany({ where: { userId: ownerId, isDefault: true }, data: { isDefault: false } });
    }

    // A customer cannot accidentally end up with no default address by
    // unchecking the only default. If alternatives exist, promote the newest
    // one after clearing the current default (required by the partial unique index).
    if (data.isDefault === false && existing.isDefault) {
      const alternatives = await tx.address.findMany({
        where: { userId: ownerId },
        orderBy: [{ createdAt: 'desc' }],
      });
      const nextDefault = alternatives.find((address) => address.id !== existing.id);
      if (nextDefault) {
        const updated = await tx.address.update({
          where: { id: existing.id },
          data,
          select: ADDRESS_SELECT,
        });
        await tx.address.update({
          where: { id: nextDefault.id },
          data: { isDefault: true },
        });
        return updated;
      }
      data.isDefault = true;
    }

    return tx.address.update({
      where: { id: existing.id },
      data,
      select: ADDRESS_SELECT,
    });
  });
}

async function setDefaultAddress(userId, addressId) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.address.findFirst({ where: { id: Number(addressId), userId: Number(userId) } });
    if (!existing) throw notFound();
    await tx.address.updateMany({ where: { userId: Number(userId), isDefault: true }, data: { isDefault: false } });
    return tx.address.update({
      where: { id: existing.id },
      data: { isDefault: true },
      select: ADDRESS_SELECT,
    });
  });
}

async function deleteAddress(userId, addressId) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.address.findFirst({ where: { id: Number(addressId), userId: Number(userId) } });
    if (!existing) throw notFound();
    await tx.address.delete({ where: { id: existing.id } });

    if (existing.isDefault) {
      const next = await tx.address.findFirst({
        where: { userId: Number(userId) },
        orderBy: { createdAt: 'desc' },
      });
      if (next) await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
    return { id: existing.id };
  });
}

module.exports = { listAddresses, getAddress, createAddress, updateAddress, setDefaultAddress, deleteAddress };
