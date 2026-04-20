const passport       = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const User = require('../models/User');

// ── Google Strategy ───────────────────────────────────────
passport.use(new GoogleStrategy(
  {
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  process.env.GOOGLE_CALLBACK_URL,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) return done(new Error('No email from Google'), null);

      // Find existing user or create new one
      let user = await User.findOne({ email });

      if (user) {
        // Update provider info if they previously used local auth
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
          profile: {
            name: profile.displayName || email.split('@')[0],
          },
        });
      }

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

// ── Microsoft Strategy ────────────────────────────────────
passport.use(new MicrosoftStrategy(
  {
    clientID:     process.env.MS_CLIENT_ID,
    clientSecret: process.env.MS_CLIENT_SECRET,
    callbackURL:  process.env.MS_CALLBACK_URL,
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
          profile: {
            name: profile.displayName || email.split('@')[0],
          },
        });
      }

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

// Passport requires these for session support (we use JWT so they're minimal)
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
