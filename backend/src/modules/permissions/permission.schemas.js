// =============================================================
// Permission Schemas — JSON Schema for request validation
// =============================================================

const idParam = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'integer', minimum: 1 } },
};

const createPermissionBody = {
  type: 'object',
  required: ['name', 'label'],
  properties: {
    name: { type: 'string', minLength: 2, maxLength: 100 },
    label: { type: 'string', minLength: 2, maxLength: 100 },
    description: { type: 'string', maxLength: 255 },
    group: { type: 'string', maxLength: 50 },
  },
};

const updatePermissionBody = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 2, maxLength: 100 },
    label: { type: 'string', minLength: 2, maxLength: 100 },
    description: { type: 'string', maxLength: 255 },
    group: { type: 'string', maxLength: 50 },
  },
};

module.exports = { idParam, createPermissionBody, updatePermissionBody };