const articleRoutes = require('./article.routes');
const categoryRoutes = require('./category.routes');
const tagRoutes = require('./tag.routes');
const faqRoutes = require('./faq.routes');
const pageRoutes = require('./page.routes');
const sitemapRoutes = require('./sitemap.routes');

async function cmsRoutes(fastify) {
  fastify.register(articleRoutes, { prefix: '/cms/articles' });
  fastify.register(categoryRoutes, { prefix: '/cms/categories' });
  fastify.register(tagRoutes, { prefix: '/cms/tags' });
  fastify.register(faqRoutes, { prefix: '/cms/faqs' });
  fastify.register(pageRoutes, { prefix: '/cms/pages' });
  fastify.register(sitemapRoutes, { prefix: '/cms/sitemap' });
}

module.exports = cmsRoutes;