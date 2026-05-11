const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

function sign(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES });
}

function verify(token) {
  return jwt.verify(token, SECRET);
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  try {
    req.user = verify(token);
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalido o expirado' });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Solo administradores' });
  }
  next();
}

module.exports = { sign, verify, authMiddleware, adminOnly };
