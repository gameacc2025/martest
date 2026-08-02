/**
 * Settings Controller
 *
 * Responsibilities:
 *   - Handle profile management
 *   - Handle password changes
 *   - Handle user preferences
 */

const settingsService = require('./settings.service');
const { success } = require('../../utils/success');

/**
 * GET /api/v1/settings/profile
 * Get current user profile
 */
async function getProfile(request, reply) {
  const user = await settingsService.getProfile(request.user.id);
  return reply.send(success(user));
}

/**
 * PUT /api/v1/settings/profile
 * Update current user profile
 */
async function updateProfile(request, reply) {
  const { id } = request.user;
  const data = request.body;

  const updatedUser = await settingsService.updateProfile(id, data);
  return reply.send(success(updatedUser));
}

/**
 * PATCH /api/v1/settings/change-password
 * Change current user password
 */
async function changePassword(request, reply) {
  const { id } = request.user;
  const { currentPassword, newPassword } = request.body;

  await settingsService.changePassword(id, currentPassword, newPassword);
  return reply.send(success({ message: 'Password changed successfully' }));
}

/**
 * POST /api/v1/settings/profile/avatar
 * Upload user avatar
 */
async function uploadAvatar(request, reply) {
  const { id } = request.user;
  const file = await request.file();

  if (!file) {
    throw new Error('No file uploaded');
  }

  const avatarUrl = await settingsService.uploadAvatar(id, file);
  return reply.send(success({ avatarUrl }));
}

/**
 * DELETE /api/v1/settings/profile/avatar
 * Delete user avatar
 */
async function deleteAvatar(request, reply) {
  const { id } = request.user;

  await settingsService.deleteAvatar(id);
  return reply.send(success({ message: 'Avatar deleted successfully' }));
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatar,
  deleteAvatar,
};
