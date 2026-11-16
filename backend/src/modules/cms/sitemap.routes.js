// CMS Sitemap Routes
const ctrl = require('./sitemap.controller');

async function sitemapRoutes(fastify) {
  // Public sitemap.xml
  fastify.get('/sitemap.xml', {
    schema: {
      tags: ['CMS - Sitemap'],
      summary: 'Get dynamic sitemap.xml for CMS content',
    },
  }, ctrl.getSitemap);

  // Also support /sitemap without .xml extension
  fastify.get('/', {
    schema: {
      tags: ['CMS - Sitemap'],
      summary: 'Get dynamic sitemap.xml for CMS content (root)',
    },
  }, ctrl.getSitemap);
}

module.exports = sitemapRoutes;