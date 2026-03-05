import { Router, Response, NextFunction } from 'express';
import { authenticateDistrictAdmin } from '../middleware/districtAuth';
import { AuthenticatedDistrictRequest } from '../types/command';
import {
  getDisciplineEquityMatrix,
  getMTSSEquityDashboard,
  getSPEDEquityDashboard,
} from '../services/equity.service';

const router = Router();

/**
 * GET /api/command/equity/discipline
 * Get the Discipline Equity Matrix — risk ratios by demographic group.
 */
router.get(
  '/discipline',
  authenticateDistrictAdmin,
  async (req: AuthenticatedDistrictRequest, res: Response, next: NextFunction) => {
    try {
      const matrix = await getDisciplineEquityMatrix(req.districtAdmin!.districtId);
      res.json(matrix);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/command/equity/mtss
 * Get the MTSS Equity Dashboard.
 */
router.get(
  '/mtss',
  authenticateDistrictAdmin,
  async (req: AuthenticatedDistrictRequest, res: Response, next: NextFunction) => {
    try {
      const dashboard = await getMTSSEquityDashboard(req.districtAdmin!.districtId);
      res.json(dashboard);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/command/equity/sped
 * Get the SPED Equity Dashboard.
 */
router.get(
  '/sped',
  authenticateDistrictAdmin,
  async (req: AuthenticatedDistrictRequest, res: Response, next: NextFunction) => {
    try {
      const dashboard = await getSPEDEquityDashboard(req.districtAdmin!.districtId);
      res.json(dashboard);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
