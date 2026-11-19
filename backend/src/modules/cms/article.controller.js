const service = require('./article.service');
const previewService = require('./preview.service');
const { success } = require('../../utils/success');

async function listPublic(request, reply) {
  const { page, limit, category, tag, type, search, featured } = request.query;
  return reply.send(success(await service.listPublic({
    page: Number(page || 1),
    limit: Math.min(Number(limit || 10), 50),
    category,
    tag,
    type,
    search,
    featured: featured === 'true',
  })));
}

async function getPublicBySlug(request, reply) {
  return reply.send(success(await service.getPublicBySlug(request.params.slug)));
}

async function getPublicById(request, reply) {
  return reply.send(success(await service.getPublicById(Number(request.params.id))));
}

async function listAdmin(request, reply) {
  const { page, limit, search, status, type, authorUserId } = request.query;
  const result = await service.listAdmin({
    page: Number(page || 1),
    limit: Math.min(Number(limit || 20), 100),
    search,
    status,
    type,
    authorUserId: authorUserId ? Number(authorUserId) : undefined,
  });
  return reply.send({ data: result.data, meta: result.meta });
}

async function getAdmin(request, reply) {
  return reply.send(success(await service.getAdminById(Number(request.params.id))));
}

async function create(request, reply) {
  return reply.code(201).send(success(await service.createArticle(request.body, request.user.id)));
}

async function update(request, reply) {
  return reply.send(success(await service.updateArticle(Number(request.params.id), request.body, request.user.id)));
}

async function changeStatus(request, reply) {
  return reply.send(success(await service.changeStatus(Number(request.params.id), request.body.status, request.user.id)));
}

async function deleteArticle(request, reply) {
  return reply.send(success(await service.deleteArticle(Number(request.params.id), request.user.id)));
}

async function listRevisions(request, reply) {
  return reply.send(success(await service.listRevisions(Number(request.params.id))));
}

async function getRevision(request, reply) {
  return reply.send(success(await service.getRevision(Number(request.params.id), Number(request.params.revisionNo))));
}

async function restoreRevision(request, reply) {
  return reply.send(success(await service.restoreRevision(Number(request.params.id), Number(request.params.revisionNo), request.user.id)));
}

async function generatePreviewToken(request, reply) {
  const articleId = Number(request.params.id);
  // Verify article exists and user has access
  await service.getAdminById(articleId);
  const { token, expiresAt } = await previewService.generatePreviewToken(articleId, request.user.id);
  return reply.send(success({ token, expiresAt }));
}

async function getByPreviewToken(request, reply) {
  const { token } = request.params;
  const article = await previewService.validatePreviewToken(token);
  if (!article) {
    return reply.code(404).send(success({ message: 'پیش‌نمایش نامعتبر یا منقضی شده است.' }));
  }
  // Return full article data (including draft content)
  return reply.send(success(article));
}

module.exports = {
  listPublic,
  getPublicBySlug,
  getPublicById,
  listAdmin,
  getAdmin,
  create,
  update,
  changeStatus,
  deleteArticle,
  listRevisions,
  getRevision,
  restoreRevision,
  generatePreviewToken,
  getByPreviewToken,
};