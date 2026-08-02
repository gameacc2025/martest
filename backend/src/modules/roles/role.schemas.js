// =============================================================
// Role Schemas — JSON Schema validation
// (Permission schemas moved to modules/permissions/permission.schemas.js)
// =============================================================

const createRoleBody = {
  type: 'object',
  required: ['name', 'label'],
  additionalProperties: false,
  properties: {
    name:          { type: 'string', minLength: 2, maxLength: 50 },
    label:         { type: 'string', minLength: 2, maxLength: 100 },
    description:   { type: 'string', maxLength: 500 },
    permissionIds: { type: 'array', items: { type: 'integer' } },
  },
};

const updateRoleBody = {
  type: 'object',
  additionalProperties: false,
  properties: {
    label:          { type: 'string', minLength: 2, maxLength: 100 },
    description:    { type: 'string', maxLength: 500 },
    permissionIds:  { type: 'array', items: { type: 'integer' }, description: 'Full replace of role permissions' },
  },
};

module.exports = { createRoleBody, updateRoleBody };