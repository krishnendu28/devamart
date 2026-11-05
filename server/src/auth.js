const jwt = require('jsonwebtoken');

const FALLBACK_SECRET = 'devamart_super_secret_change_me_in_production';

// Never run production with the source-code fallback secret: a leaked default
// would let anyone mint admin tokens. Vercel deployments pass JWT_SECRET.
if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === FALLBACK_SECRET)) {
  throw new Error('JWT_SECRET must be set to a strong value in production');
}

const JWT_SECRET = process.env.JWT_SECRET || FALLBACK_SECRET;

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d', issuer: 'devamart' },
  );
}

function verifyToken(token) {
  // Accept tokens issued before the issuer claim was added so a security
  // deploy does not sign everybody out unexpectedly.
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { signToken, verifyToken, JWT_SECRET };
