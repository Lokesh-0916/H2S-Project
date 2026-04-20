const passport       = require('passport');
const GoogleStrategy    = require('passport-google-oauth20').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const User = require('../models/User');

// ── Google Strategy ───────────────────────────────────────
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error('No email from Google'), null);

        let user = await User.findOne({ email });
        if (user) {
          if (user.provider === 'local') {
            user.provider   = 'google';
            user.providerId = profile.id;
            await user.save();
          }
        } else {
          user = await User.create({
            email,
            provider:        'google',
            providerId:      profile.id,
            role:            'patient',
            isEmailVerified: true,
            profile: { name: profile.displayName || email.split('@')[0] },
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  ));
  console.log('  ✅  Google OAuth strategy registered');
} else {
  console.warn('  ⚠️   Google OAuth disabled — GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing in .env');
}

// ── Microsoft Strategy ────────────────────────────────────
if (process.env.MS_CLIENT_ID && process.env.MS_CLIENT_SECRET) {
  passport.use(new MicrosoftStrategy(
    {
      clientID:     process.env.MS_CLIENT_ID,
      clientSecret: process.env.MS_CLIENT_SECRET,
      callbackURL:  process.env.MS_CALLBACK_URL || 'http://localhost:3001/auth/microsoft/callback',
      scope:        ['user.read'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value || profile._json?.mail || profile._json?.userPrincipalName;
        if (!email) return done(new Error('No email from Microsoft'), null);

        let user = await User.findOne({ email });
        if (user) {
          if (user.provider === 'local') {
            user.provider   = 'microsoft';
            user.providerId = profile.id;
            await user.save();
          }
        } else {
          user = await User.create({
            email,
            provider:        'microsoft',
            providerId:      profile.id,
            role:            'patient',
            isEmailVerified: true,
            profile: { name: profile.displayName || email.split('@')[0] },
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  ));
  console.log('  ✅  Microsoft OAuth strategy registered');
} else {
  console.warn('  ⚠️   Microsoft OAuth disabled — MS_CLIENT_ID or MS_CLIENT_SECRET missing in .env');
}

// Passport session stubs (we use JWT, not sessions)
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try { done(null, await User.findById(id)); }
  catch (err) { done(err, null); }
});

module.exports = passport;
