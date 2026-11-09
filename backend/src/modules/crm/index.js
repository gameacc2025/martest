const service = require('./crm.service');
const { requireExactAccessType, requirePermission } = require('../../middlewares/rbac');

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

  fastify.get('/leads', { preHandler: guard(permissions.leadsRead) }, route((r) => service.listLeads(r.query)));
  fastify.post('/leads', { preHandler: guard(permissions.leadsCreate) }, route((r) => service.createLead(body(r), r.user.id)));
  fastify.get('/leads/:id', { preHandler: guard(permissions.leadsRead) }, route((r) => service.getLead(r.params.id)));
  fastify.get('/leads/:id/duplicates', { preHandler: guard(permissions.leadsRead) }, route((r) => service.duplicateCandidates(r.params.id)));
  fastify.get('/leads/:id/timeline', { preHandler: guard(permissions.leadsRead) }, route((r) => service.leadTimeline(r.params.id, r.user.id)));
  fastify.patch('/leads/:id', { preHandler: guard(permissions.leadsUpdate) }, route((r) => service.updateLead(r.params.id, body(r))));
  fastify.post('/leads/:id/assign', { preHandler: guard(permissions.leadsAssign) }, route((r) => service.assignLead(r.params.id, body(r).ownerUserId)));
  fastify.post('/leads/:id/status', { preHandler: guard(permissions.leadsUpdate) }, route((r) => service.changeLeadStatus(r.params.id, body(r).status, body(r).reason)));
  fastify.post('/leads/:id/convert', { preHandler: guard(permissions.leadsConvert) }, route((r) => service.convertLead(r.params.id, r.user.id)));

  fastify.get('/accounts', { preHandler: guard(permissions.accountsRead) }, route((r) => service.listAccounts(r.query)));
  fastify.post('/accounts', { preHandler: guard(permissions.accountsCreate) }, route((r) => service.createAccount(body(r), r.user.id)));
  fastify.get('/accounts/:id', { preHandler: guard(permissions.accountsRead) }, route((r) => service.getAccount(r.params.id)));
  fastify.patch('/accounts/:id', { preHandler: guard(permissions.accountsUpdate) }, route((r) => service.updateAccount(r.params.id, body(r))));
  fastify.get('/accounts/:id/contacts', { preHandler: guard(permissions.contactsRead) }, route((r) => service.listContacts(r.params.id)));
  fastify.post('/accounts/:id/contacts', { preHandler: guard(permissions.contactsCreate) }, route((r) => service.createContact(r.params.id, body(r))));
  fastify.patch('/contacts/:id', { preHandler: guard(permissions.contactsUpdate) }, route((r) => service.updateContact(r.params.id, body(r))));

  fastify.get('/pipelines', { preHandler: guard(permissions.pipelinesRead) }, route(() => service.listPipelines()));
  fastify.post('/pipelines', { preHandler: guard(permissions.pipelinesManage) }, route((r) => service.createPipeline(body(r))));
  fastify.post('/pipelines/:id/stages', { preHandler: guard(permissions.pipelinesManage) }, route((r) => service.createPipelineStage(r.params.id, body(r))));
  fastify.get('/opportunities', { preHandler: guard(permissions.opportunitiesRead) }, route((r) => service.listOpportunities(r.query)));
  fastify.post('/opportunities', { preHandler: guard(permissions.opportunitiesCreate) }, route((r) => service.createOpportunity(body(r), r.user.id)));
  fastify.post('/opportunities/:id/stage', { preHandler: guard(permissions.opportunitiesUpdate) }, route((r) => service.changeOpportunityStage(r.params.id, body(r), r.user.id)));

  fastify.get('/tasks', { preHandler: guard(permissions.tasksRead) }, route((r) => service.listTasks(r.query)));
  fastify.post('/tasks', { preHandler: guard(permissions.tasksCreate) }, route((r) => service.createTask(body(r), r.user.id)));
  fastify.patch('/tasks/:id', { preHandler: guard(permissions.tasksUpdate) }, route((r) => service.updateTask(r.params.id, body(r))));
  fastify.post('/tasks/:id/assign', { preHandler: guard(permissions.tasksAssign) }, route((r) => service.assignTask(r.params.id, body(r).assigneeUserId)));
  fastify.post('/tasks/:id/complete', { preHandler: guard(permissions.tasksUpdate) }, route((r) => service.completeTask(r.params.id)));

  fastify.get('/activities', { preHandler: guard(permissions.activitiesRead) }, route((r) => service.listActivities(r.query)));
  fastify.post('/activities', { preHandler: guard(permissions.activitiesCreate) }, route((r) => service.createActivity(body(r), r.user.id)));

  fastify.get('/notes', { preHandler: guard(permissions.notesRead) }, route((r) => service.listNotes(r.query, r.user.id)));
  fastify.post('/notes', { preHandler: guard(permissions.notesCreate) }, route((r) => service.createNote(body(r), r.user.id)));
}

module.exports = crmRoutes;
