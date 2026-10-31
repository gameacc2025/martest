const svc = require('./category.service');
const { getPaginationParams, buildPaginatedResponse } = require('../../utils/pagination');
const { success } = require('../../utils/success');

// These handlers are mounted on PUBLIC (unauthenticated) routes only, so
// request.user is never populated here — always restrict to active/published.
// NOTE: this previously tried to detect staff via `roles.includes('BUYER')`,
// but 'BUYER' is not a role in the current system (see
// backend/prisma/seed.js → ROLES) — a leftover from before the
// CUSTOMER_USER/COMPANY_MANAGER refactor — so the filter never applied to
// anyone and inactive categories leaked to the public catalog. Staff needing
// to see inactive categories now use the authenticated GET /manage route
// (listForManagement below), the same split used by products
// (public GET / vs authenticated GET /my-products).

async function list(request, reply) {
  const items = await svc.listCategories({ activeOnly: true });
  return reply.send(success(items));
}

/**
 * GET /api/v1/categories/manage (authenticated, STAFF-only)
 * Full category list including inactive ones, for the admin panel.
 */
async function listForManagement(request, reply) {
  const items = await svc.listCategories({ activeOnly: false });
  return reply.send(success(items));
}

async function getOne(request, reply) {
  const item = await svc.getCategoryById(request.params.id, { activeOnly: true });
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
  const items = await svc.listSubcategoriesByCategory(request.params.id, { activeOnly: true });
  return reply.send(success(items));
}

async function getSubcategory(request, reply) {
  const item = await svc.getSubcategoryById(request.params.subId, { activeOnly: true });
  if (!item) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'زیردسته یافت نشد' } });
  return reply.send(success(item));
}

/**
 * GET /api/v1/categories/:id/products
 * List products for a specific category with pagination.
 */
async function getProducts(request, reply) {
  const { page, limit, skip, take } = getPaginationParams(request.query);
  const { items, total } = await svc.getCategoryProducts(request.params.id, { skip, take, publishedOnly: true });
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
  listForManagement,
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