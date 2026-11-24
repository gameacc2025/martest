const retailAdminService = require('./retail-admin.service');
const { getPaginationParams, buildPaginatedResponse } = require('../../utils/pagination');
const { success } = require('../../utils/success');

async function listOrders(request, reply) {
  const { page, limit, skip, take } = getPaginationParams(request.query);
  const result = await retailAdminService.listAdminRetailOrders({
    skip,
    take,
    status: request.query.status,
    paymentStatus: request.query.paymentStatus,
    search: request.query.search,
    exceptionOnly: request.query.exceptionOnly === true,
  });
  return reply.send(buildPaginatedResponse(result.items, result.total, page, limit));
}

async function getOrder(request, reply) {
  const order = await retailAdminService.getAdminRetailOrder(request.params.id);
  return reply.send(success(order));
}

module.exports = { listOrders, getOrder };
