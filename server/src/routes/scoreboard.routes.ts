import { Router, Response, NextFunction } from 'express';
import { authenticateDistrictAdmin } from '../middleware/districtAuth';
import { AuthenticatedDistrictRequest } from '../types/command';
import { getScoreboard, getSchoolDeepDive } from '../services/scoreboard.service';

const router = Router();

/**
 * GET /api/command/scoreboard
 * Get the School Health Scoreboard — all schools side-by-side on key metrics.
 */
router.get(
  '/',
  authenticateDistrictAdmin,
  async (req: AuthenticatedDistrictRequest, res: Response, next: NextFunction) => {
    try {
      const scoreboard = await getScoreboard(req.districtAdmin!.districtId);
      res.json(scoreboard);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/command/scoreboard/schools/:schoolId
 * Get comprehensive School Deep Dive profile.
 */
router.get(
  '/schools/:schoolId',
  authenticateDistrictAdmin,
  async (req: AuthenticatedDistrictRequest, res: Response, next: NextFunction) => {
    try {
      const deepDive = await getSchoolDeepDive(req.params.schoolId as string);
      res.json(deepDive);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
