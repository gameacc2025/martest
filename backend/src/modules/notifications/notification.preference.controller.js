/**
 * Notification Preference Controller
 * Handles user-facing notification preference endpoints
 */

const { getPreferences, updatePreferences } = require('./notification.preference.service');
const { AppError } = require('../../utils/error');

/**
 * GET /api/v1/notifications/preferences
 * Get the authenticated user's effective notification preferences
 * (stored overrides merged with event defaults)
 */
async function getPreferencesCtrl(request, reply) {
  const userId = request.user.id;
  const result = await getPreferences(userId);
  return reply.send(result);
}

/**
 * PATCH /api/v1/notifications/preferences
 * Update the authenticated user's notification preferences
 * Body: Array of { eventType, channel, enabled }
 */
async function updatePreferencesCtrl(request, reply) {
  const userId = request.user.id;
  const updates = request.body;

  try {
    const result = await updatePreferences(userId, updates);
    return reply.send(result);
  } catch (err) {
    // Re-throw AppError with statusCode if it's already one
    if (err?.statusCode) {
      throw err;
    }
    // Otherwise wrap as 400
    throw new AppError(err?.message || 'Failed to update preferences', 400, true, err?.code || 'PREFERENCE_UPDATE_FAILED');
  }
}

module.exports = {
  getPreferencesCtrl,
  updatePreferencesCtrl,
};