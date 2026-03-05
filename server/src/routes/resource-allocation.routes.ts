import { Router, Response, NextFunction } from 'express';
import { authenticateDistrictAdmin } from '../middleware/districtAuth';
import { AuthenticatedDistrictRequest } from '../types/command';
import {
  getStaffingModel,
  runWhatIfScenario,
  getBudgetOutcomeMapping,
} from '../services/resource-allocation.service';

const router = Router();

/**
 * GET /api/command/resources/staffing
 * Get the Staffing Optimization Model.
 */
router.get(
  '/staffing',
  authenticateDistrictAdmin,
  async (req: AuthenticatedDistrictRequest, res: Response, next: NextFunction) => {
    try {
      const model = await getStaffingModel(req.districtAdmin!.districtId);
      res.json(model);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/command/resources/what-if
 * Run a What-If scenario.
 */
router.post(
  '/what-if',
  authenticateDistrictAdmin,
  async (req: AuthenticatedDistrictRequest, res: Response, next: NextFunction) => {
    try {
      const { scenarioType, params } = req.body;
      const result = await runWhatIfScenario(req.districtAdmin!.districtId, scenarioType, params || {});
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/command/resources/budget
 * Get the Budget-to-Outcome Mapping.
 */
router.get(
  '/budget',
  authenticateDistrictAdmin,
  async (req: AuthenticatedDistrictRequest, res: Response, next: NextFunction) => {
    try {
      const mapping = await getBudgetOutcomeMapping(req.districtAdmin!.districtId);
      res.json(mapping);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
