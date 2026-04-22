const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ── GET /profile ─────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash -loginAttempts -lockUntil');
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
    res.json({ success: true, user });
  } catch (err) {
    console.error('[get-profile]', err);
    res.status(500).json({ success: false, error: 'Server error.' });
  }
});

// ── PUT /profile ─────────────────────────────────────────
router.put(
  '/',
  requireAuth,
  [
    body('name').optional().trim().isLength({ min: 1, max: 80 }).escape(),
    body('phone').optional().trim().isMobilePhone().withMessage('Invalid phone'),
    body('dob').optional().trim().escape(),
    body('bloodGroup').optional().trim().isIn(['A+','A-','B+','B-','AB+','AB-','O+','O-','']).withMessage('Invalid blood group'),
    body('address').optional().trim().isLength({ max: 200 }).escape(),
    body('city').optional().trim().isLength({ max: 60 }).escape(),
    body('pincode').optional().trim().escape(),
    body('emergencyContact').optional().trim().escape(),
    body('gender').optional().trim().isIn(['Male','Female','Other','Prefer not to say','']),
    body('allergies').optional().trim().isLength({ max: 300 }).escape(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Only allow updating profile sub-fields (whitelist)
    const allowed = ['name','phone','dob','bloodGroup','address','city','pincode','emergencyContact','gender','allergies'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[`profile.${key}`] = req.body[key];
      }
    }

    try {
      // Skip demo users (storeId starts with 'demo_')
      if (req.user.userId.startsWith('demo_')) {
        return res.json({ success: true, message: 'Demo account — profile not persisted.' });
      }

      const user = await User.findByIdAndUpdate(
        req.user.userId,
        { $set: updates },
        { new: true, runValidators: true }
      ).select('-passwordHash -loginAttempts -lockUntil');

      if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
      res.json({ success: true, user });
    } catch (err) {
      console.error('[update-profile]', err);
      res.status(500).json({ success: false, error: 'Server error.' });
    }
  }
);

module.exports = router;
