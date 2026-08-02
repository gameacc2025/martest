const svc = require('./category.service');
const { getPaginationParams, buildPaginatedResponse } = require('../../utils/pagination');
const { success } = require('../../utils/success');

function isPublicCatalogUser(request) {
  const roles = request.user?.roles || [];
  return roles.includes('BUYER') && !roles.includes('SUPER_ADMIN') && !roles.includes('ADMIN');
}

async function list(request, reply) {
  const items = await svc.listCategories({ activeOnly: isPublicCatalogUser(request) });
  return reply.send(success(items));
}

async function getOne(request, reply) {
  const item = await svc.getCategoryById(request.params.id);
  if (!item) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'دسته‌بندی یافت نشد' } });
  return reply.send(success(item));
}

/**
 * GET /api/v1/categories/:id/subcategories
 * List subcategories for a given category (used to populate the product form).
 */
async function listSubcategories(request, reply) {
  const category = await svc.getCategoryById(request.params.id);
  if (!category) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'دسته‌بندی یافت نشد' } });
  const items = await svc.listSubcategoriesByCategory(request.params.id, { activeOnly: isPublicCatalogUser(request) });
  return reply.send(success(items));
}

async function getSubcategory(request, reply) {
  const item = await svc.getSubcategoryById(request.params.subId);
  if (!item) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'زیردسته یافت نشد' } });
  return reply.send(success(item));
}

/**
 * GET /api/v1/categories/:id/products
 * List products for a specific category with pagination.
 */
async function getProducts(request, reply) {
  const { page, limit, skip, take } = getPaginationParams(request.query);
  const publishedOnly = isPublicCatalogUser(request);
  const { items, total } = await svc.getCategoryProducts(request.params.id, { skip, take, publishedOnly });
  return reply.send(buildPaginatedResponse(items, total, page, limit));
}

async function create(request, reply) {
  const item = await svc.createCategory(request.body);
  return reply.code(201).send(success(item));
}

async function update(request, reply) {
  const item = await svc.updateCategory(request.params.id, request.body);
  return reply.send(success(item));
}

async function remove(request, reply) {
  await svc.deleteCategory(request.params.id);
  return reply.code(204).send();
}

async function createSubcategory(request, reply) {
  const item = await svc.createSubcategory(request.body);
  return reply.code(201).send(success(item));
}

async function updateSubcategory(request, reply) {
  const item = await svc.updateSubcategory(request.params.subId, request.body);
  return reply.send(success(item));
}

async function removeSubcategory(request, reply) {
  await svc.deleteSubcategory(request.params.subId);
  return reply.code(204).send();
}

module.exports = {
  list,
  getOne,
  listSubcategories,
  getSubcategory,
  getProducts,
  create,
  update,
  remove,
  createSubcategory,
  updateSubcategory,
  removeSubcategory,
};
