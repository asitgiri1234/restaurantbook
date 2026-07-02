import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import authRoutes from './routes/authRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js';
import tableRoutes from './routes/tableRoutes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // CORS — allow the configured client origin(s).
  const origins = (process.env.CLIENT_ORIGIN || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.use(
    cors({
      origin: origins.length ? origins : true,
      credentials: true,
    })
  );

  app.use(express.json());
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Health check (useful for deployment platforms).
  app.get('/api/health', (req, res) =>
    res.json({ success: true, status: 'ok', time: new Date().toISOString() })
  );

  app.use('/api/auth', authRoutes);
  app.use('/api/reservations', reservationRoutes);
  app.use('/api/tables', tableRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
