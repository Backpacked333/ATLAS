import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { generateToken } from '../middleware/auth';
import { ValidationError, UnauthorizedError } from '../utils/errors';

const router = Router();

/**
 * POST /api/auth/login
 * Development login endpoint. In production, this would be replaced by SSO callback.
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) throw new ValidationError('Email is required');

    const teacher = await prisma.teacher.findUnique({
      where: { email },
    });

    if (!teacher) throw new UnauthorizedError('Teacher not found');

    const token = generateToken(teacher.id);
    res.json({
      token,
      teacher: {
        id: teacher.id,
        email: teacher.email,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        schoolId: teacher.schoolId,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/sso/callback
 * SSO callback endpoint (Google Workspace, Azure AD, Clever)
 */
router.post('/sso/callback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ssoProviderId, email, firstName, lastName } = req.body;
    if (!ssoProviderId || !email) {
      throw new ValidationError('SSO provider ID and email are required');
    }

    let teacher = await prisma.teacher.findUnique({
      where: { ssoProviderId },
    });

    if (!teacher) {
      teacher = await prisma.teacher.findUnique({
        where: { email },
      });

      if (teacher) {
        // Link SSO to existing teacher
        teacher = await prisma.teacher.update({
          where: { id: teacher.id },
          data: { ssoProviderId },
        });
      }
    }

    if (!teacher) {
      throw new UnauthorizedError('No teacher account found for this SSO identity');
    }

    const token = generateToken(teacher.id);
    res.json({
      token,
      teacher: {
        id: teacher.id,
        email: teacher.email,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        schoolId: teacher.schoolId,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get current teacher profile
 */
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError();
    }

    const jwt = await import('jsonwebtoken');
    const token = authHeader.slice(7);
    const payload = jwt.default.verify(
      token,
      process.env.JWT_SECRET || 'dev-secret-change-in-production'
    ) as { teacherId: string };

    const teacher = await prisma.teacher.findUnique({
      where: { id: payload.teacherId },
      include: {
        school: { select: { name: true, districtId: true } },
        sections: {
          include: {
            section: { select: { id: true, courseName: true, period: true } },
          },
        },
      },
    });

    if (!teacher) throw new UnauthorizedError('Teacher not found');

    res.json({
      id: teacher.id,
      email: teacher.email,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      photoUrl: teacher.photoUrl,
      school: teacher.school,
      sections: teacher.sections.map((ts) => ts.section),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
