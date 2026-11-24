const sellerOrderService = require('./retail-seller-order.service');
const { getPaginationParams, buildPaginatedResponse } = require('../../utils/pagination');
const { success } = require('../../utils/success');

async function listOrders(request, reply) {
  const { page, limit, skip, take } = getPaginationParams(request.query);
  const result = await sellerOrderService.listCompanySellerOrders(request.user.companyId, {
    skip,
    take,
    status: request.query.status,
  });
  return reply.send(buildPaginatedResponse(result.items, result.total, page, limit));
}

async function getOrder(request, reply) {
  const order = await sellerOrderService.getCompanySellerOrder(request.user.companyId, request.params.id);
  return reply.send(success(order));
}

async function transitionOrder(request, reply) {
  const order = await sellerOrderService.transitionCompanySellerOrder(
    request.user.companyId,
    request.user.id,
    request.params.id,
    request.body
  );
  return reply.send(success(order));
}

module.exports = { listOrders, getOrder, transitionOrder };
