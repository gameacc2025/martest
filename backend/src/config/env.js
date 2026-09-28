// =============================================================
// Environment Configuration
//
// Loads and validates all required environment variables.
// Fails fast on startup if any required variable is missing —
// better to crash immediately than to fail silently at runtime.
// =============================================================

require('dotenv').config();

const env = {
  // Server
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  databaseUrl: process.env.DATABASE_URL,

  // JWT - Access Token (short-lived, sent in Authorization header)
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',

  // JWT - Refresh Token (long-lived, stored in DB + httpOnly cookie)
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // Security
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10,

  // CORS - allowed frontend origin
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',

  // Initial Super Admin credentials (used by seed.js on first run only).
  // After seeding, change the password via the admin change-password endpoint.
  // Phone is the sole login identity (SUPER_ADMIN_USERNAME no longer exists).
  superAdminPhone: process.env.SUPER_ADMIN_PHONE || '09120000000',
  superAdminPassword: process.env.SUPER_ADMIN_PASSWORD || 'Admin@123456',
  superAdminEmail: process.env.SUPER_ADMIN_EMAIL || 'admin@telecommarketplace.local',
};

// Required variables — app will not start without these
const REQUIRED = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
];

const missing = REQUIRED.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`[env] Missing required environment variables: ${missing.join(', ')}`);
  console.error('[env] Copy backend/.env.example to backend/.env and fill in the values.');
  process.exit(1);
}

// In production, never allow the seed script to fall back to the
// well-known default super-admin password ('123456'). If it's not
// explicitly set, crash on boot instead of silently seeding a
// guessable credential — better to fail loudly than to ship a
// known-password super-admin account.
if (env.nodeEnv === 'production' && !process.env.SUPER_ADMIN_PASSWORD) {
  console.error('[env] SUPER_ADMIN_PASSWORD must be explicitly set in production.');
  console.error('[env] Refusing to start with the default seed password.');
  process.exit(1);
}

module.exports = env;