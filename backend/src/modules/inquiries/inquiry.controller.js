const inquiryService = require('./inquiry.service');
const { success } = require('../../utils/success');

async function list(request, reply) {
  // listInquiries returns { data, meta } from buildPaginatedResponse — already correct
  const result = await inquiryService.listInquiries(request.query, request.user);
  return reply.send(result);
}

async function getById(request, reply) {
  const inquiry = await inquiryService.getInquiry(request.params.id, request.user);
  return reply.send(success(inquiry));
}

async function create(request, reply) {
  const inquiry = await inquiryService.createInquiry(request.body, request.user);
  return reply.code(201).send(success(inquiry));
}

async function update(request, reply) {
  const inquiry = await inquiryService.updateInquiry(request.params.id, request.body, request.user);
  return reply.send(success(inquiry));
}



async function stats(request, reply) {
  const data = await inquiryService.getInquiryStats(request.user);
  return reply.send(success(data));
}

async function listItems(request, reply) {

  const items = await inquiryService.listInquiryItems(request.params.id, request.user);
  return reply.send(success(items));
}

async function changeStatus(request, reply) {
  const inquiry = await inquiryService.changeInquiryStatus(
    request.params.id,
    request.body.status,
    request.user,
    request.body.comment,
  );
  return reply.send(success(inquiry));
}

async function revealResponses(request, reply) {
  const inquiry = await inquiryService.revealInquiryResponses(request.params.id, request.user);
  return reply.send(success(inquiry));
}

async function addItem(request, reply) {
  const item = await inquiryService.addInquiryItem(request.params.id, request.body, request.user);
  return reply.code(201).send(success(item));
}

async function updateItem(request, reply) {
  const item = await inquiryService.updateInquiryItem(request.params.id, request.params.itemId, request.body, request.user);
  return reply.send(success(item));
}

async function deleteItem(request, reply) {
  await inquiryService.deleteInquiryItem(request.params.id, request.params.itemId, request.user);
  return reply.code(204).send();
}

async function submitResponse(request, reply) {
  const response = await inquiryService.submitResponse(request.params.id, request.body, request.user);
  return reply.code(201).send(success(response));
}

async function listResponses(request, reply) {
  const responses = await inquiryService.listResponses(request.params.id, request.user);
  return reply.send(success(responses));
}

async function updateResponse(request, reply) {
  const response = await inquiryService.updateResponse(request.params.id, request.params.responseId, request.body, request.user);
  return reply.send(success(response));
}

async function withdrawResponse(request, reply) {
  const response = await inquiryService.withdrawResponse(request.params.id, request.params.responseId, request.user, request.body || {});
  return reply.send(success(response));
}

async function uploadResponseAttachment(request, reply) {
  const file = await request.file();
  const attachment = await inquiryService.uploadResponseAttachment(request.params.id, request.params.responseId, file, request.user);
  return reply.code(201).send(success(attachment));
}

async function deleteResponseAttachment(request, reply) {
  await inquiryService.deleteResponseAttachment(
    request.params.id,
    request.params.responseId,
    request.params.attachmentId,
    request.user,
  );
  return reply.code(204).send();
}


module.exports = {
  list,
  getById,
  create,
  update,
  changeStatus,
  revealResponses,
  stats,


  listItems,

  addItem,
  updateItem,
  deleteItem,
  submitResponse,
  listResponses,
  updateResponse,
  withdrawResponse,
  uploadResponseAttachment,
  deleteResponseAttachment,
};

