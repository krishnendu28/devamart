const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'devamart_super_secret_change_me_in_production';

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { signToken, verifyToken, JWT_SECRET };