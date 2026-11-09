const service = require('./page.service');
const { success } = require('../../utils/success');

async function listPublic(request, reply) {
  return reply.send(success(await service.listPublic()));
}

async function getPublicBySlug(request, reply) {
  return reply.send(success(await service.getPublicBySlug(request.params.slug)));
}

async function listAdmin(request, reply) {
  const { page, limit, search, isActive } = request.query;
  const result = await service.listAdmin({
    page: Number(page || 1),
    limit: Math.min(Number(limit || 50), 100),
    search,
    isActive,
  });
  return reply.send({ data: result.data, meta: result.meta });
}

async function getAdmin(request, reply) {
  return reply.send(success(await service.getAdminById(Number(request.params.id))));
}

async function getAdminBySlug(request, reply) {
  return reply.send(success(await service.getAdminBySlug(request.params.slug)));
}

async function create(request, reply) {
  return reply.code(201).send(success(await service.createPage(request.body)));
}

async function update(request, reply) {
  return reply.send(success(await service.updatePage(Number(request.params.id), request.body)));
}

async function upsert(request, reply) {
  return reply.send(success(await service.upsertPage(request.params.slug, request.body)));
}

async function deletePage(request, reply) {
  return reply.send(success(await service.deletePage(Number(request.params.id))));
}

module.exports = {
  listPublic,
  getPublicBySlug,
  listAdmin,
  getAdmin,
  getAdminBySlug,
  create,
  update,
  upsert,
  deletePage,
};