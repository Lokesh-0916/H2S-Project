const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const profileSchema = new mongoose.Schema({
  name:             { type: String,  default: '' },
  phone:            { type: String,  default: '' },
  age:              { type: Number,  default: null },
  dob:              { type: String,  default: '' },
  bloodGroup:       { type: String,  default: '' },
  address:          { type: String,  default: '' },
  city:             { type: String,  default: '' },
  pincode:          { type: String,  default: '' },
  emergencyContact: { type: String,  default: '' },
  gender:           { type: String,  default: '' },
  allergies:        { type: String,  default: '' },
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    // Mongoose validates type — no raw string injection possible
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
  passwordHash: {
    type: String,
    default: null,
  },
  role: {
    type: String,
    enum: ['patient', 'store'],
    required: true,
    default: 'patient',
  },
  storeId: {
    type: String,
    default: null,
  },
  storeName: {
    type: String,
    default: null,
  },
  licenseNo: {
    type: String,
    default: null,
  },
  provider: {
    type: String,
    enum: ['local', 'google', 'microsoft'],
    default: 'local',
  },
  providerId: {
    type: String,
    default: null,
  },
  profile: {
    type: profileSchema,
    default: () => ({}),
  },

  // Brute-force protection fields
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: {
    type: Date,
    default: null,
  },

  isEmailVerified: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// ── Indexes ─────────────────────────────────────────────
// email index is already created by unique:true above — no duplicate needed


// ── Virtual: is account currently locked? ───────────────
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// ── Method: verify password ──────────────────────────────
userSchema.methods.verifyPassword = async function (plainPassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(plainPassword, this.passwordHash);
};

// ── Method: increment login failures & lock if needed ────
const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

userSchema.methods.incLoginAttempts = function () {
  // If previous lock has expired, reset counter
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set:   { loginAttempts: 1, lockUntil: null },
    });
  }
  const updates = { $inc: { loginAttempts: 1 } };
  // Lock the account if we've hit max attempts and it isn't locked yet
  if (this.loginAttempts + 1 >= MAX_ATTEMPTS && !this.isLocked) {
    updates.$set = { lockUntil: new Date(Date.now() + LOCK_DURATION_MS) };
  }
  return this.updateOne(updates);
};

// ── Method: reset after successful login ──────────────────
userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $set: { loginAttempts: 0, lockUntil: null },
  });
};

// ── Static: hash password ────────────────────────────────
userSchema.statics.hashPassword = async function (plain) {
  return bcrypt.hash(plain, 12);
};

module.exports = mongoose.model('User', userSchema);
