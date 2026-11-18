function resolveSuperAdminPassword(env = process.env) {
  const configured = typeof env.SUPER_ADMIN_PASSWORD === 'string' ? env.SUPER_ADMIN_PASSWORD.trim() : '';
  if (configured) {
    if (configured.length < 32) {
      throw new Error('SUPER_ADMIN_PASSWORD must contain at least 32 characters.');
    }
    return configured;
  }
  if (env.NODE_ENV === 'development') return 'A123@456';
  throw new Error('SUPER_ADMIN_PASSWORD must be set before running the seed outside development.');
}

module.exports = { resolveSuperAdminPassword };
