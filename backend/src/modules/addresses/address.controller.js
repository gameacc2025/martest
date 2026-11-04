const addressService = require('./address.service');
const { success } = require('../../utils/success');

async function list(request, reply) {
  return reply.send(success(await addressService.listAddresses(request.user.id)));
}
async function getOne(request, reply) {
  return reply.send(success(await addressService.getAddress(request.user.id, request.params.id)));
}
async function create(request, reply) {
  return reply.code(201).send(success(await addressService.createAddress(request.user.id, request.body)));
}
async function update(request, reply) {
  return reply.send(success(await addressService.updateAddress(request.user.id, request.params.id, request.body)));
}
async function setDefault(request, reply) {
  return reply.send(success(await addressService.setDefaultAddress(request.user.id, request.params.id)));
}
async function remove(request, reply) {
  await addressService.deleteAddress(request.user.id, request.params.id);
  return reply.code(204).send();
}

module.exports = { list, getOne, create, update, setDefault, remove };
