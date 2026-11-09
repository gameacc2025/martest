const faqProperties = {
  question: { type: 'string', minLength: 1, maxLength: 500 },
  answer: { type: 'string', minLength: 1 },
  category: { type: 'string', maxLength: 100, default: 'عمومی' },
  sortOrder: { type: 'integer', minimum: 0, maximum: 100000, default: 0 },
  isActive: { type: 'boolean', default: true },
};

module.exports = { faqProperties };