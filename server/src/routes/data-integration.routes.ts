import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticateTeacher } from '../middleware/auth';
import {
  createConnector,
  getConnectors,
  getConnectorById,
  updateConnector,
  startSync,
  getSyncLogs,
  getIntegrationSummary,
} from '../services/data-integration.service';
import { ValidationError } from '../utils/errors';

const router = Router();

const VALID_TYPES = ['SIS', 'LMS', 'ASSESSMENT', 'IDENTITY', 'COMMUNICATION'];
const VALID_DIRECTIONS = ['INBOUND', 'OUTBOUND', 'BIDIRECTIONAL'];

/**
 * GET /api/integrations/summary
 * Get integration overview for the school.
 */
router.get('/summary', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const summary = await getIntegrationSummary(req.teacher!.schoolId);
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/integrations/connectors
 * Create a new integration connector.
 */
router.post('/connectors', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, provider, type, config } = req.body;

    if (!name || !provider || !type || !config) {
      throw new ValidationError('name, provider, type, and config are required');
    }
    if (!VALID_TYPES.includes(type)) {
      throw new ValidationError(`type must be one of: ${VALID_TYPES.join(', ')}`);
    }

    const connector = await createConnector(req.teacher!.schoolId, { name, provider, type, config });
    res.status(201).json(connector);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/integrations/connectors
 * Get all connectors for the school.
 * Query: type, isActive
 */
router.get('/connectors', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const connectors = await getConnectors(req.teacher!.schoolId, {
      type: req.query.type as string | undefined,
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
    });
    res.json(connectors);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/integrations/connectors/:connectorId
 * Get a specific connector with recent sync logs.
 */
router.get('/connectors/:connectorId', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const connector = await getConnectorById(req.params.connectorId, req.teacher!.schoolId);
    res.json(connector);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/integrations/connectors/:connectorId
 * Update a connector's settings.
 */
router.put('/connectors/:connectorId', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, config, isActive } = req.body;

    const connector = await updateConnector(req.params.connectorId, req.teacher!.schoolId, {
      name,
      config,
      isActive,
    });
    res.json(connector);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/integrations/connectors/:connectorId/sync
 * Start a new sync for a connector.
 */
router.post('/connectors/:connectorId/sync', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { direction, entityType } = req.body;

    if (!direction || !entityType) {
      throw new ValidationError('direction and entityType are required');
    }
    if (!VALID_DIRECTIONS.includes(direction)) {
      throw new ValidationError(`direction must be one of: ${VALID_DIRECTIONS.join(', ')}`);
    }

    const syncLog = await startSync(req.params.connectorId, req.teacher!.schoolId, {
      direction,
      entityType,
    });
    res.status(201).json(syncLog);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/integrations/connectors/:connectorId/sync-logs
 * Get sync logs for a connector.
 * Query: status, limit
 */
router.get('/connectors/:connectorId/sync-logs', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const logs = await getSyncLogs(req.params.connectorId, req.teacher!.schoolId, {
      status: req.query.status as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    });
    res.json(logs);
  } catch (error) {
    next(error);
  }
});

export default router;
