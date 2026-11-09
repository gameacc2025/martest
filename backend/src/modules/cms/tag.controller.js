const service = require('./tag.service');
const { success } = require('../../utils/success');

async function listPublic(request, reply) {
  return reply.send(success(await service.listPublic()));
}

async function listAdmin(request, reply) {
  const { page, limit, search } = request.query;
  const result = await service.listAdmin({
    page: Number(page || 1),
    limit: Math.min(Number(limit || 50), 100),
    search,
  });
  return reply.send({ data: result.data, meta: result.meta });
}

async function getAdmin(request, reply) {
  return reply.send(success(await service.getAdminById(Number(request.params.id))));
}

async function create(request, reply) {
  return reply.code(201).send(success(await service.createTag(request.body)));
}

async function update(request, reply) {
  return reply.send(success(await service.updateTag(Number(request.params.id), request.body)));
}

async function deleteTag(request, reply) {
  return reply.send(success(await service.deleteTag(Number(request.params.id))));
}

module.exports = {
  listPublic,
  listAdmin,
  getAdmin,
  create,
  update,
  deleteTag,
};