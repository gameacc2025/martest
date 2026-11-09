const service = require('./category.service');
const { success } = require('../../utils/success');

async function listPublic(request, reply) {
  return reply.send(success(await service.listPublic({ activeOnly: true })));
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

async function create(request, reply) {
  return reply.code(201).send(success(await service.createCategory(request.body)));
}

async function update(request, reply) {
  return reply.send(success(await service.updateCategory(Number(request.params.id), request.body)));
}

async function deleteCategory(request, reply) {
  return reply.send(success(await service.deleteCategory(Number(request.params.id))));
}

module.exports = {
  listPublic,
  listAdmin,
  getAdmin,
  create,
  update,
  deleteCategory,
};