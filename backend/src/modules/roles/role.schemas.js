// =============================================================
// Role Schemas — JSON Schema validation
// (Permission schemas moved to modules/permissions/permission.schemas.js)
// =============================================================

const createRoleBody = {
  type: 'object',
  required: ['name', 'label', 'scope'],
  additionalProperties: false,
  properties: {
    name:          { type: 'string', minLength: 2, maxLength: 50 },
    label:         { type: 'string', minLength: 2, maxLength: 100 },
    description:   { type: 'string', maxLength: 500 },
    // Which domain this role belongs to. This is the single source of
    // truth for GET /roles/assignable and for the role-scope check in
    // user.service.js createUser() — NOT the role's name.
    scope:         { type: 'string', enum: ['STAFF', 'COMPANY', 'CUSTOMER'] },
    permissionIds: { type: 'array', items: { type: 'integer' } },
  },
};

const updateRoleBody = {
  type: 'object',
  additionalProperties: false,
  properties: {
    label:          { type: 'string', minLength: 2, maxLength: 100 },
    description:    { type: 'string', maxLength: 500 },
    scope:          { type: 'string', enum: ['STAFF', 'COMPANY', 'CUSTOMER'] },
    permissionIds:  { type: 'array', items: { type: 'integer' }, description: 'Full replace of role permissions' },
  },
};

module.exports = { createRoleBody, updateRoleBody };