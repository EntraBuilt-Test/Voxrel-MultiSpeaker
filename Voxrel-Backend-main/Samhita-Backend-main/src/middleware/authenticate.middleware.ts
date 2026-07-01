import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import ApiError from '@/utils/api-error.utility.js';
import { IUser } from '@/types/user.interface.js';
import { appconfig } from '@/config/config.js';

interface JwtPayload {
  _id: string;
  email: string;
  role: string;
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new ApiError(401, 'Access token is required');
    }

    const decoded = jwt.verify(token, appconfig.jwt.secret) as JwtPayload;
    req.user = decoded as unknown as IUser;
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    throw new ApiError(401, 'Invalid or expired token');
  }
};
