/**
 * Settings Service
 *
 * Authenticated user's own settings. Avatar uploads are stored as validated
 * local files under the backend uploads directory and referenced by URL.
 */
const prisma = require('../../config/db');
const { hashPassword, verifyPassword } = require('../../utils/password');
const { AppError } = require('../../utils/error');
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { pipeline } = require('node:stream/promises');

const PROFILE_SELECT = {
  id: true,
  email: true,
  phone: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  profile: {
    select: { id: true, firstName: true, lastName: true, avatar: true, metadata: true },
  },
  accessProfile: {
    select: {
      id: true,
      type: true,
      companyId: true,
      isActive: true,
      company: { select: { id: true, name: true, type: true, status: true } },
    },
  },
  roles: { select: { role: { select: { id: true, name: true, label: true } } } },
};

const AVATAR_MAX_BYTES = 1_000_000;
const AVATAR_TYPES = Object.freeze({
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
});

function avatarDirectory() {
  return process.env.AVATAR_UPLOAD_DIR || path.join(process.cwd(), 'uploads', 'avatars');
}

function avatarDiskPath(avatarUrl) {
  if (typeof avatarUrl !== 'string' || !avatarUrl.startsWith('/uploads/avatars/')) return null;
  const filename = path.basename(avatarUrl);
  if (!filename || filename === '.' || filename === '..') return null;
  return path.join(avatarDirectory(), filename);
}

async function removeAvatarFile(avatarUrl) {
  const filePath = avatarDiskPath(avatarUrl);
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

async function getProfile(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: PROFILE_SELECT });
  if (!user) throw new AppError('User not found', 404);
  return user;
}

async function updateProfile(userId, data) {
  const profileData = {};
  if (data.firstName !== undefined) profileData.firstName = data.firstName;
  if (data.lastName !== undefined) profileData.lastName = data.lastName;
  if (data.avatar !== undefined) profileData.avatar = data.avatar;

  if (Object.keys(profileData).length > 0) {
    await prisma.profile.upsert({
      where: { userId },
      create: { userId, ...profileData },
      update: profileData,
    });
  }
  return getProfile(userId);
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user) throw new AppError('User not found', 404);

  const isValid = await verifyPassword(currentPassword, user.passwordHash);
  if (!isValid) throw new AppError('Current password is incorrect', 400);

  const hashedPassword = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash: hashedPassword } }),
    prisma.refreshToken.deleteMany({ where: { userId } }),
  ]);
}

/**
 * Persist an avatar file and only publish its URL after the DB update succeeds.
 * The browser-provided filename is never used as a filesystem path.
 */
async function uploadAvatar(userId, file) {
  const extension = AVATAR_TYPES[file?.mimetype];
  if (!extension || !file?.file || typeof file.file.pipe !== 'function') {
    throw new AppError('Only JPEG, PNG, and WebP images are allowed.', 415);
  }

  const directory = avatarDirectory();
  await fs.mkdir(directory, { recursive: true });
  const filename = `${userId}-${randomUUID()}${extension}`;
  const destination = path.join(directory, filename);
  const avatar = `/uploads/avatars/${filename}`;

  try {
    await pipeline(file.file, fs.createWriteStream(destination));
    if (file.file.truncated) {
      throw new AppError('Avatar image must be 1 MB or smaller.', 413);
    }

    const previous = await prisma.profile.findUnique({
      where: { userId },
      select: { avatar: true },
    });

    await prisma.profile.upsert({
      where: { userId },
      create: { userId, avatar },
      update: { avatar },
    });

    // Cleanup is deliberately after the new URL is committed.
    await removeAvatarFile(previous?.avatar);
    return avatar;
  } catch (error) {
    try { await fs.unlink(destination); } catch (cleanupError) {
      if (cleanupError.code !== 'ENOENT') throw cleanupError;
    }
    throw error;
  }
}

async function deleteAvatar(userId) {
  const previous = await prisma.profile.findUnique({
    where: { userId },
    select: { avatar: true },
  });
  await prisma.profile.update({
    where: { userId },
    data: { avatar: null },
  });
  await removeAvatarFile(previous?.avatar);
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
  deleteAvatar,
};
