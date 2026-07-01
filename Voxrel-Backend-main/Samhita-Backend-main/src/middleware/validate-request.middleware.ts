import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import ApiError from '@/utils/api-error.utility.js';

export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch {
      throw new ApiError(400, 'Validation error');
    }
  };
};
