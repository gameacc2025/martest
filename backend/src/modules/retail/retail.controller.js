const retailService = require('./retail.service');
const { getPaginationParams, buildPaginatedResponse } = require('../../utils/pagination');
const { success } = require('../../utils/success');

async function listCatalog(request, reply) {
  const { page, limit, skip, take } = getPaginationParams(request.query);
  const { search, categoryId, minPrice, maxPrice, sortBy, sortOrder } = request.query;
  const { items, total } = await retailService.listCatalog({
    skip,
    take,
    filters: { search, categoryId, minPrice, maxPrice, sortBy, sortOrder },
  });
  return reply.send(buildPaginatedResponse(items, total, page, limit));
}

async function getCatalogProduct(request, reply) {
  const product = await retailService.getCatalogProduct(request.params.id);
  if (!product) {
    return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'محصول قابل خرید یافت نشد' } });
  }
  return reply.send(success(product));
}

async function previewCheckout(request, reply) {
  const preview = await retailService.previewCheckout(request.user.id, request.body.items);
  return reply.send(success(preview));
}

module.exports = {
  listCatalog,
  getCatalogProduct,
  previewCheckout,
};
