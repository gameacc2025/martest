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

  // CORS - allowed frontend origin(s)
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',

  // Trusted browser origins (CORS allow-list AND the Origin guard applied to
  // cookie-authenticated routes: /refresh, /logout, /handoff/redeem).
  // Comma-separated, e.g. "https://site.x,https://company.x,https://admin.x".
  // Falls back to FRONTEND_URL, then to the three local dev origins.
  allowedOrigins: (
    process.env.ALLOWED_ORIGINS
    || process.env.FRONTEND_URL
    || 'http://localhost:3001,http://localhost:3002,http://localhost:3003'
  ).split(',').map((s) => s.trim()).filter(Boolean),

  // Initial Super Admin credentials (used by seed.js on first run only).
  // After seeding, change the password via the admin change-password endpoint.
  // Phone is the sole login identity (SUPER_ADMIN_USERNAME no longer exists).
  superAdminPhone: process.env.SUPER_ADMIN_PHONE || '09120000000',
  superAdminPassword: process.env.SUPER_ADMIN_PASSWORD || 'Admin@123456',
  superAdminEmail: process.env.SUPER_ADMIN_EMAIL || 'admin@telecommarketplace.local',

  // ── Notifications ──────────────────────────────────────────────
  // Email provider configuration. When SMTP_HOST is not set, the
  // delivery worker falls back to a console adapter that logs the
  // message — useful for local development and tests.
  smtpHost: process.env.SMTP_HOST || null,
  smtpPort: parseInt(process.env.SMTP_PORT, 10) || 587,
  smtpUser: process.env.SMTP_USER || null,
  smtpPass: process.env.SMTP_PASS || null,
  smtpFrom: process.env.SMTP_FROM || 'noreply@telecommarketplace.local',
  // SMS provider configuration (Twilio). When not set, SMS is never queued
  // by the delivery worker — the dispatch service already marks SMS as
  // notImplemented.
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || null,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || null,
  twilioFromNumber: process.env.TWILIO_FROM_NUMBER || null,
  // Max delivery attempts for EMAIL outbox rows (mirrored in dispatch service).
  notificationMaxAttempts: parseInt(process.env.NOTIFICATION_MAX_ATTEMPTS, 10) || 3,
  // How often the delivery worker polls for PENDING rows.
  notificationPollIntervalMs: parseInt(process.env.NOTIFICATION_POLL_INTERVAL_MS, 10) || 5000,
  // Base URL for the API (used in email links).
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api/v1',
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