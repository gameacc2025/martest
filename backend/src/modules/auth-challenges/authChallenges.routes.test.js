const test = require('node:test');
const assert = require('node:assert/strict');
const authChallengesRoutes = require('./authChallenges.routes');

test('challenge request, verification and consumption endpoints have IP rate limits', async () => {
  const routes = [];
  const fastify = {
    authenticate: async () => {},
    addHook() {},
    post(routePath, options) {
      routes.push({ method: 'POST', path: routePath, options });
    },
    get(routePath, options) {
      routes.push({ method: 'GET', path: routePath, options });
    },
  };

  await authChallengesRoutes(fastify);

  const requestRoute = routes.find((entry) => entry.method === 'POST' && entry.path === '/challenges');
  assert.ok(requestRoute, 'missing challenge request route');
  assert.deepEqual(requestRoute.options.config.rateLimit, {
    max: 5,
    timeWindow: '15 minutes',
  });

  for (const path of ['/challenges/verify', '/challenges/consume']) {
    const route = routes.find((entry) => entry.method === 'POST' && entry.path === path);
    assert.ok(route, `missing route ${path}`);
    assert.deepEqual(route.options.config.rateLimit, {
      max: 20,
      timeWindow: '15 minutes',
    });
  }
});
