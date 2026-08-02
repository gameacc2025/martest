// =============================================================
// Permission Controller — HTTP layer for permission management
// =============================================================

const permissionService = require('./permission.service');
const { success } = require('../../utils/success');

/**
 * GET /api/v1/permissions
 * List permissions (with optional pagination, search, grouping)
 */
async function list(request, reply) {
  const result = await permissionService.listPermissions(request.query);
  // When page/limit provided: returns { data, meta } from buildPaginatedResponse
  // When grouped: returns { all, grouped } — wrap with success()
  // When no pagination: returns plain array — wrap with success()
  if (result && typeof result === 'object' && 'data' in result && 'meta' in result) {
    return reply.send(result); // already { data, meta }
  }
  return reply.send(success(result));
}

/**
 * GET /api/v1/permissions/:id
 * Get a single permission by ID
 */
async function getById(request, reply) {
  return reply.send(success(await permissionService.getPermission(request.params.id)));
}

/**
 * POST /api/v1/permissions
 * Create a new permission
 */
async function create(request, reply) {
  return reply.code(201).send(success(await permissionService.createPermission(request.body)));
}

/**
 * PATCH /api/v1/permissions/:id
 * Update a permission (partial update)
 */
async function update(request, reply) {
  return reply.send(success(await permissionService.updatePermission(request.params.id, request.body)));
}

/**
 * DELETE /api/v1/permissions/:id
 * Delete a permission
 */
async function remove(request, reply) {
  return reply.send(success(await permissionService.deletePermission(request.params.id)));
}

module.exports = { list, getById, create, update, remove };
