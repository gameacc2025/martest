/**
 * Settings Routes
 *
 * Route map:
 *   GET    /api/v1/settings/profile    → get user profile
 *   PATCH  /api/v1/settings/profile    → update user profile
 *   PATCH  /api/v1/settings/change-password → change password
 *   POST   /api/v1/settings/profile/avatar → upload avatar
 *   DELETE /api/v1/settings/profile/avatar → delete avatar
 */

const ctrl = require('./settings.controller');
const { updateProfileBody, changePasswordBody } = require('./settings.schemas');

async function settingsRoutes(fastify) {
  // Get user profile
  fastify.get('/profile', {
    onRequest: [fastify.authenticate],
    schema: {
      summary: 'Get current user profile',
      tags: ['Settings'],
    },
  }, ctrl.getProfile);

  // Update user profile
  fastify.patch('/profile', {
    onRequest: [fastify.authenticate],
    schema: {
      summary: 'Update current user profile',
      tags: ['Settings'],
      body: updateProfileBody,
    },
  }, ctrl.updateProfile);

  // Upload avatar
  fastify.post('/profile/avatar', {
    onRequest: [fastify.authenticate],
    schema: {
      summary: 'Upload user avatar',
      tags: ['Settings'],
      consumes: ['multipart/form-data'],
    },
  }, ctrl.uploadAvatar);

  // Delete avatar
  fastify.delete('/profile/avatar', {
    onRequest: [fastify.authenticate],
    schema: {
      summary: 'Delete user avatar',
      tags: ['Settings'],
    },
  }, ctrl.deleteAvatar);

  // Change password
  fastify.patch('/change-password', {
    onRequest: [fastify.authenticate],
    schema: {
      summary: 'Change current user password',
      tags: ['Settings'],
      body: changePasswordBody,
    },
  }, ctrl.changePassword);
}

module.exports = settingsRoutes;