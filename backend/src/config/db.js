// Prisma Client singleton — Prisma ORM 7 + PostgreSQL driver adapter.
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { nodeEnv } = require('./env');

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required to initialize Prisma Client.');

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
});

const prisma = new PrismaClient({
  adapter,
  log: nodeEnv === 'development'
    ? [{ emit: 'stdout', level: 'error' }, { emit: 'stdout', level: 'warn' }]
    : [{ emit: 'stdout', level: 'error' }],
});

process.on('beforeExit', async () => prisma.$disconnect());

module.exports = prisma;
