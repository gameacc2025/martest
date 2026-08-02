// =============================================================
// User Schemas — JSON Schema validation for user CRUD
//
// Domain model:
//   - User          → email, phone, status (auth identity)
//   - Profile         → firstName, lastName, avatar (personal info)
//   - AccessProfile → type (STAFF|COMPANY|CUSTOMER), companyId, isActive
//
// Application selection depends ONLY on accessProfile.type. Roles never
// select the application; they only control in-app permissions.
// =============================================================

const createUserBody = {
  type: 'object',
  required: ['email', 'password', 'firstName', 'lastName'],
  additionalProperties: false,
  properties: {
    // Auth identity
    email:       { type: 'string', format: 'email', maxLength: 255 },
    phone:       { type: ['string', 'null'], maxLength: 32 },
    password:    { type: 'string', minLength: 6, maxLength: 128 },
    // Personal info (Profile)
    firstName:   { type: 'string', minLength: 1, maxLength: 50 },
    lastName:    { type: 'string', minLength: 1, maxLength: 50 },
    // Access context (AccessProfile)
    type:        { type: 'string', enum: ['STAFF', 'COMPANY', 'CUSTOMER'] },
    companyId:   { type: 'integer', minimum: 1 },
    status:      { type: 'string', enum: ['PENDING', 'ACTIVE', 'REJECTED'] },
    isActive:    { type: 'boolean', description: 'Deprecated: use status instead' },
    // Roles (permissions only — do NOT decide application)
    roleIds:     { type: 'array', items: { type: 'integer' } },
  },
};

const updateUserBody = {
  type: 'object',
  additionalProperties: false,
  properties: {
    // Auth identity
    email:       { type: 'string', format: 'email', maxLength: 255 },
    phone:       { type: ['string', 'null'], maxLength: 32 },
    status:      { type: 'string', enum: ['PENDING', 'ACTIVE', 'REJECTED'] },
    isActive:    { type: 'boolean', description: 'Deprecated: use status instead' },
    // Personal info (Profile)
    firstName:   { type: ['string', 'null'], maxLength: 50 },
    lastName:    { type: ['string', 'null'], maxLength: 50 },
    avatar:      { type: ['string', 'null'], maxLength: 512 },
    // Access context (AccessProfile) — SUPER_ADMIN only for type/companyId
    type:        { type: 'string', enum: ['STAFF', 'COMPANY', 'CUSTOMER'] },
    companyId:   { type: ['integer', 'null'], minimum: 1 },
    isAccessActive: { type: 'boolean', description: 'Toggle AccessProfile.isActive (panel access)' },
  },
};

const setAccessBody = {
  type: 'object',
  properties: {
    roleId:        { type: ['integer', 'null'], minimum: 1, description: 'User role (single role only)' },
    permissionIds: { type: 'array', description: 'Replace direct user permissions (full replace, not merge)' },
  },
};

const setAccessActiveBody = {
  type: 'object',
  required: ['isActive'],
  additionalProperties: false,
  properties: {
    isActive: { type: 'boolean', description: 'Enable/disable AccessProfile panel access' },
  },
};

const moveCompanyBody = {
  type: 'object',
  required: ['companyId'],
  additionalProperties: false,
  properties: {
    companyId: { type: 'integer', minimum: 1 },
  },
};

module.exports = { createUserBody, updateUserBody, setAccessBody, setAccessActiveBody, moveCompanyBody };
