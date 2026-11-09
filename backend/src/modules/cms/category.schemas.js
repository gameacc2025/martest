const categoryProperties = {
  name: { type: 'string', minLength: 1, maxLength: 120 },
  slug: { type: 'string', minLength: 1, maxLength: 120 },
  sortOrder: { type: 'integer', minimum: 0, maximum: 100000, default: 0 },
  isActive: { type: 'boolean', default: true },
};

module.exports = { categoryProperties };