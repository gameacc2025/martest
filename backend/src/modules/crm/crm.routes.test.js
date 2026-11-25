const test = require('node:test');
const assert = require('node:assert/strict');
const Fastify = require('fastify');
const crmRoutes = require('./index');
const crmService = require('./crm.service');

async function buildTestApp() {
  const app = Fastify();
  app.decorate('authenticate', async (request) => {
    const accessType = request.headers['x-test-access'];
    if (!accessType) return;
    request.user = {
      id: 1,
      accessType,
      permissions: String(request.headers['x-test-permissions'] || '').split(',').filter(Boolean),
    };
  });
  await app.register(crmRoutes, { prefix: '/crm' });
  await app.ready();
  return app;
}

test('CRM routes reject unauthenticated requests', async () => {
  const app = await buildTestApp();
  try {
    const response = await app.inject({ method: 'GET', url: '/crm/dashboard' });
    assert.equal(response.statusCode, 401);
  } finally {
    await app.close();
  }
});

test('CRM routes reject COMPANY even with wildcard permissions', async () => {
  const app = await buildTestApp();
  try {
    const response = await app.inject({
      method: 'GET',
      url: '/crm/dashboard',
      headers: { 'x-test-access': 'COMPANY', 'x-test-permissions': '*' },
    });
    assert.equal(response.statusCode, 403);
  } finally {
    await app.close();
  }
});

test('CRM routes reject CUSTOMER even with legacy RFQ lead permissions', async () => {
  const app = await buildTestApp();
  try {
    const response = await app.inject({
      method: 'GET',
      url: '/crm/dashboard',
      headers: { 'x-test-access': 'CUSTOMER', 'x-test-permissions': 'leads.read,leads.create' },
    });
    assert.equal(response.statusCode, 403);
  } finally {
    await app.close();
  }
});

test('STAFF without the exact CRM permission is rejected', async () => {
  const app = await buildTestApp();
  try {
    const response = await app.inject({
      method: 'GET',
      url: '/crm/dashboard',
      headers: { 'x-test-access': 'STAFF', 'x-test-permissions': 'leads.read,inquiries.read' },
    });
    assert.equal(response.statusCode, 403);
  } finally {
    await app.close();
  }
});

test('CRM lead creation validates required fields and score bounds before service execution', async () => {
  const app = await buildTestApp();
  try {
    const headers = { 'x-test-access': 'STAFF', 'x-test-permissions': 'crm.leads.create' };
    const missingName = await app.inject({ method: 'POST', url: '/crm/leads', headers, payload: { score: 10 } });
    assert.equal(missingName.statusCode, 400);
    const invalidScore = await app.inject({ method: 'POST', url: '/crm/leads', headers, payload: { displayName: 'Lead', score: 101 } });
    assert.equal(invalidScore.statusCode, 400);
  } finally {
    await app.close();
  }
});

test('CRM lead update rejects empty payloads and out-of-range scores', async () => {
  const app = await buildTestApp();
  try {
    const headers = { 'x-test-access': 'STAFF', 'x-test-permissions': 'crm.leads.update' };
    const empty = await app.inject({ method: 'PATCH', url: '/crm/leads/1', headers, payload: {} });
    assert.equal(empty.statusCode, 400);
    const invalidScore = await app.inject({ method: 'PATCH', url: '/crm/leads/1', headers, payload: { score: -1 } });
    assert.equal(invalidScore.statusCode, 400);
    const invalidId = await app.inject({ method: 'PATCH', url: '/crm/leads/not-an-id', headers, payload: { score: 10 } });
    assert.equal(invalidId.statusCode, 400);
  } finally {
    await app.close();
  }
});

test('CRM lead assignment, status and merge commands validate their required contracts', async () => {
  const app = await buildTestApp();
  try {
    const assign = await app.inject({
      method: 'POST', url: '/crm/leads/1/assign',
      headers: { 'x-test-access': 'STAFF', 'x-test-permissions': 'crm.leads.assign' },
      payload: {},
    });
    assert.equal(assign.statusCode, 400);

    const status = await app.inject({
      method: 'POST', url: '/crm/leads/1/status',
      headers: { 'x-test-access': 'STAFF', 'x-test-permissions': 'crm.leads.update' },
      payload: { status: 'CONVERTED' },
    });
    assert.equal(status.statusCode, 400);

    const merge = await app.inject({
      method: 'POST', url: '/crm/leads/1/merge',
      headers: { 'x-test-access': 'STAFF', 'x-test-permissions': 'crm.leads.merge' },
      payload: { targetLeadId: 2 },
    });
    assert.equal(merge.statusCode, 400);
  } finally {
    await app.close();
  }
});


test('CRM task mutations forward the authenticated STAFF actor for AuditLog attribution', async () => {
  const originals = {
    updateTask: crmService.updateTask,
    assignTask: crmService.assignTask,
    completeTask: crmService.completeTask,
  };
  const received = {};
  crmService.updateTask = async (...args) => { received.updateTask = args; return { id: 61 }; };
  crmService.assignTask = async (...args) => { received.assignTask = args; return { id: 61 }; };
  crmService.completeTask = async (...args) => { received.completeTask = args; return { id: 61 }; };
  const app = await buildTestApp();
  try {
    const update = await app.inject({
      method: 'PATCH', url: '/crm/tasks/61',
      headers: { 'x-test-access': 'STAFF', 'x-test-permissions': 'crm.tasks.update' },
      payload: { status: 'IN_PROGRESS' },
    });
    assert.equal(update.statusCode, 200);
    assert.deepEqual(received.updateTask, ['61', { status: 'IN_PROGRESS' }, 1]);

    const assign = await app.inject({
      method: 'POST', url: '/crm/tasks/61/assign',
      headers: { 'x-test-access': 'STAFF', 'x-test-permissions': 'crm.tasks.assign' },
      payload: { assigneeUserId: 8 },
    });
    assert.equal(assign.statusCode, 200);
    assert.deepEqual(received.assignTask, ['61', 8, 1]);

    const complete = await app.inject({
      method: 'POST', url: '/crm/tasks/61/complete',
      headers: { 'x-test-access': 'STAFF', 'x-test-permissions': 'crm.tasks.update' },
    });
    assert.equal(complete.statusCode, 200);
    assert.deepEqual(received.completeTask, ['61', 1]);
  } finally {
    Object.assign(crmService, originals);
    await app.close();
  }
});

test('CRM account/contact mutations forward the authenticated STAFF actor for AuditLog attribution', async () => {
  const originals = {
    updateAccount: crmService.updateAccount,
    createContact: crmService.createContact,
    updateContact: crmService.updateContact,
  };
  const received = {};
  crmService.updateAccount = async (...args) => { received.updateAccount = args; return { id: 31 }; };
  crmService.createContact = async (...args) => { received.createContact = args; return { id: 51 }; };
  crmService.updateContact = async (...args) => { received.updateContact = args; return { id: 51 }; };
  const app = await buildTestApp();
  try {
    const headers = { 'x-test-access': 'STAFF' };
    const updatedAccount = await app.inject({
      method: 'PATCH', url: '/crm/accounts/31',
      headers: { ...headers, 'x-test-permissions': 'crm.accounts.update' },
      payload: { displayName: 'Updated account' },
    });
    assert.equal(updatedAccount.statusCode, 200);
    assert.deepEqual(received.updateAccount, ['31', { displayName: 'Updated account' }, 1]);

    const createdContact = await app.inject({
      method: 'POST', url: '/crm/accounts/31/contacts',
      headers: { ...headers, 'x-test-permissions': 'crm.contacts.create' },
      payload: { name: 'Primary contact' },
    });
    assert.equal(createdContact.statusCode, 200);
    assert.deepEqual(received.createContact, ['31', { name: 'Primary contact' }, 1]);

    const updatedContact = await app.inject({
      method: 'PATCH', url: '/crm/contacts/51',
      headers: { ...headers, 'x-test-permissions': 'crm.contacts.update' },
      payload: { title: 'Purchasing lead' },
    });
    assert.equal(updatedContact.statusCode, 200);
    assert.deepEqual(received.updateContact, ['51', { title: 'Purchasing lead' }, 1]);
  } finally {
    Object.assign(crmService, originals);
    await app.close();
  }
});

test('CRM lead conversion requires its dedicated permission and forwards the authenticated actor', async () => {
  const original = crmService.convertLead;
  let received;
  crmService.convertLead = async (...args) => {
    received = args;
    return { leadId: 1, account: { id: 99 }, alreadyConverted: false };
  };
  const app = await buildTestApp();
  try {
    const denied = await app.inject({
      method: 'POST',
      url: '/crm/leads/1/convert',
      headers: { 'x-test-access': 'STAFF', 'x-test-permissions': 'crm.leads.read' },
    });
    assert.equal(denied.statusCode, 403);

    const allowed = await app.inject({
      method: 'POST',
      url: '/crm/leads/1/convert',
      headers: { 'x-test-access': 'STAFF', 'x-test-permissions': 'crm.leads.convert' },
    });
    assert.equal(allowed.statusCode, 200);
    assert.deepEqual(received, ['1', 1]);
  } finally {
    crmService.convertLead = original;
    await app.close();
  }
});

test('CRM pipeline and source mutations forward the authenticated STAFF actor', async () => {
  const originals = {
    manageSource: crmService.manageSource,
    createPipeline: crmService.createPipeline,
    updatePipeline: crmService.updatePipeline,
    createPipelineStage: crmService.createPipelineStage,
    updatePipelineStage: crmService.updatePipelineStage,
  };
  const received = {};
  crmService.manageSource = async (...args) => { received.source = args; return { id: 5 }; };
  crmService.createPipeline = async (...args) => { received.createPipeline = args; return { id: 3 }; };
  crmService.updatePipeline = async (...args) => { received.updatePipeline = args; return { id: 3 }; };
  crmService.createPipelineStage = async (...args) => { received.createStage = args; return { id: 10 }; };
  crmService.updatePipelineStage = async (...args) => { received.updateStage = args; return { id: 10 }; };
  const app = await buildTestApp();
  try {
    const headers = { 'x-test-access': 'STAFF', 'x-test-permissions': 'crm.sources.manage,crm.pipelines.manage' };
    const source = await app.inject({ method: 'POST', url: '/crm/lead-sources', headers, payload: { code: 'WEB', label: 'Website' } });
    const pipeline = await app.inject({ method: 'POST', url: '/crm/pipelines', headers, payload: { name: 'Main' } });
    const updated = await app.inject({ method: 'PATCH', url: '/crm/pipelines/3', headers, payload: { isActive: false } });
    const stage = await app.inject({ method: 'POST', url: '/crm/pipelines/3/stages', headers, payload: { code: 'NEW', label: 'New' } });
    const updatedStage = await app.inject({ method: 'PATCH', url: '/crm/pipelines/3/stages/10', headers, payload: { label: 'Qualified' } });

    for (const response of [source, pipeline, updated, stage, updatedStage]) assert.equal(response.statusCode, 200);
    assert.deepEqual(received.source, [{ code: 'WEB', label: 'Website' }, undefined, 1]);
    assert.deepEqual(received.createPipeline, [{ name: 'Main' }, 1]);
    assert.deepEqual(received.updatePipeline, ['3', { isActive: false }, 1]);
    assert.deepEqual(received.createStage, ['3', { code: 'NEW', label: 'New' }, 1]);
    assert.deepEqual(received.updateStage, ['3', '10', { label: 'Qualified' }, 1]);
  } finally {
    Object.assign(crmService, originals);
    await app.close();
  }
});

test('CRM opportunity update requires its dedicated permission and forwards the authenticated actor', async () => {
  const original = crmService.updateOpportunity;
  let received;
  crmService.updateOpportunity = async (...args) => {
    received = args;
    return { id: 42, title: args[1].title };
  };
  const app = await buildTestApp();
  try {
    const denied = await app.inject({
      method: 'PATCH',
      url: '/crm/opportunities/42',
      headers: { 'x-test-access': 'STAFF', 'x-test-permissions': 'crm.opportunities.read' },
      payload: { title: 'Renewal' },
    });
    assert.equal(denied.statusCode, 403);

    const allowed = await app.inject({
      method: 'PATCH',
      url: '/crm/opportunities/42',
      headers: { 'x-test-access': 'STAFF', 'x-test-permissions': 'crm.opportunities.update' },
      payload: { title: 'Renewal' },
    });
    assert.equal(allowed.statusCode, 200);
    assert.deepEqual(received, ['42', { title: 'Renewal' }, 1]);
  } finally {
    crmService.updateOpportunity = original;
    await app.close();
  }
});

test('CRM lead status route forwards the authenticated actor to the service', async () => {
  const original = crmService.changeLeadStatus;
  let received;
  crmService.changeLeadStatus = async (...args) => {
    received = args;
    return { id: 1, status: args[1] };
  };
  const app = await buildTestApp();
  try {
    const response = await app.inject({
      method: 'POST',
      url: '/crm/leads/1/status',
      headers: { 'x-test-access': 'STAFF', 'x-test-permissions': 'crm.leads.update' },
      payload: { status: 'CONTACTED', reason: 'Initial contact' },
    });
    assert.equal(response.statusCode, 200);
    assert.deepEqual(received, ['1', 'CONTACTED', 'Initial contact', 1]);
  } finally {
    crmService.changeLeadStatus = original;
    await app.close();
  }
});
