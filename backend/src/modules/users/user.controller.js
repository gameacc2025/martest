// =============================================================
// User Controller — HTTP layer for user management routes
// =============================================================

const userService = require('./user.service');
const { success } = require('../../utils/success');

async function list(request, reply) {
  // listUsers returns { data, meta } from buildPaginatedResponse — already correct
  const result = await userService.listUsers(request.query, request.user);
  return reply.send(result);
}

async function getById(request, reply) {
  const userId = parseInt(request.params.id, 10);
  const result = await userService.getUser(userId, request.user);
  return reply.send(success(result));
}

async function create(request, reply) {
  const result = await userService.createUser(request.body, request.user);
  return reply.code(201).send(success(result));
}

async function update(request, reply) {
  const userId = parseInt(request.params.id, 10);
  const result = await userService.updateUser(userId, request.body, request.user);
  return reply.send(success(result));
}

async function setAccess(request, reply) {
  const userId = parseInt(request.params.id, 10);
  const { roleId, permissionIds } = request.body;
  const result = await userService.setUserAccess(userId, roleId, permissionIds, request.user);
  return reply.send(success(result));
}

async function remove(request, reply) {
  const userId = parseInt(request.params.id, 10);
  const result = await userService.deleteUser(userId, request.user);
  return reply.send(success(result));
}

async function setAccessActive(request, reply) {
  const userId = parseInt(request.params.id, 10);
  const result = await userService.setAccessActive(userId, request.body.isActive, request.user);
  return reply.send(success(result));
}

async function moveCompany(request, reply) {
  const userId = parseInt(request.params.id, 10);
  const result = await userService.moveUserToCompany(userId, request.body.companyId, request.user);
  return reply.send(success(result));
}

module.exports = { list, getById, create, update, setAccess, remove, setAccessActive, moveCompany };
