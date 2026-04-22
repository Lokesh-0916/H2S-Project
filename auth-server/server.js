require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');

const { apiLimiter } = require('./middleware/rateLimiter');
const authRoutes    = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const storeRoutes   = require('./routes/stores');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Security headers ─────────────────────────────────────
app.use(helmet());

// ── CORS — allow all localhost origins in dev ─────────────
app.use(cors({
  origin: (origin, cb) => {
    // Allow: no origin (curl/Postman), file://, any localhost port
    if (!origin) return cb(null, true);
    if (origin === 'null') return cb(null, true); // file://
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ── Body parser ───────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));   // reject huge payloads
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Logger (dev only) ─────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ── General rate limiter ──────────────────────────────────
app.use('/api', apiLimiter);

// ── Routes ─────────────────────────────────────────────────
app.use('/auth',    authRoutes);
app.use('/profile', profileRoutes);
app.use('/stores',  storeRoutes);

// ── Health check ──────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'MedSmart Auth Server — Running', version: '1.0.0', time: new Date().toISOString() });
});

// ── 404 Catch-all ─────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found.' });
});

// ── Global error handler ──────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({ success: false, error: err.message || 'Internal server error.' });
});

// ── MongoDB connection ────────────────────────────────────
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/medsmart', {
  serverSelectionTimeoutMS: 5000,
})
.then(() => {
  console.log('');
  console.log('  ✅  MongoDB connected — medsmart');
  app.listen(PORT, () => {
    console.log(`  🚀  Auth server running on http://localhost:${PORT}`);
    console.log('');
  });
})
.catch(err => {
  console.error('❌  MongoDB connection failed:', err.message);
  console.error('    Make sure MongoDB is running: mongod --dbpath ./data');
  process.exit(1);
});
