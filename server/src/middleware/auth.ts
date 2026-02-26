import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest, TeacherContext } from '../types';
import { UnauthorizedError } from '../utils/errors';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export async function authenticateTeacher(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = authHeader.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as { teacherId: string };

    const teacher = await prisma.teacher.findUnique({
      where: { id: payload.teacherId },
      include: {
        sections: {
          select: { sectionId: true },
        },
      },
    });

    if (!teacher) {
      throw new UnauthorizedError('Teacher not found');
    }

    req.teacher = {
      id: teacher.id,
      schoolId: teacher.schoolId,
      email: teacher.email,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      sectionIds: teacher.sections.map((s) => s.sectionId),
    };

    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      next(new UnauthorizedError('Invalid or expired token'));
    }
  }
}

export function generateToken(teacherId: string): string {
  return jwt.sign({ teacherId }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY || '8h',
  });
}
