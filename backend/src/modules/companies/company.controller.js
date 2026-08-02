// =============================================================
// Company Controller — HTTP layer for company routes
//
// Routes:
//   GET    /api/v1/companies                 → list (search, filter, sort, paginate)
//   GET    /api/v1/companies/:id             → get single company
//   POST   /api/v1/companies                 → create
//   PATCH  /api/v1/companies/:id             → update
//   DELETE /api/v1/companies/:id             → soft-delete
//   PATCH  /api/v1/companies/:id/restore     → restore deleted
//   PATCH  /api/v1/companies/:id/status      → change status
//   PATCH  /api/v1/companies/:id/verify      → toggle verification
//   PATCH  /api/v1/companies/:id/logo        → update logo
//   GET    /api/v1/companies/:id/settings    → get settings
//   PATCH  /api/v1/companies/:id/settings    → update settings
//   GET    /api/v1/companies/:id/statistics  → get statistics
//   GET    /api/v1/companies/:id/products    → list company products
// =============================================================

const companyService = require('./company.service');
const { getPaginationParams, buildPaginatedResponse } = require('../../utils/pagination');
const { success } = require('../../utils/success');

/**
 * GET /api/v1/companies
 */
async function list(request, reply) {
  const { page, limit, skip, take } = getPaginationParams(request.query);
  const { search, type, status, isVerified, sort, includeDeleted } = request.query;

  const { items, total } = await companyService.listCompanies({
    skip, take, search, type, status, isVerified, sort, includeDeleted,
  });
  return reply.send(buildPaginatedResponse(items, total, page, limit));
}

/**
 * GET /api/v1/companies/:id
 */
async function getOne(request, reply) {
  const includeDeleted = request.query.includeDeleted === 'true';
  const company = await companyService.getCompanyById(request.params.id, includeDeleted);
  if (!company) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'شرکت یافت نشد' } });
  return reply.send(success(company));
}

/**
 * POST /api/v1/companies
 */
async function create(request, reply) {
  const company = await companyService.createCompany(request.body);
  return reply.code(201).send(success(company));
}

/**
 * PATCH /api/v1/companies/:id
 */
async function update(request, reply) {
  const company = await companyService.updateCompany(request.params.id, request.body, request.user);
  return reply.send(success(company));
}

/**
 * DELETE /api/v1/companies/:id
 */
async function remove(request, reply) {
  await companyService.deleteCompany(request.params.id);
  return reply.code(204).send();
}

/**
 * PATCH /api/v1/companies/:id/restore
 */
async function restore(request, reply) {
  const company = await companyService.restoreCompany(request.params.id);
  return reply.send(success(company));
}

/**
 * PATCH /api/v1/companies/:id/status
 */
async function changeStatus(request, reply) {
  const { status } = request.body;
  const company = await companyService.changeStatus(request.params.id, status);
  return reply.send(success(company));
}

/**
 * PATCH /api/v1/companies/:id/verify
 */
async function toggleVerify(request, reply) {
  const { isVerified } = request.body;
  const company = await companyService.setVerification(request.params.id, isVerified);
  return reply.send(success(company));
}

/**
 * PATCH /api/v1/companies/:id/logo
 */
async function updateLogo(request, reply) {
  const { logo } = request.body;
  const company = await companyService.updateLogo(request.params.id, logo);
  return reply.send(success(company));
}

/**
 * GET /api/v1/companies/:id/settings
 */
async function getSettings(request, reply) {
  const settings = await companyService.getSettings(request.params.id);
  return reply.send(success(settings));
}

/**
 * PATCH /api/v1/companies/:id/settings
 */
async function updateSettings(request, reply) {
  const settings = await companyService.updateSettings(request.params.id, request.body);
  return reply.send(success(settings));
}

/**
 * GET /api/v1/companies/:id/statistics
 */
async function getStatistics(request, reply) {
  const stats = await companyService.getStatistics(request.params.id);
  return reply.send(success(stats));
}

/**
 * GET /api/v1/companies/:id/products
 */
async function getProducts(request, reply) {
  const { page, limit, skip, take } = getPaginationParams(request.query);
  const { status, search } = request.query;
  const { items, total } = await companyService.getCompanyProducts(request.params.id, { skip, take, status, search });
  return reply.send(buildPaginatedResponse(items, total, page, limit));
}

module.exports = {
  list, getOne, create, update, remove, restore,
  changeStatus, toggleVerify, updateLogo,
  getSettings, updateSettings, getStatistics, getProducts,
};
