import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { authenticateTeacher } from '../middleware/auth';
import {
  createRole,
  getRoles,
  getRoleById,
  updateRole,
  deleteRole,
  getPermissions,
  assignPermissionToRole,
  removePermissionFromRole,
  assignRoleToUser,
  removeRoleFromUser,
  getUserRoles,
} from '../services/access-control.service';
import { ValidationError } from '../utils/errors';

const router = Router();

/**
 * GET /api/access-control/roles
 * Get all roles for the school.
 */
router.get('/roles', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const roles = await getRoles(req.teacher!.schoolId);
    res.json(roles);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/access-control/roles
 * Create a new role.
 */
router.post('/roles', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      throw new ValidationError('name is required');
    }
    const role = await createRole(req.teacher!.schoolId, { name, description });
    res.status(201).json(role);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/access-control/roles/:roleId
 * Get a specific role with permissions and assignments.
 */
router.get('/roles/:roleId', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const role = await getRoleById(req.params.roleId, req.teacher!.schoolId);
    res.json(role);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/access-control/roles/:roleId
 * Update a role.
 */
router.put('/roles/:roleId', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;
    const role = await updateRole(req.params.roleId, req.teacher!.schoolId, { name, description });
    res.json(role);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/access-control/roles/:roleId
 * Delete a role (non-system roles only).
 */
router.delete('/roles/:roleId', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await deleteRole(req.params.roleId, req.teacher!.schoolId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/access-control/permissions
 * Get all available permissions.
 */
router.get('/permissions', authenticateTeacher, async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const permissions = await getPermissions();
    res.json(permissions);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/access-control/roles/:roleId/permissions
 * Assign a permission to a role.
 */
router.post('/roles/:roleId/permissions', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { permissionId } = req.body;
    if (!permissionId) {
      throw new ValidationError('permissionId is required');
    }
    const result = await assignPermissionToRole(req.params.roleId, permissionId, req.teacher!.schoolId);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/access-control/roles/:roleId/permissions/:permissionId
 * Remove a permission from a role.
 */
router.delete('/roles/:roleId/permissions/:permissionId', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await removePermissionFromRole(req.params.roleId, req.params.permissionId, req.teacher!.schoolId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/access-control/users/:teacherId/roles
 * Assign a role to a user.
 */
router.post('/users/:teacherId/roles', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { roleId } = req.body;
    if (!roleId) {
      throw new ValidationError('roleId is required');
    }
    const result = await assignRoleToUser(req.params.teacherId, roleId, req.teacher!.schoolId, req.teacher!.id);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/access-control/users/:teacherId/roles/:roleId
 * Remove a role from a user.
 */
router.delete('/users/:teacherId/roles/:roleId', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await removeRoleFromUser(req.params.teacherId, req.params.roleId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/access-control/users/:teacherId/roles
 * Get all roles for a specific user.
 */
router.get('/users/:teacherId/roles', authenticateTeacher, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const roles = await getUserRoles(req.params.teacherId);
    res.json(roles);
  } catch (error) {
    next(error);
  }
});

export default router;
