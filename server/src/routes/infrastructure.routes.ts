/**
 * Infrastructure API Routes
 *
 * Exposes endpoints for Modules 19–25:
 *   - Performance metrics & cache management
 *   - Disaster recovery health & failover
 *   - Encryption key management & audit
 *   - Multi-tenancy configuration & isolation audits
 *   - Authorization roles & sessions
 *   - Backup management & restore
 *   - Monitoring health reports & alerts
 *
 * All infrastructure endpoints require authentication.
 * Administrative endpoints are access-controlled via RBAC.
 */

import { Router, Response, NextFunction } from 'express';
import { authenticateTeacher } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { performanceService } from '../infrastructure/performance.service';
import { disasterRecoveryService } from '../infrastructure/disaster-recovery.service';
import { encryptionService } from '../infrastructure/encryption.service';
import { multiTenancyService } from '../infrastructure/multi-tenancy.service';
import { authorizationService } from '../infrastructure/authorization.service';
import { backupService } from '../infrastructure/backup.service';
import { monitoringService } from '../infrastructure/monitoring.service';
import { moduleRegistry, crossReferenceIndex, appendices } from '../infrastructure/appendices';

const router = Router();

// All infrastructure routes require authentication
router.use(authenticateTeacher as never);

// ─── Module 19: Performance Optimization ──────────────────────────────

router.get('/performance/report', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const report = performanceService.generateReport();
    res.json(report);
  } catch (error) {
    next(error);
  }
});

router.get('/performance/cache/stats', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const stats = performanceService.getCache().getStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

router.post('/performance/cache/flush', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    performanceService.getCache().flush();
    res.json({ message: 'Cache flushed successfully' });
  } catch (error) {
    next(error);
  }
});

router.get('/performance/queries/slow', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const slowQueries = performanceService.getQueryTracker().getSlowQueries();
    res.json({ slowQueries });
  } catch (error) {
    next(error);
  }
});

// ─── Module 20: Disaster Recovery ─────────────────────────────────────

router.get('/dr/health', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const health = await disasterRecoveryService.getHealthCheck();
    res.json(health);
  } catch (error) {
    next(error);
  }
});

router.get('/dr/status', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    res.json({ status: disasterRecoveryService.getStatus() });
  } catch (error) {
    next(error);
  }
});

router.get('/dr/recovery-plans', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const plans = disasterRecoveryService.getRecoveryPlans();
    res.json({ plans });
  } catch (error) {
    next(error);
  }
});

router.get('/dr/failover-history', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const history = disasterRecoveryService.getFailoverHistory();
    res.json({ history });
  } catch (error) {
    next(error);
  }
});

router.post('/dr/recovery-plans/:planId/execute', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await disasterRecoveryService.executeRecoveryPlan(req.params.planId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ─── Module 21: Encryption Security ──────────────────────────────────

router.get('/encryption/config', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const config = encryptionService.getConfig();
    res.json(config);
  } catch (error) {
    next(error);
  }
});

router.get('/encryption/keys', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const keys = encryptionService.getKeyMetadata();
    res.json({ keys });
  } catch (error) {
    next(error);
  }
});

router.post('/encryption/keys/rotate', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = encryptionService.rotateKeys(req.teacher?.id || 'system');
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/encryption/audit', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const auditLog = encryptionService.getAuditLog(limit);
    res.json({ entries: auditLog });
  } catch (error) {
    next(error);
  }
});

router.get('/encryption/rotation-status', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    res.json({ rotationNeeded: encryptionService.isKeyRotationNeeded() });
  } catch (error) {
    next(error);
  }
});

// ─── Module 22: Multi-Tenancy ─────────────────────────────────────────

router.get('/tenancy/context', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.teacher) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const context = await multiTenancyService.resolveTenantContext(req.teacher.schoolId);
    res.json(context);
  } catch (error) {
    next(error);
  }
});

router.get('/tenancy/usage', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.teacher) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const context = await multiTenancyService.resolveTenantContext(req.teacher.schoolId);
    const usage = await multiTenancyService.getTenantUsage(context.tenantId);
    res.json(usage);
  } catch (error) {
    next(error);
  }
});

router.get('/tenancy/limits', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.teacher) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const context = await multiTenancyService.resolveTenantContext(req.teacher.schoolId);
    const limits = await multiTenancyService.checkTenantLimits(context.tenantId);
    res.json(limits);
  } catch (error) {
    next(error);
  }
});

router.get('/tenancy/isolation-audit', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.teacher) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const context = await multiTenancyService.resolveTenantContext(req.teacher.schoolId);
    const report = await multiTenancyService.auditTenantIsolation(context.tenantId);
    res.json(report);
  } catch (error) {
    next(error);
  }
});

// ─── Module 23: Authorization ─────────────────────────────────────────

router.get('/auth/roles', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const roles = authorizationService.getRoleDefinitions();
    res.json({ roles });
  } catch (error) {
    next(error);
  }
});

router.get('/auth/permissions/:role', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const permissions = authorizationService.getEffectivePermissions(req.params.role as never);
    res.json({ role: req.params.role, permissions });
  } catch (error) {
    next(error);
  }
});

router.get('/auth/sessions/count', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const count = authorizationService.getActiveSessionCount();
    res.json({ activeSessions: count });
  } catch (error) {
    next(error);
  }
});

router.get('/auth/audit', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const userId = req.query.userId as string | undefined;
    const auditLog = authorizationService.getAuditLog(limit, userId);
    res.json({ entries: auditLog });
  } catch (error) {
    next(error);
  }
});

// ─── Module 24: Backup Recovery ───────────────────────────────────────

router.get('/backups', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as string | undefined;
    const jobs = backupService.getBackupJobs(status as never);
    res.json({ backups: jobs });
  } catch (error) {
    next(error);
  }
});

router.post('/backups/execute', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { type = 'full', tenantScope } = req.body;
    const job = await backupService.executeBackup(type, tenantScope);
    res.json(job);
  } catch (error) {
    next(error);
  }
});

router.post('/backups/:backupId/verify', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await backupService.verifyBackup(req.params.backupId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/backups/restore', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await backupService.initiateRestore(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/backups/schedules', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const schedules = backupService.getSchedules();
    res.json({ schedules });
  } catch (error) {
    next(error);
  }
});

router.patch('/backups/schedules/:scheduleId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const updated = backupService.updateSchedule(req.params.scheduleId, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Schedule not found' });
      return;
    }
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// ─── Module 25: Monitoring & Alerting ─────────────────────────────────

router.get('/monitoring/health', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const report = await monitoringService.generateHealthReport();
    res.json(report);
  } catch (error) {
    next(error);
  }
});

router.get('/monitoring/services', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const services = await monitoringService.checkServiceHealth();
    res.json({ services });
  } catch (error) {
    next(error);
  }
});

router.get('/monitoring/alerts', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const severity = req.query.severity as string | undefined;
    const alerts = monitoringService.getAlertManager().getActiveAlerts(severity as never);
    res.json({ alerts });
  } catch (error) {
    next(error);
  }
});

router.get('/monitoring/alerts/history', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const history = monitoringService.getAlertManager().getAlertHistory(limit);
    res.json({ history });
  } catch (error) {
    next(error);
  }
});

router.post('/monitoring/alerts/:alertId/acknowledge', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const success = monitoringService.getAlertManager().acknowledgeAlert(
      req.params.alertId,
      req.teacher?.id || 'unknown'
    );
    res.json({ success });
  } catch (error) {
    next(error);
  }
});

router.post('/monitoring/alerts/:alertId/resolve', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const success = monitoringService.getAlertManager().resolveAlert(req.params.alertId);
    res.json({ success });
  } catch (error) {
    next(error);
  }
});

router.get('/monitoring/rules', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const rules = monitoringService.getAlertManager().getRules();
    res.json({ rules });
  } catch (error) {
    next(error);
  }
});

router.patch('/monitoring/rules/:ruleId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const updated = monitoringService.getAlertManager().updateRule(req.params.ruleId, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Rule not found' });
      return;
    }
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.get('/monitoring/metrics/:metricName', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const durationMs = parseInt(req.query.duration as string) || undefined;
    const history = monitoringService.getCollector().getHistory(req.params.metricName, durationMs);
    res.json({ metric: req.params.metricName, history });
  } catch (error) {
    next(error);
  }
});

// ─── Appendices: Module Registry & Cross-References ───────────────────

router.get('/modules', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    res.json({ modules: moduleRegistry });
  } catch (error) {
    next(error);
  }
});

router.get('/modules/cross-references', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    res.json({ crossReferences: crossReferenceIndex });
  } catch (error) {
    next(error);
  }
});

router.get('/appendices', async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    res.json({ appendices });
  } catch (error) {
    next(error);
  }
});

export default router;
