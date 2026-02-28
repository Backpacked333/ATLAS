import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticateTeacher } from '../middleware/auth';
import {
  recordMetric,
  getMetrics,
  getMetricsSummary,
  checkServiceHealth,
  getServiceHealthHistory,
  getServiceHealthLatest,
  getDashboards,
  getDashboardById,
  createDashboard,
  getMonitoringAlerts,
  createMonitoringAlert,
  getIncidents,
  acknowledgeIncident,
  resolveIncident,
  getMonitoringSummary,
} from '../services/monitoring.service';

const router = Router();

/**
 * GET /api/monitoring/summary
 * Get monitoring overview.
 */
router.get('/summary', authenticateTeacher, async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const summary = await getMonitoringSummary();
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/monitoring/metrics
 * Record a system metric.
 */
router.post('/metrics', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const metric = await recordMetric(req.body);
    res.status(201).json(metric);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/monitoring/metrics
 * Get system metrics.
 * Query: name, host, since, limit
 */
router.get('/metrics', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const metrics = await getMetrics({
      name: req.query.name as string | undefined,
      host: req.query.host as string | undefined,
      since: req.query.since as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    });
    res.json(metrics);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/monitoring/metrics/summary
 * Get metrics summary.
 */
router.get('/metrics/summary', authenticateTeacher, async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const summary = await getMetricsSummary();
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/monitoring/health/:serviceName
 * Check service health.
 */
router.post('/health/:serviceName', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const health = await checkServiceHealth(req.params.serviceName);
    res.json(health);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/monitoring/health
 * Get latest health for all services.
 */
router.get('/health', authenticateTeacher, async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const health = await getServiceHealthLatest();
    res.json(health);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/monitoring/health/:serviceName/history
 * Get health check history for a service.
 */
router.get('/health/:serviceName/history', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const history = await getServiceHealthHistory(req.params.serviceName, limit);
    res.json(history);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/monitoring/dashboards
 * List monitoring dashboards.
 */
router.get('/dashboards', authenticateTeacher, async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const dashboards = await getDashboards();
    res.json(dashboards);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/monitoring/dashboards/:dashboardId
 * Get dashboard details.
 */
router.get('/dashboards/:dashboardId', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const dashboard = await getDashboardById(req.params.dashboardId);
    res.json(dashboard);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/monitoring/dashboards
 * Create a dashboard.
 */
router.post('/dashboards', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const dashboard = await createDashboard(req.body);
    res.status(201).json(dashboard);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/monitoring/alerts
 * List monitoring alerts.
 * Query: isActive
 */
router.get('/alerts', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const alerts = await getMonitoringAlerts(
      req.query.isActive ? req.query.isActive === 'true' : undefined,
    );
    res.json(alerts);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/monitoring/alerts
 * Create a monitoring alert.
 */
router.post('/alerts', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const alert = await createMonitoringAlert(req.body);
    res.status(201).json(alert);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/monitoring/incidents
 * List monitoring incidents.
 * Query: monitoringAlertId, status, limit
 */
router.get('/incidents', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const incidents = await getIncidents({
      monitoringAlertId: req.query.monitoringAlertId as string | undefined,
      status: req.query.status as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    });
    res.json(incidents);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/monitoring/incidents/:incidentId/acknowledge
 * Acknowledge an incident.
 */
router.put('/incidents/:incidentId/acknowledge', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const teacherId = req.teacher!.id;
    const incident = await acknowledgeIncident(req.params.incidentId, teacherId);
    res.json(incident);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/monitoring/incidents/:incidentId/resolve
 * Resolve an incident.
 */
router.put('/incidents/:incidentId/resolve', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const incident = await resolveIncident(req.params.incidentId);
    res.json(incident);
  } catch (error) {
    next(error);
  }
});

export default router;
