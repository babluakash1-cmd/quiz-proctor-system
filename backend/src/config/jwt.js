const crypto = require('crypto');
require('dotenv').config();

let runtimeSecret = process.env.JWT_SECRET;

if (!runtimeSecret) {
  if (process.env.NODE_ENV === 'production') {
    console.error('[CRITICAL] JWT_SECRET environment variable is not defined! Server security is compromised.');
  } else {
    console.warn('[WARNING] JWT_SECRET is not set in .env! Generating an ephemeral random secret for this process session.');
  }
  // Generate a cryptographically secure 256-bit random key for the current process lifetime
  runtimeSecret = crypto.randomBytes(32).toString('hex');
}

function getJwtSecret() {
  return runtimeSecret;
}

module.exports = { getJwtSecret };
