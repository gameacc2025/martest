/**
 * Settings Schemas
 *
 * JSON schemas for request validation.
 *
 * Personal info lives on Profile (firstName, lastName, avatar).
 * The removed User fields (displayName, phoneNumber, bio) are no longer
 * accepted here.
 */

// Update profile schema (Profile personal info)
const updateProfileBody = {
  type: 'object',
  required: [],
  properties: {
    firstName: { type: 'string', minLength: 1, maxLength: 50 },
    lastName: { type: 'string', minLength: 1, maxLength: 50 },
    avatar: { type: ['string', 'null'], maxLength: 512 },
  },
  additionalProperties: false,
};

// Change password schema
const changePasswordBody = {
  type: 'object',
  required: ['currentPassword', 'newPassword'],
  properties: {
    currentPassword: { type: 'string', minLength: 6, maxLength: 100 },
    newPassword: { type: 'string', minLength: 8, maxLength: 100 },

  },
  additionalProperties: false,
};

module.exports = {
  updateProfileBody,
  changePasswordBody,
};
