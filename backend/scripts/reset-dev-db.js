// Destructive, development-only database rebuild.
const { execFileSync } = require('node:child_process');

function fail(message) {
  console.error('[db:reset:dev] ' + message);
  process.exit(1);
}

if (process.env.NODE_ENV !== 'development') {
  fail('Refusing to reset: NODE_ENV must be exactly "development".');
}
if (!process.env.DATABASE_URL) fail('DATABASE_URL is required.');

let databaseUrl;
try {
  databaseUrl = new URL(process.env.DATABASE_URL);
} catch {
  fail('DATABASE_URL is not a valid PostgreSQL URL.');
}

const databaseName = databaseUrl.pathname.replace(/^\//, '').split('?')[0];
const allowedHosts = new Set(['postgres', 'localhost', '127.0.0.1']);
if (databaseName !== 'telecom_marketplace' || !allowedHosts.has(databaseUrl.hostname)) {
  fail('Refusing to reset unexpected database target: ' + databaseUrl.hostname + '/' + databaseName);
}

console.warn('\nWARNING: DEVELOPMENT DATABASE RESET');
console.warn('All tables and data in ' + databaseUrl.hostname + '/' + databaseName + ' will be erased.');
console.warn('The schema will be recreated and the repeatable demo seed will run.\n');

execFileSync('npx', ['prisma', 'db', 'push', '--force-reset', '--accept-data-loss'], { stdio: 'inherit' });
execFileSync(process.execPath, ['prisma/seed.js'], { stdio: 'inherit' });
