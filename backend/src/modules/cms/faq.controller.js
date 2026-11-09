const service = require('./faq.service');
const { success } = require('../../utils/success');

async function listPublic(request, reply) {
  const { category } = request.query;
  return reply.send(success(await service.listPublic({ category })));
}

async function listCategories(request, reply) {
  return reply.send(success(await service.listCategories()));
}

async function listAdmin(request, reply) {
  const { page, limit, search, category, isActive } = request.query;
  const result = await service.listAdmin({
    page: Number(page || 1),
    limit: Math.min(Number(limit || 50), 100),
    search,
    category,
    isActive,
  });
  return reply.send({ data: result.data, meta: result.meta });
}

async function getAdmin(request, reply) {
  return reply.send(success(await service.getAdminById(Number(request.params.id))));
}

async function create(request, reply) {
  return reply.code(201).send(success(await service.createFaq(request.body)));
}

async function update(request, reply) {
  return reply.send(success(await service.updateFaq(Number(request.params.id), request.body)));
}

async function deleteFaq(request, reply) {
  return reply.send(success(await service.deleteFaq(Number(request.params.id))));
}

module.exports = {
  listPublic,
  listCategories,
  listAdmin,
  getAdmin,
  create,
  update,
  deleteFaq,
};