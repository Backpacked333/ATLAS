import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest, RosterFilters } from '../types';
import { authenticateTeacher } from '../middleware/auth';
import { getRoster, searchRoster } from '../services/roster.service';

const router = Router();

/**
 * GET /api/roster
 * Get the teacher's full student roster with optional filters.
 *
 * Query params:
 *   search - search students by name (for global search)
 *   sectionId - filter to specific section
 *   gradeStatus - all | passing | failing | declining
 *   attendance - all | chronic | at-risk
 *   flags - comma-separated: ell,iep,504,tier2,tier3
 *   missingWork - any | 3+ | 5+
 */
router.get('/', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Quick search mode: return minimal student data for search bar
    const search = req.query.search as string | undefined;
    if (search && search.trim().length > 0) {
      const results = await searchRoster(req.teacher!.id, search.trim());
      res.json(results);
      return;
    }

    const filters: RosterFilters = {
      sectionId: req.query.sectionId as string | undefined,
      gradeStatus: (req.query.gradeStatus as RosterFilters['gradeStatus']) || 'all',
      attendance: (req.query.attendance as RosterFilters['attendance']) || 'all',
      flags: req.query.flags
        ? (req.query.flags as string).split(',') as RosterFilters['flags']
        : undefined,
      missingWork: req.query.missingWork as RosterFilters['missingWork'],
    };

    const roster = await getRoster(req.teacher!.id, filters);
    res.json(roster);
  } catch (error) {
    next(error);
  }
});

export default router;
