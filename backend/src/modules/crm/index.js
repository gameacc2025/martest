const service = require('./crm.service');
const { requireExactAccessType, requirePermission } = require('../../middlewares/rbac');

const idParams = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'string', pattern: '^[1-9][0-9]*$' } },
};
const leadCreateSchema = { body: { type: 'object', required: ['displayName'], additionalProperties: false, properties: {
  displayName: { type: 'string', minLength: 1, maxLength: 240 },
  companyName: { anyOf: [{ type: 'string' }, { type: 'null' }], maxLength: 240 },
  email: { anyOf: [{ type: 'string' }, { type: 'null' }], maxLength: 320 },
  phone: { anyOf: [{ type: 'string' }, { type: 'null' }], maxLength: 40 },
  sourceId: { anyOf: [{ type: 'integer' }, { type: 'string' }, { type: 'null' }] },
  score: { type: 'integer', minimum: 0, maximum: 100 },
} } };
const leadUpdateSchema = { params: idParams, body: { type: 'object', minProperties: 1, additionalProperties: false, properties: {
  displayName: { anyOf: [{ type: 'string' }, { type: 'null' }], maxLength: 240 },
  companyName: { anyOf: [{ type: 'string' }, { type: 'null' }], maxLength: 240 },
  email: { anyOf: [{ type: 'string' }, { type: 'null' }], maxLength: 320 },
  phone: { anyOf: [{ type: 'string' }, { type: 'null' }], maxLength: 40 },
  sourceId: { anyOf: [{ type: 'integer' }, { type: 'string' }, { type: 'null' }] },
  score: { type: 'integer', minimum: 0, maximum: 100 },
} } };
const leadAssignSchema = { params: idParams, body: { type: 'object', required: ['ownerUserId'], additionalProperties: false, properties: { ownerUserId: { type: 'integer', minimum: 1 } } } };
const leadStatusSchema = { params: idParams, body: { type: 'object', required: ['status'], additionalProperties: false, properties: {
  status: { type: 'string', enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'DISQUALIFIED', 'LOST'] },
  reason: { type: 'string', maxLength: 500 },
} } };
const leadMergeSchema = { params: idParams, body: { type: 'object', required: ['targetLeadId', 'reason'], additionalProperties: false, properties: {
  targetLeadId: { type: 'integer', minimum: 1 },
  reason: { type: 'string', minLength: 1, maxLength: 500 },
} } };

// CRMAccount schemas
const accountCreateSchema = { body: { type: 'object', required: ['displayName'], additionalProperties: false, properties: {
  displayName: { type: 'string', minLength: 1, maxLength: 240 },
  accountType: { type: 'string', enum: ['PROSPECT', 'CUSTOMER', 'PARTNER'] },
  ownerUserId: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
  source: { anyOf: [{ type: 'string' }, { type: 'null' }], maxLength: 100 },
  notes: { anyOf: [{ type: 'string' }, { type: 'null' }], maxLength: 2000 },
  companyId: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
  userId: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
} } };
const accountUpdateSchema = { params: idParams, body: { type: 'object', minProperties: 1, additionalProperties: false, properties: {
  displayName: { anyOf: [{ type: 'string' }, { type: 'null' }], maxLength: 240 },
  accountType: { type: 'string', enum: ['PROSPECT', 'CUSTOMER', 'PARTNER'] },
  lifecycle: { anyOf: [{ type: 'string' }, { type: 'null' }], maxLength: 40 },
  ownerUserId: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
  source: { anyOf: [{ type: 'string' }, { type: 'null' }], maxLength: 100 },
  notes: { anyOf: [{ type: 'string' }, { type: 'null' }], maxLength: 2000 },
} } };

// CRMContact schemas
const contactCreateSchema = { params: idParams, body: { type: 'object', required: ['name'], additionalProperties: false, properties: {
  name: { type: 'string', minLength: 1, maxLength: 200 },
  title: { anyOf: [{ type: 'string' }, { type: 'null' }], maxLength: 120 },
  email: { anyOf: [{ type: 'string' }, { type: 'null' }], maxLength: 320 },
  phone: { anyOf: [{ type: 'string' }, { type: 'null' }], maxLength: 40 },
  isPrimary: { type: 'boolean' },
  notes: { anyOf: [{ type: 'string' }, { type: 'null' }], maxLength: 2000 },
  userId: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
} } };
const contactUpdateSchema = { params: idParams, body: { type: 'object', minProperties: 1, additionalProperties: false, properties: {
  name: { anyOf: [{ type: 'string' }, { type: 'null' }], maxLength: 200 },
  title: { anyOf: [{ type: 'string' }, { type: 'null' }], maxLength: 120 },
  email: { anyOf: [{ type: 'string' }, { type: 'null' }], maxLength: 320 },
  phone: { anyOf: [{ type: 'string' }, { type: 'null' }], maxLength: 40 },
  isPrimary: { type: 'boolean' },
  notes: { anyOf: [{ type: 'string' }, { type: 'null' }], maxLength: 2000 },
} } };

// Pipeline schemas
const pipelineCreateSchema = { body: { type: 'object', required: ['name'], additionalProperties: false, properties: {
  name: { type: 'string', minLength: 1, maxLength: 120 },
  isDefault: { type: 'boolean' },
} } };
const pipelineUpdateSchema = { params: idParams, body: { type: 'object', minProperties: 1, additionalProperties: false, properties: {
  name: { anyOf: [{ type: 'string' }, { type: 'null' }], maxLength: 120 },
  isActive: { type: 'boolean' },
  isDefault: { type: 'boolean' },
} } };
const pipelineStageCreateSchema = { params: idParams, body: { type: 'object', required: ['code', 'label'], additionalProperties: false, properties: {
  code: { type: 'string', minLength: 1, maxLength: 60, pattern: '^[A-Z0-9_]+$' },
  label: { type: 'string', minLength: 1, maxLength: 120 },
  sortOrder: { type: 'integer', minimum: 0 },
  probability: { type: 'integer', minimum: 0, maximum: 100 },
  isWon: { type: 'boolean' },
  isLost: { type: 'boolean' },
} } };
const pipelineStageUpdateSchema = { params: { ...idParams, properties: { ...idParams.properties, stageId: { type: 'string', pattern: '^[1-9][0-9]*$' } } }, body: { type: 'object', minProperties: 1, additionalProperties: false, properties: {
  code: { anyOf: [{ type: 'string' }, { type: 'null' }], maxLength: 60, pattern: '^[A-Z0-9_]+$' },
  label: { anyOf: [{ type: 'string' }, { type: 'null' }], maxLength: 120 },
  sortOrder: { type: 'integer', minimum: 0 },
  probability: { type: 'integer', minimum: 0, maximum: 100 },
  isWon: { type: 'boolean' },
  isLost: { type: 'boolean' },
} } };

// Opportunity schemas
const opportunityCreateSchema = { body: { type: 'object', required: ['title', 'accountId', 'pipelineId', 'stageId'], additionalProperties: false, properties: {
  title: { type: 'string', minLength: 1, maxLength: 240 },
  accountId: { type: 'integer', minimum: 1 },
  pipelineId: { type: 'integer', minimum: 1 },
  stageId: { type: 'integer', minimum: 1 },
  ownerUserId: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
  amount: { type: 'number', minimum: 0 },
  currency: { type: 'string', pattern: '^[A-Z]{3}$' },
  expectedCloseAt: { anyOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }] },
} } };
const opportunityUpdateSchema = { params: idParams, body: { type: 'object', minProperties: 1, additionalProperties: false, properties: {
  title: { anyOf: [{ type: 'string' }, { type: 'null' }], maxLength: 240 },
  amount: { type: 'number', minimum: 0 },
  currency: { type: 'string', pattern: '^[A-Z]{3}$' },
  expectedCloseAt: { anyOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }] },
  ownerUserId: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
} } };
const opportunityStageSchema = { params: idParams, body: { type: 'object', required: ['stageId'], additionalProperties: false, properties: {
  stageId: { type: 'integer', minimum: 1 },
  reason: { anyOf: [{ type: 'string' }, { type: 'null' }], maxLength: 500 },
} } };

// Task schemas
const taskCreateSchema = { body: { type: 'object', required: ['title'], additionalProperties: false, properties: {
  title: { type: 'string', minLength: 1, maxLength: 240 },
  description: { anyOf: [{ type: 'string' }, { type: 'null' }], maxLength: 5000 },
  priority: { type: 'string', enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'] },
  dueAt: { anyOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }] },
  assigneeUserId: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
  leadId: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
  accountId: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
  opportunityId: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
} } };
const taskUpdateSchema = { params: idParams, body: { type: 'object', minProperties: 1, additionalProperties: false, properties: {
  title: { anyOf: [{ type: 'string' }, { type: 'null' }], maxLength: 240 },
  description: { anyOf: [{ type: 'string' }, { type: 'null' }], maxLength: 5000 },
  priority: { type: 'string', enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'] },
  status: { type: 'string', enum: ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] },
  dueAt: { anyOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }] },
  assigneeUserId: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
  leadId: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
  accountId: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
  opportunityId: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
} } };
const taskAssignSchema = { params: idParams, body: { type: 'object', required: ['assigneeUserId'], additionalProperties: false, properties: { assigneeUserId: { type: 'integer', minimum: 1 } } } };

// Activity schemas
const activityCreateSchema = { body: { type: 'object', required: ['subject', 'type'], additionalProperties: false, properties: {
  type: { type: 'string', enum: ['CALL', 'EMAIL', 'MEETING', 'NOTE', 'OTHER'] },
  subject: { type: 'string', minLength: 1, maxLength: 240 },
  body: { anyOf: [{ type: 'string' }, { type: 'null' }], maxLength: 5000 },
  occurredAt: { anyOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }] },
  durationMinutes: { type: 'integer', minimum: 1 },
  outcome: { anyOf: [{ type: 'string' }, { type: 'null' }], maxLength: 500 },
  leadId: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
  accountId: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
  opportunityId: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
} } };

// Note schemas
const noteCreateSchema = { body: { type: 'object', required: ['body'], additionalProperties: false, properties: {
  body: { type: 'string', minLength: 1, maxLength: 5000 },
  visibility: { type: 'string', enum: ['TEAM', 'PRIVATE'] },
  leadId: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
  accountId: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
  opportunityId: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
} } };

const permissions = {
  dashboard: 'crm.dashboard.read',
  leadsRead: 'crm.leads.read', leadsCreate: 'crm.leads.create', leadsUpdate: 'crm.leads.update',
  leadsAssign: 'crm.leads.assign', leadsConvert: 'crm.leads.convert',
  sourcesRead: 'crm.sources.read', sourcesManage: 'crm.sources.manage',
  accountsRead: 'crm.accounts.read', accountsCreate: 'crm.accounts.create', accountsUpdate: 'crm.accounts.update',
  contactsRead: 'crm.contacts.read', contactsCreate: 'crm.contacts.create', contactsUpdate: 'crm.contacts.update',
  tasksRead: 'crm.tasks.read', tasksCreate: 'crm.tasks.create', tasksUpdate: 'crm.tasks.update', tasksAssign: 'crm.tasks.assign',
  activitiesRead: 'crm.activities.read', activitiesCreate: 'crm.activities.create',
  notesRead: 'crm.notes.read', notesCreate: 'crm.notes.create',
  pipelinesRead: 'crm.pipelines.read', pipelinesManage: 'crm.pipelines.manage',
  opportunitiesRead: 'crm.opportunities.read', opportunitiesCreate: 'crm.opportunities.create', opportunitiesUpdate: 'crm.opportunities.update',
};
const ok = (data, meta) => meta ? ({ success: true, data, meta }) : ({ success: true, data });
const route = (handler) => async (request, reply) => {
  const result = await handler(request);
  return reply.send(ok(result && result.data !== undefined && result.meta ? result.data : result,
    result && result.data !== undefined && result.meta ? result.meta : undefined));
};
const body = (request) => request.body || {};

async function crmRoutes(fastify) {
  fastify.addHook('onRequest', fastify.authenticate);
  const guard = (permission) => [requireExactAccessType('STAFF'), requirePermission(permission)];

  fastify.get('/dashboard', { preHandler: guard(permissions.dashboard) }, route(() => service.dashboard()));

  fastify.get('/lead-sources', { preHandler: guard(permissions.sourcesRead) }, route(() => service.listSources()));
  fastify.post('/lead-sources', { preHandler: guard(permissions.sourcesManage) }, route((r) => service.manageSource(body(r))));
  fastify.patch('/lead-sources/:id', { preHandler: guard(permissions.sourcesManage) }, route((r) => service.manageSource(body(r), r.params.id)));

  fastify.get('/leads/export', { preHandler: guard('crm.leads.export') }, async (request, reply) => {
    const rows = await service.exportLeads(request.query || {});
    const headers = ['leadNumber', 'displayName', 'companyName', 'email', 'phone', 'status', 'score', 'createdAt'];
    const cell = (value) => {
      if (value === null || value === undefined) return '';
      let text = String(value);
      if (/^\s*[=+\-@]/.test(text)) text = "'" + text;
      return '"' + text.replace(/"/g, '""') + '"';
    };
    const csv = [headers.join(','), ...rows.map((row) => headers.map((key) => cell(row[key])).join(','))].join('\r\n');
    return reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', 'attachment; filename="crm-leads.csv"')
      .send('\uFEFF' + csv);
  });
  fastify.get('/leads', { preHandler: guard(permissions.leadsRead) }, route((r) => service.listLeads(r.query)));
  fastify.post('/leads', { schema: leadCreateSchema, preHandler: guard(permissions.leadsCreate) }, route((r) => service.createLead(body(r), r.user.id)));
  fastify.get('/leads/:id', { preHandler: guard(permissions.leadsRead) }, route((r) => service.getLead(r.params.id)));
  fastify.get('/leads/:id/duplicates', { preHandler: guard(permissions.leadsRead) }, route((r) => service.duplicateCandidates(r.params.id)));
  fastify.post('/leads/:id/merge', { schema: leadMergeSchema, preHandler: guard('crm.leads.merge') }, route((r) => service.mergeLeads(r.params.id, body(r).targetLeadId, body(r).reason, r.user.id)));
  fastify.get('/leads/:id/timeline', { preHandler: guard(permissions.leadsRead) }, route((r) => service.leadTimeline(r.params.id, r.user.id)));
  fastify.patch('/leads/:id', { schema: leadUpdateSchema, preHandler: guard(permissions.leadsUpdate) }, route((r) => service.updateLead(r.params.id, body(r), r.user.id)));
  fastify.post('/leads/:id/assign', { schema: leadAssignSchema, preHandler: guard(permissions.leadsAssign) }, route((r) => service.assignLead(r.params.id, body(r).ownerUserId, r.user.id)));
  fastify.post('/leads/:id/status', { schema: leadStatusSchema, preHandler: guard(permissions.leadsUpdate) }, route((r) => service.changeLeadStatus(r.params.id, body(r).status, body(r).reason, r.user.id)));
  fastify.post('/leads/:id/convert', { preHandler: guard(permissions.leadsConvert) }, route((r) => service.convertLead(r.params.id, r.user.id)));

  fastify.get('/accounts', { preHandler: guard(permissions.accountsRead) }, route((r) => service.listAccounts(r.query)));
  fastify.post('/accounts', { schema: accountCreateSchema, preHandler: guard(permissions.accountsCreate) }, route((r) => service.createAccount(body(r), r.user.id)));
  fastify.get('/accounts/:id', { preHandler: guard(permissions.accountsRead) }, route((r) => service.getAccount(r.params.id)));
  fastify.patch('/accounts/:id', { schema: accountUpdateSchema, preHandler: guard(permissions.accountsUpdate) }, route((r) => service.updateAccount(r.params.id, body(r))));
  fastify.get('/accounts/:id/contacts', { preHandler: guard(permissions.contactsRead) }, route((r) => service.listContacts(r.params.id)));
  fastify.post('/accounts/:id/contacts', { schema: contactCreateSchema, preHandler: guard(permissions.contactsCreate) }, route((r) => service.createContact(r.params.id, body(r))));
  fastify.patch('/contacts/:id', { schema: contactUpdateSchema, preHandler: guard(permissions.contactsUpdate) }, route((r) => service.updateContact(r.params.id, body(r))));

  fastify.get('/pipelines', { preHandler: guard(permissions.pipelinesRead) }, route(() => service.listPipelines()));
  fastify.post('/pipelines', { schema: pipelineCreateSchema, preHandler: guard(permissions.pipelinesManage) }, route((r) => service.createPipeline(body(r))));
  fastify.patch('/pipelines/:id', { schema: pipelineUpdateSchema, preHandler: guard(permissions.pipelinesManage) }, route((r) => service.updatePipeline(r.params.id, body(r))));
  fastify.post('/pipelines/:id/stages', { schema: pipelineStageCreateSchema, preHandler: guard(permissions.pipelinesManage) }, route((r) => service.createPipelineStage(r.params.id, body(r))));
  fastify.patch('/pipelines/:id/stages/:stageId', { schema: pipelineStageUpdateSchema, preHandler: guard(permissions.pipelinesManage) }, route((r) => service.updatePipelineStage(r.params.id, r.params.stageId, body(r))));
  fastify.get('/opportunities', { preHandler: guard(permissions.opportunitiesRead) }, route((r) => service.listOpportunities(r.query)));
  fastify.get('/opportunities/:id', { preHandler: guard(permissions.opportunitiesRead) }, route((r) => service.getOpportunity(r.params.id)));
  fastify.patch('/opportunities/:id', { schema: opportunityUpdateSchema, preHandler: guard(permissions.opportunitiesUpdate) }, route((r) => service.updateOpportunity(r.params.id, body(r))));
  fastify.post('/opportunities', { schema: opportunityCreateSchema, preHandler: guard(permissions.opportunitiesCreate) }, route((r) => service.createOpportunity(body(r), r.user.id)));
  fastify.post('/opportunities/:id/stage', { schema: opportunityStageSchema, preHandler: guard(permissions.opportunitiesUpdate) }, route((r) => service.changeOpportunityStage(r.params.id, body(r), r.user.id)));

  fastify.get('/tasks', { preHandler: guard(permissions.tasksRead) }, route((r) => service.listTasks(r.query)));
  fastify.post('/tasks', { schema: taskCreateSchema, preHandler: guard(permissions.tasksCreate) }, route((r) => service.createTask(body(r), r.user.id)));
  fastify.patch('/tasks/:id', { schema: taskUpdateSchema, preHandler: guard(permissions.tasksUpdate) }, route((r) => service.updateTask(r.params.id, body(r))));
  fastify.post('/tasks/:id/assign', { schema: taskAssignSchema, preHandler: guard(permissions.tasksAssign) }, route((r) => service.assignTask(r.params.id, body(r).assigneeUserId)));
  fastify.post('/tasks/:id/complete', { preHandler: guard(permissions.tasksUpdate) }, route((r) => service.completeTask(r.params.id)));

  fastify.get('/activities', { preHandler: guard(permissions.activitiesRead) }, route((r) => service.listActivities(r.query)));
  fastify.post('/activities', { schema: activityCreateSchema, preHandler: guard(permissions.activitiesCreate) }, route((r) => service.createActivity(body(r), r.user.id)));

  fastify.get('/notes', { preHandler: guard(permissions.notesRead) }, route((r) => service.listNotes(r.query, r.user.id)));
  fastify.post('/notes', { schema: noteCreateSchema, preHandler: guard(permissions.notesCreate) }, route((r) => service.createNote(body(r), r.user.id)));
}

module.exports = crmRoutes;
