const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../config/jwt');

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied: No token provided' });
  }

  const secret = getJwtSecret();

  try {
    const verified = jwt.verify(token, secret);
    req.admin = verified;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};
