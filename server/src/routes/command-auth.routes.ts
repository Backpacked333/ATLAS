import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { generateDistrictToken } from '../middleware/districtAuth';
import { authenticateDistrictAdmin } from '../middleware/districtAuth';
import { AuthenticatedDistrictRequest } from '../types/command';
import { UnauthorizedError } from '../utils/errors';

const router = Router();

/**
 * POST /api/command/auth/login
 * Dev login for district admins (email-only, no password in dev mode).
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new UnauthorizedError('Email is required');
    }

    const admin = await prisma.districtAdmin.findUnique({
      where: { email },
      include: { district: { select: { name: true } } },
    });

    if (!admin) {
      throw new UnauthorizedError('District admin not found');
    }

    const token = generateDistrictToken(admin.id);

    res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
        districtId: admin.districtId,
        district: admin.district,
        photoUrl: admin.photoUrl,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/command/auth/me
 * Get the current district admin's profile.
 */
router.get(
  '/me',
  authenticateDistrictAdmin,
  async (req: AuthenticatedDistrictRequest, res: Response, next: NextFunction) => {
    try {
      const admin = await prisma.districtAdmin.findUniqueOrThrow({
        where: { id: req.districtAdmin!.id },
        include: { district: { select: { name: true } } },
      });

      res.json({
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
        districtId: admin.districtId,
        district: admin.district,
        photoUrl: admin.photoUrl,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
