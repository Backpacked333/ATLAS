import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticateTeacher } from '../middleware/auth';
import {
  registerDevice,
  getDeviceRegistrations,
  deactivateDevice,
  getMobilePreferences,
  updateMobilePreferences,
} from '../services/mobile-support.service';
import { ValidationError } from '../utils/errors';

const router = Router();

const VALID_PLATFORMS = ['IOS', 'ANDROID', 'WEB'];

/**
 * POST /api/mobile/devices
 * Register a device for push notifications.
 */
router.post('/devices', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { deviceToken, platform, deviceName } = req.body;

    if (!deviceToken || !platform) {
      throw new ValidationError('deviceToken and platform are required');
    }
    if (!VALID_PLATFORMS.includes(platform)) {
      throw new ValidationError(`platform must be one of: ${VALID_PLATFORMS.join(', ')}`);
    }

    const device = await registerDevice(req.teacher!.id, { deviceToken, platform, deviceName });
    res.status(201).json(device);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/mobile/devices
 * Get all registered devices for the authenticated teacher.
 */
router.get('/devices', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const devices = await getDeviceRegistrations(req.teacher!.id);
    res.json(devices);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/mobile/devices/:deviceId/deactivate
 * Deactivate a device registration.
 */
router.put('/devices/:deviceId/deactivate', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const device = await deactivateDevice(req.params.deviceId, req.teacher!.id);
    res.json(device);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/mobile/preferences
 * Get mobile preferences for the authenticated teacher.
 */
router.get('/preferences', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const prefs = await getMobilePreferences(req.teacher!.id);
    res.json(prefs);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/mobile/preferences
 * Update mobile preferences.
 */
router.put('/preferences', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {
      pushNotificationsEnabled, alertSound,
      quietHoursStart, quietHoursEnd,
      dataSaverMode, offlineCacheEnabled,
    } = req.body;

    const prefs = await updateMobilePreferences(req.teacher!.id, {
      pushNotificationsEnabled, alertSound,
      quietHoursStart, quietHoursEnd,
      dataSaverMode, offlineCacheEnabled,
    });
    res.json(prefs);
  } catch (error) {
    next(error);
  }
});

export default router;
