// =============================================================
// Prisma Client Singleton
//
// Exports a single PrismaClient instance shared across the app.
// Using multiple instances would exhaust the connection pool.
//
// In development, logs query errors and warnings.
// In production, only logs errors to reduce noise.
// =============================================================

const { PrismaClient } = require('@prisma/client');
const { nodeEnv } = require('./env');

const prisma = new PrismaClient({
  log: nodeEnv === 'development'
    ? [
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
        // Uncomment the line below to log all queries (very verbose):
        // { emit: 'stdout', level: 'query' },
      ]
    : [{ emit: 'stdout', level: 'error' }],
});

// Graceful shutdown — close DB connection when app exits
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
