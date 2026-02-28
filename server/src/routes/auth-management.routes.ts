import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticateTeacher } from '../middleware/auth';
import { ForbiddenError } from '../utils/errors';
import {
  getActiveSessions,
  terminateSession,
  terminateAllUserSessions,
  cleanExpiredSessions,
  getLoginAttempts,
  getLoginStats,
  getPasswordPolicies,
  createPasswordPolicy,
  updatePasswordPolicy,
  getMfaEnrollments,
  enrollMfa,
  verifyMfa,
  getAuthSummary,
} from '../services/auth-management.service';

const router = Router();

/**
 * GET /api/auth-management/summary
 * Get authentication management overview.
 */
router.get('/summary', authenticateTeacher, async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const summary = await getAuthSummary();
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth-management/sessions
 * List active sessions.
 * Query: userId
 */
router.get('/sessions', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const sessions = await getActiveSessions(req.query.userId as string | undefined);
    res.json(sessions);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/auth-management/sessions/:sessionId/terminate
 * Terminate a session.
 */
router.put('/sessions/:sessionId/terminate', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const session = await terminateSession(req.params.sessionId);
    res.json(session);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth-management/sessions/terminate-all
 * Terminate all sessions for a user.
 * Only allows terminating own sessions or requires admin permission.
 */
router.post('/sessions/terminate-all', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const targetUserId = req.body.userId;
    const requestingTeacherId = req.teacher?.id;

    // Verify that the requesting teacher is either terminating their own sessions
    // or has explicit permission to terminate other users' sessions
    if (targetUserId !== requestingTeacherId) {
      // TODO: Check if teacher has admin permission on auth-management resource
      // For now, prevent any teacher from terminating sessions for other users
      throw new ForbiddenError('You can only terminate your own sessions');
    }

    const result = await terminateAllUserSessions(targetUserId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth-management/sessions/clean-expired
 * Clean up expired sessions.
 */
router.post('/sessions/clean-expired', authenticateTeacher, async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await cleanExpiredSessions();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth-management/login-attempts
 * List login attempts.
 * Query: email, success, limit
 */
router.get('/login-attempts', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const attempts = await getLoginAttempts({
      email: req.query.email as string | undefined,
      success: req.query.success ? req.query.success === 'true' : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    });
    res.json(attempts);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth-management/login-stats
 * Get login attempt statistics.
 */
router.get('/login-stats', authenticateTeacher, async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await getLoginStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth-management/password-policies
 * List password policies.
 */
router.get('/password-policies', authenticateTeacher, async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const policies = await getPasswordPolicies();
    res.json(policies);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth-management/password-policies
 * Create a password policy.
 */
router.post('/password-policies', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const policy = await createPasswordPolicy(req.body);
    res.status(201).json(policy);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/auth-management/password-policies/:policyId
 * Update a password policy.
 */
router.put('/password-policies/:policyId', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const policy = await updatePasswordPolicy(req.params.policyId, req.body);
    res.json(policy);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth-management/mfa
 * List MFA enrollments.
 * Query: userId
 */
router.get('/mfa', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const enrollments = await getMfaEnrollments(req.query.userId as string | undefined);
    res.json(enrollments);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth-management/mfa/enroll
 * Enroll in MFA.
 * Only allows enrolling own MFA or requires admin permission.
 */
router.post('/mfa/enroll', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const targetUserId = req.body.userId;
    const requestingTeacherId = req.teacher?.id;

    // Verify that the requesting teacher is either enrolling their own MFA
    // or has explicit permission to enroll other users in MFA
    if (targetUserId !== requestingTeacherId) {
      // TODO: Check if teacher has admin permission on auth-management resource
      // For now, prevent any teacher from enrolling other users in MFA
      throw new ForbiddenError('You can only enroll yourself in MFA');
    }

    const enrollment = await enrollMfa(targetUserId, req.body.method);
    res.status(201).json(enrollment);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth-management/mfa/verify
 * Verify MFA enrollment.
 * Only allows verifying own MFA or requires admin permission.
 */
router.post('/mfa/verify', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const targetUserId = req.body.userId;
    const requestingTeacherId = req.teacher?.id;

    // Verify that the requesting teacher is either verifying their own MFA
    // or has explicit permission to verify other users' MFA
    if (targetUserId !== requestingTeacherId) {
      // TODO: Check if teacher has admin permission on auth-management resource
      // For now, prevent any teacher from verifying other users' MFA
      throw new ForbiddenError('You can only verify your own MFA enrollment');
    }

    const enrollment = await verifyMfa(targetUserId, req.body.method);
    res.json(enrollment);
  } catch (error) {
    next(error);
  }
});

export default router;
