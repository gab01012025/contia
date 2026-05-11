// CONTIA backend - entry point
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const tramitesRoutes = require('./routes/tramites');
const adminRoutes = require('./routes/admin');
const { errorHandler } = require('./middlewares/error');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('tiny'));

const limiter = rateLimit({ windowMs: 60_000, max: 120 });
app.use('/api', limiter);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'contia-backend',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/tramites', tramitesRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[CONTIA] backend listening on :${PORT}`);
});
