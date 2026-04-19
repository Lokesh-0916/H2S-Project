const rateLimit = require('express-rate-limit');

// ── IP-level rate limiter for auth endpoints ─────────────
// Max 10 requests per 15 minutes per IP on login/signup routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only count failures
  message: {
    success: false,
    error: 'Too many login attempts from this IP. Please wait 15 minutes before trying again.',
    retryAfterMs: 15 * 60 * 1000,
  },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  },
});

// ── Stricter limiter for signup ───────────────────────────
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many account creation attempts. Please try again in 1 hour.',
  },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  },
});

// ── General API limiter ───────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Rate limit exceeded. Please slow down.',
  },
});

module.exports = { authLimiter, signupLimiter, apiLimiter };
