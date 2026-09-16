const { verifyToken } = require('./auth');

function publicUser(row) {
  if (!row) return null;
  return { id: row.id, name: row.name, phone: row.phone, email: row.email, role: row.role, created_at: row.created_at };
}

function requireAuth(role) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Authentication required' });
    try {
      const payload = verifyToken(token);
      if (role && payload.role !== role) {
        return res.status(403).json({ error: 'Access denied' });
      }
      req.user = payload;
      next();
    } catch (e) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}

module.exports = { requireAuth, publicUser };