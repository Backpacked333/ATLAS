import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticateTeacher } from '../middleware/auth';
import {
  createTask,
  getTeacherTasks,
  getTaskById,
  updateTaskStatus,
  updateTask,
  getTaskSummary,
} from '../services/task-assignment.service';
import { ValidationError } from '../utils/errors';

const router = Router();

const VALID_CATEGORIES = ['FOLLOW_UP', 'PARENT_CONTACT', 'DOCUMENTATION', 'MEETING', 'INTERVENTION', 'REFERRAL', 'ASSESSMENT', 'OTHER'];
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const VALID_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE'];

/**
 * POST /api/tasks
 * Create a new task.
 */
router.post('/', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, category, priority, assignedToId, studentId, caseId, dueDate } = req.body;

    if (!title || !category) {
      throw new ValidationError('title and category are required');
    }
    if (!VALID_CATEGORIES.includes(category)) {
      throw new ValidationError(`category must be one of: ${VALID_CATEGORIES.join(', ')}`);
    }
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      throw new ValidationError(`priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
    }

    const task = await createTask(req.teacher!.id, req.teacher!.schoolId, {
      title,
      description,
      category,
      priority,
      assignedToId,
      studentId,
      caseId,
      dueDate,
    });

    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tasks
 * Get tasks for the authenticated teacher.
 * Query: status, category, priority, overdueOnly
 */
router.get('/', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const tasks = await getTeacherTasks(req.teacher!.id, {
      status: req.query.status as string | undefined,
      category: req.query.category as string | undefined,
      priority: req.query.priority as string | undefined,
      overdueOnly: req.query.overdueOnly === 'true',
    });
    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tasks/summary
 * Get a summary of task counts for the authenticated teacher.
 */
router.get('/summary', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const summary = await getTaskSummary(req.teacher!.id);
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tasks/:taskId
 * Get a specific task by ID.
 */
router.get('/:taskId', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const task = await getTaskById(req.params.taskId, req.teacher!.id);
    res.json(task);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/tasks/:taskId/status
 * Update the status of a task.
 */
router.put('/:taskId/status', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    if (!status) {
      throw new ValidationError('status is required');
    }
    if (!VALID_STATUSES.includes(status)) {
      throw new ValidationError(`status must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    const task = await updateTaskStatus(req.params.taskId, req.teacher!.id, status);
    res.json(task);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/tasks/:taskId
 * Update a task's details.
 */
router.put('/:taskId', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, priority, assignedToId, dueDate } = req.body;

    if (priority && !VALID_PRIORITIES.includes(priority)) {
      throw new ValidationError(`priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
    }

    const task = await updateTask(req.params.taskId, req.teacher!.id, {
      title,
      description,
      priority,
      assignedToId,
      dueDate,
    });
    res.json(task);
  } catch (error) {
    next(error);
  }
});

export default router;
