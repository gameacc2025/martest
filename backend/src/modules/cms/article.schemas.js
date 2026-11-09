const articleProperties = {
  title: { type: 'string', minLength: 1, maxLength: 240 },
  slug: { type: 'string', minLength: 1, maxLength: 220 },
  excerpt: { type: 'string', maxLength: 600 },
  content: { type: 'string', minLength: 1 },
  contentFormat: { type: 'string', enum: ['HTML', 'MARKDOWN', 'PLAIN'], default: 'HTML' },
  type: { type: 'string', enum: ['NEWS', 'ARTICLE', 'GUIDE'], default: 'ARTICLE' },
  status: { type: 'string', enum: ['DRAFT', 'IN_REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'], default: 'DRAFT' },
  coverImageKey: { type: 'string', maxLength: 500 },
  metaTitle: { type: 'string', maxLength: 240 },
  metaDescription: { type: 'string', maxLength: 500 },
  canonicalUrl: { type: 'string', maxLength: 500 },
  isIndexable: { type: 'boolean', default: true },
  scheduledAt: { type: 'string', format: 'date-time' },
  categories: { type: 'array', items: { type: 'object', properties: { categoryId: { type: 'integer' }, sortOrder: { type: 'integer' } }, required: ['categoryId'] } },
  tags: { type: 'array', items: { type: 'integer' } },
  changeNote: { type: 'string', maxLength: 500 },
};

module.exports = { articleProperties };