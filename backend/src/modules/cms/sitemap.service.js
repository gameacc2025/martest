// CMS Sitemap Service
//
// Generates dynamic sitemap.xml for CMS content (articles, categories, tags, pages).
// Caches the result for a configurable TTL.

const prisma = require('../../config/db');

const SITEMAP_TTL_MS = 60 * 60 * 1000; // 1 hour
let sitemapCache = { xml: null, expiresAt: 0 };

function getBaseUrl() {
  return process.env.FRONTEND_URL || 'http://localhost:3001';
}

function formatDate(date) {
  if (!date) return new Date().toISOString().split('T')[0];
  return new Date(date).toISOString().split('T')[0];
}

async function generateSitemap() {
  const now = Date.now();
  if (sitemapCache.xml && sitemapCache.expiresAt > now) {
    return sitemapCache.xml;
  }

  const baseUrl = getBaseUrl();
  const urls = [];

  // Static pages
  urls.push({ loc: `${baseUrl}/`, changefreq: 'daily', priority: '1.0' });
  urls.push({ loc: `${baseUrl}/magazine`, changefreq: 'daily', priority: '0.9' });
  urls.push({ loc: `${baseUrl}/faq`, changefreq: 'weekly', priority: '0.7' });
  urls.push({ loc: `${baseUrl}/about`, changefreq: 'monthly', priority: '0.6' });
  urls.push({ loc: `${baseUrl}/terms`, changefreq: 'monthly', priority: '0.5' });
  urls.push({ loc: `${baseUrl}/contact`, changefreq: 'monthly', priority: '0.5' });
  urls.push({ loc: `${baseUrl}/products`, changefreq: 'daily', priority: '0.8' });
  urls.push({ loc: `${baseUrl}/categories`, changefreq: 'daily', priority: '0.7' });

  // Articles
  const articles = await prisma.article.findMany({
    where: {
      status: 'PUBLISHED',
      isActive: true,
      OR: [
        { publishedAt: { lte: new Date() } },
        { publishedAt: null },
      ],
    },
    select: { slug: true, updatedAt: true, publishedAt: true },
    orderBy: { updatedAt: 'desc' },
  });

  for (const article of articles) {
    urls.push({
      loc: `${baseUrl}/magazine/${article.slug}`,
      lastmod: formatDate(article.updatedAt),
      changefreq: 'weekly',
      priority: '0.8',
    });
  }

  // Categories
  const categories = await prisma.articleCategory.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true },
  });

  for (const category of categories) {
    urls.push({
      loc: `${baseUrl}/magazine/category/${category.slug}`,
      lastmod: formatDate(category.updatedAt),
      changefreq: 'weekly',
      priority: '0.7',
    });
  }

  // Tags
  const tags = await prisma.articleTag.findMany({
    select: { slug: true, updatedAt: true },
  });

  for (const tag of tags) {
    urls.push({
      loc: `${baseUrl}/magazine/tag/${tag.slug}`,
      lastmod: formatDate(tag.updatedAt),
      changefreq: 'weekly',
      priority: '0.6',
    });
  }

  // Pages
  const pages = await prisma.page.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true },
  });

  for (const page of pages) {
    urls.push({
      loc: `${baseUrl}/${page.slug}`,
      lastmod: formatDate(page.updatedAt),
      changefreq: 'monthly',
      priority: '0.5',
    });
  }

  // Generate XML
  const urlElements = urls.map(url => {
    let xml = `  <url>\n    <loc>${url.loc}</loc>`;
    if (url.lastmod) xml += `\n    <lastmod>${url.lastmod}</lastmod>`;
    if (url.changefreq) xml += `\n    <changefreq>${url.changefreq}</changefreq>`;
    if (url.priority) xml += `\n    <priority>${url.priority}</priority>`;
    xml += '\n  </url>';
    return xml;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlElements}\n</urlset>`;

  sitemapCache = { xml, expiresAt: now + SITEMAP_TTL_MS };
  return xml;
}

function clearCache() {
  sitemapCache = { xml: null, expiresAt: 0 };
}

module.exports = {
  generateSitemap,
  clearCache,
};