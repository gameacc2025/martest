// CMS Sitemap Controller
const sitemapService = require('./sitemap.service');

async function getSitemap(request, reply) {
  const xml = await sitemapService.generateSitemap();
  reply.header('Content-Type', 'application/xml; charset=utf-8');
  reply.header('Cache-Control', 'public, max-age=3600');
  return reply.send(xml);
}

module.exports = { getSitemap };