import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';

// ─── V1 Routes (existing) ────────────────────────────────────────────
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

// ─── V2 Module Routes (ATLAS Core Systems) ──────────────────────────
// Module 1: Student Information Management System
import studentInfoRoutes from './modules/student-information/student-info.routes';
// Module 2: Special Education Compliance Engine
import specialEdRoutes from './modules/special-education/special-ed.routes';
// Module 3: Attendance Tracking Module
import attendanceRoutes from './modules/attendance/attendance.routes';
// Module 4: Behavioral Management System
import behavioralRoutes from './modules/behavioral/behavioral.routes';
// Module 5: Academic Performance Reporting
import academicReportingRoutes from './modules/academic-reporting/academic-reporting.routes';
// Module 6: Staff Scheduling Coordinator
import staffSchedulingRoutes from './modules/staff-scheduling/staff-scheduling.routes';
// Module 7: Parent Communication Portal
import parentCommRoutes from './modules/parent-communication/parent-comm.routes';

// ─── Infrastructure Routes ──────────────────────────────────────────
import alertRoutes from './infrastructure/alerts/alert.routes';
import auditRoutes from './infrastructure/audit/audit.routes';
import healthRoutes from './infrastructure/monitoring/health.routes';

// ─── Event Bus Setup ────────────────────────────────────────────────
import { eventBus } from './infrastructure/events/event-bus';

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

// ─── V1 API Routes (backward-compatible) ──────────────────────────────
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

// ─── V2 API Routes (ATLAS Core Systems — Modules 1-7) ────────────────
app.use('/api/v2/students', studentInfoRoutes);         // Module 1
app.use('/api/v2/compliance', specialEdRoutes);          // Module 2
app.use('/api/v2/attendance', attendanceRoutes);         // Module 3
app.use('/api/v2/behavioral', behavioralRoutes);         // Module 4
app.use('/api/v2/reports', academicReportingRoutes);     // Module 5
app.use('/api/v2/scheduling', staffSchedulingRoutes);    // Module 6
app.use('/api/v2/communication', parentCommRoutes);      // Module 7

// ─── Infrastructure Routes ──────────────────────────────────────────
app.use('/api/v2/alerts', alertRoutes);
app.use('/api/v2/audit', auditRoutes);
app.use('/api/v2/health', healthRoutes);

// Legacy health check (backward-compatible)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Event Bus Logging (development) ──────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  eventBus.subscribeAll((event) => {
    console.log(`[Event] ${event.type}:`, JSON.stringify(event.payload).slice(0, 200));
  });
}

// ─── Error Handling ────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ──────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`ATLAS K-12 Education Platform running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Core Systems: Modules 1-7 loaded`);
  console.log(`  Module 1: Student Information Management System`);
  console.log(`  Module 2: Special Education Compliance Engine`);
  console.log(`  Module 3: Attendance Tracking Module`);
  console.log(`  Module 4: Behavioral Management System`);
  console.log(`  Module 5: Academic Performance Reporting`);
  console.log(`  Module 6: Staff Scheduling Coordinator`);
  console.log(`  Module 7: Parent Communication Portal`);
});

export default app;
