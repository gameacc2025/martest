const service = require('./banner.service');
const { success } = require('../../utils/success');

async function listPublic(request, reply) {
  return reply.send(success(await service.listPublic(request.query.placement || 'HOME_HERO')));
}
async function listAdmin(request, reply) {
  const result = await service.listAdmin({
    page: Number(request.query.page || 1), limit: Number(request.query.limit || 20),
    search: request.query.search || '', status: request.query.status || undefined,
  });
  return reply.send({ data: result.data, meta: result.meta });
}
async function getAdmin(request, reply) {
  return reply.send(success(await service.getById(Number(request.params.id))));
}
async function create(request, reply) {
  return reply.code(201).send(success(await service.create(request.body)));
}
async function update(request, reply) {
  return reply.send(success(await service.update(Number(request.params.id), request.body)));
}
async function archive(request, reply) {
  return reply.send(success(await service.archive(Number(request.params.id))));
}
async function upload(request, reply) {
  const file = await request.file();
  return reply.code(201).send(success(await service.uploadImage(file)));
}
module.exports = { listPublic, listAdmin, getAdmin, create, update, archive, upload };
