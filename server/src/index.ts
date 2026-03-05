import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth.routes';
import briefingRoutes from './routes/briefing.routes';
import rosterRoutes from './routes/roster.routes';
import sectionRoutes from './routes/section.routes';
import studentRoutes from './routes/student.routes';
import observationRoutes from './routes/observation.routes';
import referralRoutes from './routes/referral.routes';
import interventionRoutes from './routes/intervention.routes';
import notificationRoutes from './routes/notification.routes';
import aiRoutes from './routes/ai.routes';
import insightsRoutes from './routes/insights.routes';

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Security & Parsing ───────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CLIENT_URL
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// ─── API Routes ────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/briefing', briefingRoutes);
app.use('/api/roster', rosterRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/observations', observationRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/interventions', interventionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/insights', insightsRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Error Handling ────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ──────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`AtlasED Classroom API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
