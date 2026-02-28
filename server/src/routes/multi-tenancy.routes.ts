import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticateTeacher } from '../middleware/auth';
import {
  getTenants,
  getTenantById,
  createTenant,
  updateTenantStatus,
  updateTenantTier,
  getResourceQuotas,
  setResourceQuota,
  getDataPartitions,
  getTenancySummary,
} from '../services/multi-tenancy.service';

const router = Router();

/**
 * GET /api/tenants/summary
 * Get multi-tenancy overview.
 */
router.get('/summary', authenticateTeacher, async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const summary = await getTenancySummary();
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tenants
 * List tenants.
 * Query: status, tier
 */
router.get('/', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const tenants = await getTenants({
      status: req.query.status as string | undefined,
      tier: req.query.tier as string | undefined,
    });
    res.json(tenants);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tenants/:tenantId
 * Get tenant details.
 */
router.get('/:tenantId', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const tenant = await getTenantById(req.params.tenantId);
    res.json(tenant);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/tenants
 * Create a tenant.
 */
router.post('/', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const tenant = await createTenant(req.body);
    res.status(201).json(tenant);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/tenants/:tenantId/status
 * Update tenant status.
 */
router.put('/:tenantId/status', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const tenant = await updateTenantStatus(req.params.tenantId, req.body.status);
    res.json(tenant);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/tenants/:tenantId/tier
 * Update tenant tier.
 */
router.put('/:tenantId/tier', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const tenant = await updateTenantTier(
      req.params.tenantId,
      req.body.tier,
      req.body.maxUsers,
      req.body.maxStorage,
    );
    res.json(tenant);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tenants/:tenantId/quotas
 * Get tenant resource quotas.
 */
router.get('/:tenantId/quotas', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const quotas = await getResourceQuotas(req.params.tenantId);
    res.json(quotas);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/tenants/:tenantId/quotas
 * Set a resource quota for a tenant.
 */
router.post('/:tenantId/quotas', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const quota = await setResourceQuota(req.params.tenantId, req.body);
    res.json(quota);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tenants/data/partitions
 * Get data partitions.
 * Query: tenantId
 */
router.get('/data/partitions', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const partitions = await getDataPartitions(req.query.tenantId as string | undefined);
    res.json(partitions);
  } catch (error) {
    next(error);
  }
});

export default router;
