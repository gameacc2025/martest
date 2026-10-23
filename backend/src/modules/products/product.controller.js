const svc = require('./product.service');
const { getPaginationParams, buildPaginatedResponse } = require('../../utils/pagination');
const { success } = require('../../utils/success');

async function list(request, reply) {
  const { page, limit, skip, take } = getPaginationParams(request.query);
  const { search, companyId, categoryId, status } = request.query;
  const { items, total } = await svc.listProducts({ skip, take, filters: { search, companyId, categoryId, status }, caller: request.user, publicOnly: true });
  return reply.send(buildPaginatedResponse(items, total, page, limit));
}

async function myProducts(request, reply) {
  const { page, limit, skip, take } = getPaginationParams(request.query);
  const { search, status } = request.query;
  // SUPER_ADMIN sees products from ALL companies. Only scope by companyId
  // for regular company users — injecting the JWT companyId for admin would
  // incorrectly restrict results to the admin's assigned company.
  const isAdmin = request.user.roles?.includes('SUPER_ADMIN') || request.user.permissions?.includes('*');
  const companyId = isAdmin ? undefined : request.user.companyId;
  const { items, total } = await svc.listProducts({ skip, take, filters: { search, companyId, status }, caller: request.user });
  return reply.send(buildPaginatedResponse(items, total, page, limit));
}

async function getHistory(request, reply) {
  const history = await svc.getProductHistory(request.params.id);
  return reply.send(success(history));
}

async function getActivity(request, reply) {
  const activity = await svc.getProductActivityLog(request.params.id);
  return reply.send(success(activity));
}

async function getOne(request, reply) {
  const product = await svc.getProductById(request.params.id, request.user);
  if (!product) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'محصول یافت نشد' } });
  return reply.send(success(product));
}

async function create(request, reply) {
  const product = await svc.createProduct(request.body, request.user);
  return reply.code(201).send(success(product));
}

async function update(request, reply) {
  const product = await svc.updateProduct(request.params.id, request.body, request.user);
  return reply.send(success(product));
}

async function remove(request, reply) {
  await svc.deleteProduct(request.params.id, request.user);
  return reply.code(204).send();
}

async function upsertPrice(request, reply) {
  const price = await svc.upsertPrice(request.params.id, request.body, request.user);
  return reply.send(success(price));
}

async function addPriceTier(request, reply) {
  const price = await svc.addPriceTier(request.params.id, request.body, request.user);
  return reply.code(201).send(success(price));
}

async function updatePriceTier(request, reply) {
  const price = await svc.updatePriceTier(request.params.id, request.params.tierId, request.body, request.user);
  return reply.send(success(price));
}

async function deletePriceTier(request, reply) {
  await svc.deletePriceTier(request.params.id, request.params.tierId, request.user);
  return reply.code(204).send();
}

async function uploadImage(request, reply) {
  const file = await request.file({ limits: { fileSize: svc.MAX_IMAGE_BYTES } });
  const image = await svc.uploadImage(request.params.id, file, request.user);
  return reply.code(201).send(success(image));
}

async function deleteImage(request, reply) {
  await svc.deleteImage(request.params.id, request.params.imageId, request.user);
  return reply.code(204).send();
}

async function setPrimaryImage(request, reply) {
  const image = await svc.setPrimaryImage(request.params.id, request.params.imageId, request.user);
  return reply.send(success(image));
}

async function sortImages(request, reply) {
  const images = await svc.sortImages(request.params.id, request.body.images, request.user);
  return reply.send(success(images));
}

async function uploadDocument(request, reply) {
  const file = await request.file({ limits: { fileSize: svc.MAX_DOCUMENT_BYTES } });
  const document = await svc.uploadDocument(request.params.id, file, request.user);
  return reply.code(201).send(success(document));
}

async function deleteDocument(request, reply) {
  await svc.deleteDocument(request.params.id, request.params.documentId, request.user);
  return reply.code(204).send();
}

async function submitReview(request, reply) {
  const product = await svc.changeProductStatus(request.params.id, 'submitReview', request.user, request.body?.comment);
  return reply.send(success(product));
}

async function approve(request, reply) {
  const product = await svc.changeProductStatus(request.params.id, 'approve', request.user, request.body?.comment);
  return reply.send(success(product));
}

async function reject(request, reply) {
  const product = await svc.changeProductStatus(request.params.id, 'reject', request.user, request.body?.comment);
  return reply.send(success(product));
}

async function publish(request, reply) {
  const product = await svc.changeProductStatus(request.params.id, 'publish', request.user, request.body?.comment);
  return reply.send(success(product));
}

async function hide(request, reply) {
  const product = await svc.changeProductStatus(request.params.id, 'hide', request.user, request.body?.comment);
  return reply.send(success(product));
}

async function archive(request, reply) {
  const product = await svc.changeProductStatus(request.params.id, 'archive', request.user, request.body?.comment);
  return reply.send(success(product));
}

async function restoreDraft(request, reply) {
  const product = await svc.changeProductStatus(request.params.id, 'restoreDraft', request.user, request.body?.comment);
  return reply.send(success(product));
}

module.exports = {
  list,
  myProducts,
  getHistory,
  getActivity,
  getOne,
  create,
  update,
  remove,
  upsertPrice,
  addPriceTier,
  updatePriceTier,
  deletePriceTier,
  uploadImage,
  deleteImage,
  setPrimaryImage,
  sortImages,
  uploadDocument,
  deleteDocument,
  submitReview,
  approve,
  reject,
  publish,
  hide,
  archive,
  restoreDraft,
};
