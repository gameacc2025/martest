const orderService = require('./retail-order.service');
const { getPaginationParams, buildPaginatedResponse } = require('../../utils/pagination');
const { success } = require('../../utils/success');

async function placeOrder(request, reply) {
  const order = await orderService.placeOrder(
    request.user.id,
    request.body,
    request.headers['idempotency-key']
  );
  return reply.code(201).send(success(order));
}

async function listOrders(request, reply) {
  const { page, limit, skip, take } = getPaginationParams(request.query);
  const orders = await orderService.listCustomerOrders(request.user.id, { skip, take });
  const total = await orderService.countCustomerOrders(request.user.id);
  return reply.send(buildPaginatedResponse(orders, total, page, limit));
}

async function getOrder(request, reply) {
  const order = await orderService.getCustomerOrder(request.user.id, request.params.id);
  return reply.send(success(order));
}

module.exports = { placeOrder, listOrders, getOrder };
