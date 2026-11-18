const test = require('node:test');
const assert = require('node:assert/strict');
const authChallengesRoutes = require('./authChallenges.routes');

test('challenge verification and consumption endpoints have IP rate limits', async () => {
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

  for (const path of ['/challenges/verify', '/challenges/consume']) {
    const route = routes.find((entry) => entry.method === 'POST' && entry.path === path);
    assert.ok(route, `missing route ${path}`);
    assert.deepEqual(route.options.config.rateLimit, {
      max: 20,
      timeWindow: '15 minutes',
    });
  }
});
