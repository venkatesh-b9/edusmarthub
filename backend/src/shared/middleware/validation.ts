import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../utils/validation';

export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = {
        ...req.body,
        ...req.params,
        ...req.query,
      };
      req.body = validate(schema, data);
      next();
    } catch (error) {
      next(error);
    }
  };
};
