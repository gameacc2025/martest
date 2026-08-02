const svc = require('./specification-library.service');

async function search(request, reply) {
  const { q, limit } = request.query;
  const fields = await svc.searchFields(q, { limit });
  return reply.send({ data: fields });
}

async function listAll(request, reply) {
  const fields = await svc.listFields();
  return reply.send({ data: fields });
}

module.exports = {
  search,
  listAll,
};
