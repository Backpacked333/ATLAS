import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticateTeacher } from '../middleware/auth';
import {
  getEncryptionKeys,
  createEncryptionKey,
  rotateEncryptionKey,
  revokeEncryptionKey,
  getEncryptedFields,
  registerEncryptedField,
  startSecurityScan,
  getSecurityScans,
  getEncryptionSummary,
} from '../services/encryption.service';

const router = Router();

/**
 * GET /api/encryption/summary
 * Get encryption security overview.
 */
router.get('/summary', authenticateTeacher, async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const summary = await getEncryptionSummary();
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/encryption/keys
 * List encryption keys.
 * Query: purpose, status
 */
router.get('/keys', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const keys = await getEncryptionKeys({
      purpose: req.query.purpose as string | undefined,
      status: req.query.status as string | undefined,
    });
    res.json(keys);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/encryption/keys
 * Create an encryption key.
 */
router.post('/keys', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const key = await createEncryptionKey(req.body);
    res.status(201).json(key);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/encryption/keys/:alias/rotate
 * Rotate an encryption key.
 */
router.post('/keys/:alias/rotate', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const key = await rotateEncryptionKey(req.params.alias, req.body.newAlias);
    res.json(key);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/encryption/keys/:alias/revoke
 * Revoke an encryption key.
 */
router.put('/keys/:alias/revoke', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const key = await revokeEncryptionKey(req.params.alias);
    res.json(key);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/encryption/fields
 * List encrypted fields.
 */
router.get('/fields', authenticateTeacher, async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const fields = await getEncryptedFields();
    res.json(fields);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/encryption/fields
 * Register an encrypted field.
 */
router.post('/fields', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const field = await registerEncryptedField(req.body);
    res.status(201).json(field);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/encryption/scans
 * List security scans.
 * Query: limit
 */
router.get('/scans', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const scans = await getSecurityScans(limit);
    res.json(scans);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/encryption/scans
 * Start a security scan.
 */
router.post('/scans', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const scan = await startSecurityScan(req.body.scanType);
    res.status(201).json(scan);
  } catch (error) {
    next(error);
  }
});

export default router;
