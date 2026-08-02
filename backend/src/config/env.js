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
  superAdminUsername: process.env.SUPER_ADMIN_USERNAME || 'admin',
  superAdminPassword: process.env.SUPER_ADMIN_PASSWORD || '123456',
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

module.exports = env;
