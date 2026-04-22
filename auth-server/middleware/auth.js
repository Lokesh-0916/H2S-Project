const jwt = require('jsonwebtoken');

/**
 * JWT authentication middleware.
 * Expects: Authorization: Bearer <token>
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No token provided. Please log in.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, email, role, storeId }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, error: 'Invalid token. Please log in again.' });
  }
}

/**
 * Require store role
 */
function requireStore(req, res, next) {
  if (req.user?.role !== 'store') {
    return res.status(403).json({ success: false, error: 'Store access required.' });
  }
  next();
}

/**
 * Require patient role
 */
function requirePatient(req, res, next) {
  if (req.user?.role !== 'patient') {
    return res.status(403).json({ success: false, error: 'Patient access required.' });
  }
  next();
}

module.exports = { requireAuth, requireStore, requirePatient };
