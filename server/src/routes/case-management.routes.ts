import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticateTeacher } from '../middleware/auth';
import {
  createCase,
  getCaseById,
  getTeacherCases,
  updateCaseStatus,
  addCaseNote,
  assignCase,
} from '../services/case-management.service';
import { ValidationError } from '../utils/errors';

const router = Router();

const VALID_TYPES = ['ACADEMIC', 'BEHAVIORAL', 'ATTENDANCE', 'SOCIAL_EMOTIONAL', 'SST', 'HEALTH', 'OTHER'];
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const VALID_STATUSES = ['OPEN', 'IN_PROGRESS', 'PENDING_REVIEW', 'ESCALATED', 'RESOLVED', 'CLOSED'];

/**
 * POST /api/cases
 * Create a new case for a student.
 */
router.post('/', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { studentId, type, priority, title, description, assignedToId } = req.body;

    if (!studentId || !type || !title || !description) {
      throw new ValidationError('studentId, type, title, and description are required');
    }
    if (!VALID_TYPES.includes(type)) {
      throw new ValidationError(`type must be one of: ${VALID_TYPES.join(', ')}`);
    }
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      throw new ValidationError(`priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
    }

    const { teacherHasStudentAccess } = await import('../middleware/ferpa');
    const hasAccess = await teacherHasStudentAccess(req.teacher!.id, studentId);
    if (!hasAccess) {
      throw new ValidationError('You do not have access to this student');
    }

    const newCase = await createCase(req.teacher!.id, req.teacher!.schoolId, {
      studentId,
      type,
      priority,
      title,
      description,
      assignedToId,
    });

    res.status(201).json(newCase);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/cases
 * Get cases for the authenticated teacher (created by or assigned to).
 */
router.get('/', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const cases = await getTeacherCases(req.teacher!.id);
    res.json(cases);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/cases/:caseId
 * Get a specific case by ID.
 */
router.get('/:caseId', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const found = await getCaseById(req.params.caseId, req.teacher!.schoolId);
    res.json(found);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/cases/:caseId/status
 * Update the status of a case.
 */
router.put('/:caseId/status', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status, resolution } = req.body;
    if (!status) {
      throw new ValidationError('status is required');
    }
    if (!VALID_STATUSES.includes(status)) {
      throw new ValidationError(`status must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    const updated = await updateCaseStatus(
      req.params.caseId,
      req.teacher!.schoolId,
      req.teacher!.id,
      status,
      resolution
    );
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/cases/:caseId/notes
 * Add a note to a case.
 */
router.post('/:caseId/notes', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { content } = req.body;
    if (!content || content.length < 5) {
      throw new ValidationError('Note content must be at least 5 characters');
    }

    const note = await addCaseNote(
      req.params.caseId,
      req.teacher!.schoolId,
      req.teacher!.id,
      content
    );
    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/cases/:caseId/assign
 * Assign a case to a different teacher.
 */
router.put('/:caseId/assign', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { assignedToId } = req.body;
    if (!assignedToId) {
      throw new ValidationError('assignedToId is required');
    }

    const updated = await assignCase(
      req.params.caseId,
      req.teacher!.schoolId,
      req.teacher!.id,
      assignedToId
    );
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

export default router;
