const inquiryService = require('./inquiry.service');
const { getQuotaSummary, listActivePlans, getMySubscriptions } = require('./inquiry-subscription.service');
const { startSubscriptionPayment, handleSubscriptionPaymentCallback, retryPendingSubscriptionVerification } = require('./inquiry-payment.service');
const { success } = require('../../utils/success');
const { SUPER_ADMIN_ROLE } = require('../../utils/rbac');

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



function isCustomerContext(caller) {
  if (!caller) return false;
  if (caller.accessType === 'CUSTOMER') return true;
  const roles = Array.isArray(caller.roles) ? caller.roles : [];
  return caller.accessType == null
    && roles.includes('CUSTOMER_USER')
    && !roles.includes(SUPER_ADMIN_ROLE);
}

async function quota(request, reply) {
  const caller = request.user || {};
  const ownerType = isCustomerContext(caller)
    ? 'user'
    : caller.accessType === 'COMPANY'
      ? 'company'
      : null;
  if (!ownerType) {
    throw { statusCode: 403, code: 'SUBSCRIPTION_NOT_AVAILABLE_FOR_ROLE', message: 'سهمیه استعلام برای این نوع حساب فعال نیست.' };
  }
  const ownerId = ownerType === 'user' ? caller.id : caller.companyId;
  if (!ownerId || !Number.isInteger(Number(ownerId)) || Number(ownerId) < 1) {
    throw { statusCode: 403, code: ownerType === 'user' ? 'USER_CONTEXT_REQUIRED' : 'COMPANY_CONTEXT_REQUIRED', message: 'زمینه مالک اشتراک معتبر نیست.' };
  }
  const data = await getQuotaSummary(ownerType, Number(ownerId));
  return reply.send(success(data));
}

function subscriptionOwner(caller) {
  if (caller?.accessType === 'COMPANY') {
    const companyId = Number(caller.companyId);
    if (!Number.isInteger(companyId) || companyId < 1) throw { statusCode: 403, code: 'COMPANY_CONTEXT_REQUIRED', message: 'حساب شرکت معتبر نیست.' };
    return { ownerType: 'company', ownerId: companyId };
  }
  if (isCustomerContext(caller)) {
    const userId = Number(caller.id);
    if (!Number.isInteger(userId) || userId < 1) throw { statusCode: 403, code: 'USER_CONTEXT_REQUIRED', message: 'حساب کاربری معتبر نیست.' };
    return { ownerType: 'user', ownerId: userId };
  }
  throw { statusCode: 403, code: 'SUBSCRIPTION_NOT_AVAILABLE_FOR_ROLE', message: 'خرید اشتراک برای این نوع حساب فعال نیست.' };
}

async function listPlans(request, reply) {
  return reply.send(success(await listActivePlans()));
}

async function mySubscriptions(request, reply) {
  const owner = subscriptionOwner(request.user);
  const [subscriptions, quota] = await Promise.all([
    getMySubscriptions(owner.ownerType, owner.ownerId),
    getQuotaSummary(owner.ownerType, owner.ownerId),
  ]);
  return reply.send(success({ subscriptions, quota }));
}

async function requestSubscription(request, reply) {
  const owner = subscriptionOwner(request.user);
  const result = await startSubscriptionPayment({ ...owner, planId: request.body.planId, paymentReference: request.body.paymentReference });
  return reply.code(201).send(success({ ...result.subscription, paymentMode: result.paymentMode, paymentUrl: result.paymentUrl }));
}

async function retrySubscriptionPayment(request, reply) {
  const owner = subscriptionOwner(request.user);
  const result = await retryPendingSubscriptionVerification({ ...owner, subscriptionId: request.params.id });
  return reply.send(success(result));
}

async function subscriptionPaymentCallback(request, reply) {
  const result = await handleSubscriptionPaymentCallback(request.query);
  return reply.redirect(result.redirectUrl);
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

async function listMessages(request, reply) {
  const messages = await inquiryService.listInquiryMessages(request.params.id, request.user);
  return reply.send(success(messages));
}

async function sendMessage(request, reply) {
  const message = await inquiryService.sendInquiryMessage(request.params.id, request.body, request.user);
  return reply.code(201).send(success(message));
}

async function listResponses(request, reply) {
  const responses = await inquiryService.listResponses(request.params.id, request.user);
  return reply.send(success(responses));
}

async function updateResponse(request, reply) {
  const response = await inquiryService.updateResponse(request.params.id, request.params.responseId, request.body, request.user);
  return reply.send(success(response));
}

async function decideResponse(request, reply) {
  const response = await inquiryService.decideResponse(
    request.params.id,
    request.params.responseId,
    request.body.decision,
    request.user,
    request.body.comment,
  );
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
  quota,
  listPlans,
  mySubscriptions,
  requestSubscription,
  subscriptionPaymentCallback,
  retrySubscriptionPayment,


  listItems,

  addItem,
  updateItem,
  deleteItem,
  submitResponse,
  listResponses,
  listMessages,
  sendMessage,
  updateResponse,
  decideResponse,
  withdrawResponse,
  uploadResponseAttachment,
  deleteResponseAttachment,
};

