/**
 * Environment Configuration Validation
 * Validates required environment variables at startup
 */

const requiredEnvVars = {
  // Website app
  website: {
    VITE_API_BASE_URL: 'API base URL (e.g., https://api.example.com/api/v1)',
    VITE_COMPANY_APP_URL: 'Company portal URL (e.g., https://company.example.com)',
    VITE_ADMIN_APP_URL: 'Admin portal URL (e.g., https://admin.example.com)',
  },
  // Company app
  company: {
    VITE_API_BASE_URL: 'API base URL (e.g., https://api.example.com/api/v1)',
    VITE_WEBSITE_APP_URL: 'Website URL (e.g., https://example.com)',
    VITE_ADMIN_APP_URL: 'Admin portal URL (e.g., https://admin.example.com)',
  },
  // Admin app
  admin: {
    VITE_API_BASE_URL: 'API base URL (e.g., https://api.example.com/api/v1)',
    VITE_WEBSITE_APP_URL: 'Website URL (e.g., https://example.com)',
    VITE_COMPANY_APP_URL: 'Company portal URL (e.g., https://company.example.com)',
  }
}

/**
 * Validates environment variables for the current app
 * @param {string} appName - Name of the app (website, company, admin)
 * @returns {Object} Validation result
 */
export function validateEnv(appName) {
  const required = requiredEnvVars[appName]
  if (!required) {
    return { valid: true, missing: [], warnings: [] }
  }

  const missing = []
  const warnings = []

  for (const [key, description] of Object.entries(required)) {
    const value = import.meta.env[key]
    if (!value || value === '') {
      missing.push({ key, description })
    }
  }

  // Check for common issues
  if (import.meta.env.VITE_API_BASE_URL && !import.meta.env.VITE_API_BASE_URL.startsWith('http')) {
    warnings.push({
      key: 'VITE_API_BASE_URL',
      message: 'API base URL should start with http:// or https://'
    })
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings
  }
}

/**
 * Logs validation results to console
 * @param {string} appName - Name of the app
 */
export function logEnvValidation(appName) {
  const result = validateEnv(appName)
  
  if (result.missing.length > 0) {
    console.group(`⚠️ Missing environment variables for ${appName}`)
    result.missing.forEach(({ key, description }) => {
      console.error(`  ${key}: ${description}`)
    })
    console.groupEnd()
  }

  if (result.warnings.length > 0) {
    console.group(`⚠️ Environment warnings for ${appName}`)
    result.warnings.forEach(({ key, message }) => {
      console.warn(`  ${key}: ${message}`)
    })
    console.groupEnd()
  }

  if (result.valid && result.warnings.length === 0) {
    console.log(`✅ Environment validation passed for ${appName}`)
  }

  return result
}

/**
 * Gets validated environment variable with fallback
 * @param {string} key - Environment variable key
 * @param {string} fallback - Fallback value
 * @returns {string} Environment variable value or fallback
 */
export function getEnv(key, fallback = '') {
  const value = import.meta.env[key]
  if (!value || value === '') {
    if (fallback !== '') {
      console.warn(`⚠️ Environment variable ${key} not set, using fallback: ${fallback}`)
      return fallback
    }
    console.error(`❌ Required environment variable ${key} is not set!`)
    return ''
  }
  return value
}

export default {
  validateEnv,
  logEnvValidation,
  getEnv
}