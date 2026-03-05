import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { AuthenticatedDistrictRequest, DistrictAdminContext, DistrictAdminRole } from '../types/command';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export async function authenticateDistrictAdmin(
  req: AuthenticatedDistrictRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = authHeader.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as { districtAdminId: string };

    if (!payload.districtAdminId) {
      throw new UnauthorizedError('Invalid token: not a district admin token');
    }

    const admin = await prisma.districtAdmin.findUnique({
      where: { id: payload.districtAdminId },
    });

    if (!admin) {
      throw new UnauthorizedError('District admin not found');
    }

    req.districtAdmin = {
      id: admin.id,
      districtId: admin.districtId,
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      role: admin.role as DistrictAdminRole,
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

export function requireRole(...roles: DistrictAdminRole[]) {
  return (req: AuthenticatedDistrictRequest, _res: Response, next: NextFunction) => {
    if (!req.districtAdmin) {
      return next(new UnauthorizedError('Authentication required'));
    }
    if (!roles.includes(req.districtAdmin.role)) {
      return next(new ForbiddenError(`Access denied: requires role ${roles.join(' or ')}`));
    }
    next();
  };
}

export function generateDistrictToken(districtAdminId: string): string {
  const expiresIn = process.env.JWT_EXPIRY || '8h';
  return jwt.sign({ districtAdminId }, JWT_SECRET, {
    expiresIn: expiresIn as string & jwt.SignOptions['expiresIn'],
  });
}
