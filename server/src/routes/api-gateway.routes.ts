import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticateTeacher } from '../middleware/auth';
import {
  createApiKey,
  getApiKeys,
  revokeApiKey,
  updateApiKey,
  getApiRequestStats,
} from '../services/api-gateway.service';
import { ValidationError } from '../utils/errors';

const router = Router();

/**
 * POST /api/gateway/keys
 * Create a new API key.
 */
router.post('/keys', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, scopes, expiresAt, rateLimitPerMinute } = req.body;

    if (!name || !scopes) {
      throw new ValidationError('name and scopes are required');
    }

    const key = await createApiKey(req.teacher!.schoolId, {
      name, scopes, expiresAt, rateLimitPerMinute,
    });
    res.status(201).json(key);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/gateway/keys
 * Get all API keys for the school (keys are masked).
 */
router.get('/keys', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const keys = await getApiKeys(req.teacher!.schoolId);
    res.json(keys);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/gateway/keys/:keyId
 * Update an API key.
 */
router.put('/keys/:keyId', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, scopes, rateLimitPerMinute, isActive } = req.body;
    const key = await updateApiKey(req.params.keyId, req.teacher!.schoolId, {
      name, scopes, rateLimitPerMinute, isActive,
    });
    res.json(key);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/gateway/keys/:keyId/revoke
 * Revoke an API key.
 */
router.put('/keys/:keyId/revoke', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const key = await revokeApiKey(req.params.keyId, req.teacher!.schoolId);
    res.json(key);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/gateway/stats
 * Get API request statistics.
 */
router.get('/stats', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await getApiRequestStats(req.teacher!.schoolId);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

export default router;
