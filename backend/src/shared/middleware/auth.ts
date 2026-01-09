import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload, Permission, UserRole } from '../types';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import logger from '../utils/logger';

// Re-export for convenience
export { Permission, UserRole };

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      logger.error('JWT_SECRET is not configured');
      throw new Error('Server configuration error');
    }

    try {
      const decoded = jwt.verify(token, secret) as JwtPayload;
      req.user = decoded;
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid token');
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

export const authorize = (...permissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const userPermissions = req.user.permissions || [];
      const hasPermission = permissions.some((permission) =>
        userPermissions.includes(permission)
      );

      if (!hasPermission) {
        throw new ForbiddenError('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      if (!roles.includes(req.user.role)) {
        throw new ForbiddenError('Insufficient role privileges');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireSchool = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    // Super admin can access all schools
    if (req.user.role === UserRole.SUPER_ADMIN) {
      return next();
    }

    // Other roles must have a schoolId
    if (!req.user.schoolId) {
      throw new ForbiddenError('School context required');
    }

    // If request has schoolId param, verify it matches user's school
    const requestedSchoolId = req.params.schoolId || req.body.schoolId;
    if (requestedSchoolId && requestedSchoolId !== req.user.schoolId) {
      throw new ForbiddenError('Access denied to this school');
    }

    next();
  } catch (error) {
    next(error);
  }
};
