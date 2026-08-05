/**
 * Password Utility Functions
 *
 * Secure password hashing and verification using bcrypt
 */

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * Hash a password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if password matches hash
 */
async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate a random password
 * @param {number} length - Length of password
 * @returns {string} Random password
 */
function generateRandomPassword(length = 12) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
  let password = '';

  // crypto.randomInt is a CSPRNG — unlike Math.random(), its output
  // cannot be predicted/reproduced by an attacker who wants to guess
  // generated passwords (e.g. admin-issued temporary passwords).
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length);
    password += charset[randomIndex];
  }

  return password;
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateRandomPassword
};