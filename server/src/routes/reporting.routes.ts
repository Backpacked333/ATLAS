import { Router, Response, NextFunction } from 'express';
import { authenticateDistrictAdmin } from '../middleware/districtAuth';
import { AuthenticatedDistrictRequest } from '../types/command';
import { generateReport, getReportTypes } from '../services/reporting.service';
import { ReportType } from '../types/command';

const router = Router();

/**
 * GET /api/command/reports/types
 * Get available report types and descriptions.
 */
router.get(
  '/types',
  authenticateDistrictAdmin,
  async (_req: AuthenticatedDistrictRequest, res: Response, next: NextFunction) => {
    try {
      const types = getReportTypes();
      res.json(types);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/command/reports/generate
 * Generate a report.
 */
router.post(
  '/generate',
  authenticateDistrictAdmin,
  async (req: AuthenticatedDistrictRequest, res: Response, next: NextFunction) => {
    try {
      const { type, schoolId, startDate, endDate, query } = req.body;
      const report = await generateReport(
        req.districtAdmin!.districtId,
        type as ReportType,
        { schoolId, startDate, endDate, query }
      );
      res.json(report);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
