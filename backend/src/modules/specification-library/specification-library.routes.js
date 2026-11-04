const ctrl = require('./specification-library.controller');

async function specificationLibraryRoutes(fastify) {
  fastify.get('/', ctrl.search);
  fastify.get('/all', ctrl.listAll);
}

module.exports = specificationLibraryRoutes;
