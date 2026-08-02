/**
 * Settings Service
 *
 * Business logic for the authenticated user's own settings.
 *
 * Domain model (post-refactor):
 *   - User            → auth identity (email, phone, status, passwordHash)
 *   - Profile         → personal info (firstName, lastName, avatar, metadata)
 *   - AccessProfile   → authorization context (type, companyId, isActive)
 *
 * Profile reads/writes here operate on Profile, NOT on User.
 */

const prisma = require('../../config/db');
const { hashPassword, verifyPassword } = require('../../utils/password');
const { AppError } = require('../../utils/error');

// User identity + related profile/access selection returned to the client.
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
  roles: {
    select: {
      role: { select: { id: true, name: true, label: true } },
    },
  },
};

/**
 * Get the current user's profile (identity + personal info + access context).
 * @param {number} userId - User ID
 * @returns {Promise<Object>} User profile
 */
async function getProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: PROFILE_SELECT,
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
}

/**
 * Update the current user's personal info (Profile).
 * Only firstName / lastName / avatar are updatable here. Email, password,
 * roles, and access context are managed through dedicated flows.
 * @param {number} userId - User ID
 * @param {Object} data - Profile data
 * @returns {Promise<Object>} Updated profile
 */
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

/**
 * Change user password
 * @param {number} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<void>}
 */
async function changePassword(userId, currentPassword, newPassword) {
  // Get current user with password hash
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Verify current password
  const isValid = await verifyPassword(currentPassword, user.passwordHash);
  if (!isValid) {
    throw new AppError('Current password is incorrect', 400);
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update password and revoke all existing refresh tokens so previously
  // issued sessions can no longer be refreshed (defense-in-depth after a
  // credential change). The current session's access token stays valid until
  // it expires, at which point the refresh will fail and force a re-login.
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    }),
    prisma.refreshToken.deleteMany({ where: { userId } }),
  ]);
}

/**
 * Upload user avatar (stored on the Profile).
 * @param {number} userId - User ID
 * @param {Object} file - Uploaded file
 * @returns {Promise<string>} Avatar URL
 */
async function uploadAvatar(userId, file) {
  // In a real implementation, you would:
  // 1. Validate the file (type, size, etc.)
  // 2. Upload to cloud storage or save locally
  // 3. Generate a URL
  // 4. Delete old avatar if it exists
  // 5. Update the profile record with new avatar URL

  // For now, we'll simulate this with a placeholder URL
  const avatar = `/uploads/avatars/${userId}-${Date.now()}.jpg`;

  await prisma.profile.upsert({
    where: { userId },
    create: { userId, avatar },
    update: { avatar },
  });

  return avatar;
}

/**
 * Delete user avatar (from the Profile).
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
async function deleteAvatar(userId) {
  await prisma.profile.update({
    where: { userId },
    data: { avatar: null },
  });
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
  deleteAvatar,
};
