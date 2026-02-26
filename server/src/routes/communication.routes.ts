import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest, CreateParentContactInput } from '../types';
import { authenticateTeacher } from '../middleware/auth';
import { verifyStudentAccess } from '../middleware/ferpa';
import {
  createParentContact,
  getParentContacts,
  getPositiveContactSuggestions,
  getConferencePrepKit,
} from '../services/communication.service';
import { ValidationError } from '../utils/errors';

const router = Router();

const VALID_METHODS = ['EMAIL', 'PHONE', 'IN_PERSON', 'OTHER'];
const VALID_SENTIMENTS = ['POSITIVE', 'NEUTRAL', 'CONCERN'];

/**
 * POST /api/communication/contact
 * Log a parent contact.
 */
router.post(
  '/contact',
  authenticateTeacher,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const input = req.body as CreateParentContactInput;

      if (!input.studentId || !input.method || !input.subject || !input.notes) {
        throw new ValidationError('studentId, method, subject, and notes are required');
      }
      if (!VALID_METHODS.includes(input.method)) {
        throw new ValidationError(`method must be one of: ${VALID_METHODS.join(', ')}`);
      }
      if (input.sentiment && !VALID_SENTIMENTS.includes(input.sentiment)) {
        throw new ValidationError(`sentiment must be one of: ${VALID_SENTIMENTS.join(', ')}`);
      }

      const { teacherHasStudentAccess } = await import('../middleware/ferpa');
      const hasAccess = await teacherHasStudentAccess(req.teacher!.id, input.studentId);
      if (!hasAccess) {
        throw new ValidationError('You do not have access to this student');
      }

      const contact = await createParentContact(req.teacher!.id, input);
      res.status(201).json(contact);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/communication/contacts
 * Get all parent contacts for this teacher.
 */
router.get(
  '/contacts',
  authenticateTeacher,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const contacts = await getParentContacts(req.teacher!.id);
      res.json(
        contacts.map((c) => ({
          id: c.id,
          studentId: c.studentId,
          studentName: `${c.student.firstName} ${c.student.lastName}`,
          method: c.method,
          subject: c.subject,
          notes: c.notes,
          sentiment: c.sentiment,
          createdAt: c.createdAt.toISOString(),
        }))
      );
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/communication/positive-suggestions
 * Get weekly positive contact suggestions (Section 4.7.2).
 */
router.get(
  '/positive-suggestions',
  authenticateTeacher,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const suggestions = await getPositiveContactSuggestions(req.teacher!.id);
      res.json(suggestions);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/communication/conference-prep/:studentId
 * Generate a Parent Conference Prep Kit (Section 4.7.3).
 */
router.get(
  '/conference-prep/:studentId',
  authenticateTeacher,
  verifyStudentAccess,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const kit = await getConferencePrepKit(req.teacher!.id, req.params.studentId as string);
      res.json(kit);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
