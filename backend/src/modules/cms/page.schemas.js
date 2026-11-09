const pageProperties = {
  slug: { type: 'string', minLength: 1, maxLength: 100 },
  title: { type: 'string', minLength: 1, maxLength: 240 },
  content: { type: 'string', minLength: 1 },
  contentFormat: { type: 'string', enum: ['HTML', 'MARKDOWN', 'PLAIN'], default: 'HTML' },
  metaTitle: { type: 'string', maxLength: 240 },
  metaDescription: { type: 'string', maxLength: 500 },
  canonicalUrl: { type: 'string', maxLength: 500 },
  isIndexable: { type: 'boolean', default: true },
  isActive: { type: 'boolean', default: true },
};

module.exports = { pageProperties };