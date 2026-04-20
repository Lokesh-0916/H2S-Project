const express   = require('express');
const { body, validationResult } = require('express-validator');
const jwt       = require('jsonwebtoken');
const passport  = require('../middleware/passport');
const User      = require('../models/User');
const { authLimiter, signupLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// ── Helpers ──────────────────────────────────────────────

function issueToken(user) {
  return jwt.sign(
    {
      userId:    user._id,
      email:     user.email,
      role:      user.role,
      storeId:   user.storeId,
      storeName: user.storeName,
      name:      user.profile?.name || '',
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

function sanitizeUser(user) {
  return {
    id:        user._id,
    email:     user.email,
    role:      user.role,
    storeId:   user.storeId,
    storeName: user.storeName,
    profile:   user.profile,
    provider:  user.provider,
  };
}

// ── PATIENT SIGNUP ───────────────────────────────────────
// POST /auth/signup
router.post(
  '/signup',
  signupLimiter,
  [
    body('email')
      .isEmail().withMessage('Valid email required')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
      .matches(/[0-9]/).withMessage('Password must contain at least one number')
      .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character'),
    body('name')
      .trim()
      .isLength({ min: 2, max: 80 }).withMessage('Name must be 2–80 characters')
      .escape(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password, name } = req.body;

    try {
      // Check duplicate — Mongoose parameterised, safe from injection
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
      }

      const passwordHash = await User.hashPassword(password);
      const user = await User.create({
        email,
        passwordHash,
        role: 'patient',
        provider: 'local',
        profile: { name },
      });

      const token = issueToken(user);
      return res.status(201).json({ success: true, token, user: sanitizeUser(user) });
    } catch (err) {
      console.error('[signup]', err);
      if (err.code === 11000) {
        return res.status(409).json({ success: false, error: 'Email already registered.' });
      }
      return res.status(500).json({ success: false, error: 'Server error. Please try again.' });
    }
  }
);

// ── PATIENT LOGIN ────────────────────────────────────────
// POST /auth/login
router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email, role: 'patient' });

      if (!user) {
        // Generic message — don't reveal if email exists
        return res.status(401).json({ success: false, error: 'Invalid email or password.' });
      }

      // Check account lock
      if (user.isLocked) {
        const remaining = Math.ceil((user.lockUntil - Date.now()) / 60000);
        return res.status(423).json({
          success: false,
          error: `Account locked due to too many failed login attempts. Try again in ${remaining} minute${remaining !== 1 ? 's' : ''}.`,
          locked: true,
          retryAfterMinutes: remaining,
        });
      }

      const valid = await user.verifyPassword(password);
      if (!valid) {
        await user.incLoginAttempts();
        const attemptsLeft = Math.max(0, 5 - (user.loginAttempts + 1));
        return res.status(401).json({
          success: false,
          error: attemptsLeft > 0
            ? `Invalid email or password. ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining before lockout.`
            : 'Account locked due to too many failed attempts. Try again in 15 minutes.',
        });
      }

      // Successful login
      await user.resetLoginAttempts();
      const token = issueToken(user);
      return res.json({ success: true, token, user: sanitizeUser(user) });
    } catch (err) {
      console.error('[login]', err);
      return res.status(500).json({ success: false, error: 'Server error. Please try again.' });
    }
  }
);

// ── STORE LOGIN ──────────────────────────────────────────
// POST /auth/store-login
// Supports: pre-seeded major chains (pin) OR registered local stores (email+password)
router.post(
  '/store-login',
  authLimiter,
  [
    body('storeId').optional().trim().escape(),
    body('email').optional().isEmail().normalizeEmail(),
    body('password').optional().isLength({ min: 1 }),
    body('pin').optional().isLength({ min: 4, max: 6 }),
  ],
  async (req, res) => {
    const { storeId, email, password, pin } = req.body;

    try {
      // Case 1: Major chain — login by storeId + pin (demo stores)
      if (storeId && pin) {
        const DEMO_STORES = require('../data/storesList').DEMO_PINS;
        const store = DEMO_STORES.find(s => s.id === storeId);
        if (!store) {
          return res.status(404).json({ success: false, error: 'Store not found.' });
        }
        if (store.pin !== pin) {
          return res.status(401).json({ success: false, error: 'Invalid PIN.' });
        }
        // Issue a store token for demo stores (no DB user needed)
        const token = jwt.sign(
          { userId: `demo_${storeId}`, email: `${storeId}@demo.medsmart`, role: 'store', storeId, storeName: store.name, name: store.name },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
        );
        return res.json({ success: true, token, user: { role: 'store', storeId, storeName: store.name, profile: { name: store.name } } });
      }

      // Case 2: Registered local pharmacy — email + password
      if (email && password) {
        const user = await User.findOne({ email, role: 'store' });
        if (!user) {
          return res.status(401).json({ success: false, error: 'Invalid email or password.' });
        }
        if (user.isLocked) {
          const remaining = Math.ceil((user.lockUntil - Date.now()) / 60000);
          return res.status(423).json({ success: false, error: `Account locked. Try again in ${remaining} minute(s).`, locked: true });
        }
        const valid = await user.verifyPassword(password);
        if (!valid) {
          await user.incLoginAttempts();
          const attemptsLeft = Math.max(0, 5 - (user.loginAttempts + 1));
          return res.status(401).json({
            success: false,
            error: attemptsLeft > 0
              ? `Invalid email or password. ${attemptsLeft} attempt(s) remaining.`
              : 'Account locked. Try again in 15 minutes.',
          });
        }
        await user.resetLoginAttempts();
        const token = issueToken(user);
        return res.json({ success: true, token, user: sanitizeUser(user) });
      }

      return res.status(400).json({ success: false, error: 'Provide either storeId+pin or email+password.' });
    } catch (err) {
      console.error('[store-login]', err);
      return res.status(500).json({ success: false, error: 'Server error.' });
    }
  }
);

// ── LOCAL STORE REGISTER ──────────────────────────────────
// POST /auth/store-register
router.post(
  '/store-register',
  signupLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/[A-Z]/).withMessage('Must contain uppercase')
      .matches(/[0-9]/).withMessage('Must contain a number'),
    body('storeName').trim().isLength({ min: 3, max: 100 }).escape(),
    body('ownerName').trim().isLength({ min: 2, max: 80 }).escape(),
    body('phone').trim().isMobilePhone('en-IN').withMessage('Valid Indian mobile number required'),
    body('address').trim().isLength({ min: 5, max: 200 }).escape(),
    body('city').trim().isLength({ min: 2, max: 60 }).escape(),
    body('pincode').trim().isPostalCode('IN').withMessage('Valid 6-digit pincode required'),
    body('licenseNo').trim().isLength({ min: 3, max: 40 }).escape(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password, storeName, ownerName, phone, address, city, pincode, licenseNo } = req.body;

    try {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ success: false, error: 'Email already registered.' });
      }

      const passwordHash = await User.hashPassword(password);
      // Generate unique local store ID
      const storeId = 'LOCAL_' + Date.now();

      const user = await User.create({
        email,
        passwordHash,
        role: 'store',
        provider: 'local',
        storeId,
        storeName,
        profile: {
          name: ownerName,
          phone,
          address,
          city,
          pincode,
        },
      });

      const token = issueToken(user);
      return res.status(201).json({ success: true, token, user: sanitizeUser(user) });
    } catch (err) {
      console.error('[store-register]', err);
      if (err.code === 11000) {
        return res.status(409).json({ success: false, error: 'Email already registered.' });
      }
      return res.status(500).json({ success: false, error: 'Server error.' });
    }
  }
);

// ── GOOGLE OAUTH ──────────────────────────────────────────
// Step 1: Redirect user to Google consent screen
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

// Step 2: Google redirects back here with code
router.get(
  '/google/callback',
  (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user, info) => {
      if (err) {
        console.error('[Google OAuth Error]', err);
        return res.redirect(`${process.env.FRONTEND_URL}?oauth_error=google_failed&reason=${encodeURIComponent(err.message || 'Unknown Error')}`);
      }
      if (!user) {
        console.log('[Google Auth] No user returned:', info);
        return res.redirect(`${process.env.FRONTEND_URL}?oauth_error=google_failed&reason=no_user`);
      }
      try {
        const token = issueToken(user);
        res.redirect(`${process.env.FRONTEND_URL}?oauth_token=${token}&provider=google`);
      } catch (issueErr) {
        console.error('[Google Token Issue Error]', issueErr);
        res.redirect(`${process.env.FRONTEND_URL}?oauth_error=google_failed&reason=token_issue_error`);
      }
    })(req, res, next);
  }
);

// ── MICROSOFT OAUTH ───────────────────────────────────────
// Step 1: Redirect user to Microsoft consent screen
router.get(
  '/microsoft',
  passport.authenticate('microsoft', { session: false })
);

// Step 2: Microsoft redirects back here with code
router.get(
  '/microsoft/callback',
  (req, res, next) => {
    passport.authenticate('microsoft', { session: false }, (err, user, info) => {
      if (err) {
        console.error('[Microsoft OAuth Error]', err);
        return res.redirect(`${process.env.FRONTEND_URL}?oauth_error=microsoft_failed&reason=${encodeURIComponent(err.message || 'Unknown Error')}`);
      }
      if (!user) {
        console.log('[Microsoft Auth] No user returned:', info);
        return res.redirect(`${process.env.FRONTEND_URL}?oauth_error=microsoft_failed&reason=no_user`);
      }
      try {
        const token = issueToken(user);
        res.redirect(`${process.env.FRONTEND_URL}?oauth_token=${token}&provider=microsoft`);
      } catch (issueErr) {
        console.error('[Microsoft Token Issue Error]', issueErr);
        res.redirect(`${process.env.FRONTEND_URL}?oauth_error=microsoft_failed&reason=token_issue_error`);
      }
    })(req, res, next);
  }
);

module.exports = router;
