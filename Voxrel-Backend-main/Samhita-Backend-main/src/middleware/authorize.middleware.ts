import { NextFunction, Request, Response } from 'express';
import ApiError from '@/utils/api-error.utility.js';
import { UserRole } from '@/types/user.interface.js';

export const authorize = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError(403, 'Insufficient permissions');
    }

    // SUPER ADMIN EXTENSION: Super Admin has access to all routes
    // If the required role is ADMIN, SUPER_ADMIN should also be allowed
    if (req.user.role === UserRole.SUPER_ADMIN) {
      next();
      return;
    }

    // Check if user has the required role
    if (req.user.role !== role) {
      throw new ApiError(403, 'Insufficient permissions');
    }
    next();
  };
};
