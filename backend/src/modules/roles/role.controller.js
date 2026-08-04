// =============================================================
// Role Controller — HTTP layer for role management
// =============================================================

const roleService = require('./role.service');
const { success } = require('../../utils/success');

async function listRoles(request, reply) {
  const result = await roleService.listRoles(request.query);
  // When page/limit provided: returns { data, meta } from buildPaginatedResponse
  // When no pagination: returns plain array — wrap with success()
  if (Array.isArray(result)) {
    return reply.send(success(result));
  }
  return reply.send(result);
}

async function listAssignableRoles(request, reply) {
  return reply.send(success(await roleService.listAssignableRoles(request.user)));
}

async function getRole(request, reply) {
  return reply.send(success(await roleService.getRole(parseInt(request.params.id, 10))));
}

async function createRole(request, reply) {
  return reply.code(201).send(success(await roleService.createRole(request.body)));
}

async function updateRole(request, reply) {
  return reply.send(success(await roleService.updateRole(parseInt(request.params.id, 10), request.body)));
}

async function deleteRole(request, reply) {
  return reply.send(success(await roleService.deleteRole(parseInt(request.params.id, 10))));
}

module.exports = { listRoles, listAssignableRoles, getRole, createRole, updateRole, deleteRole };