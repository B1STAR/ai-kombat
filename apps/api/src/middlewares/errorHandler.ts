/**
 * Global error handler.
 * Catches AppError subclasses and formats JSON responses.
 */
import type { Context } from 'hono';
import { AppError } from '../lib/errors';
import { logger } from '../lib/logger';

export const errorHandler = async (err: Error, c: Context) => {
  if (err instanceof AppError) {
    return c.json({
      error: err.message,
      code: err.code,
    }, err.statusCode as any);
  }
  
  // Zod validation errors
  if (err.name === 'ZodError') {
    return c.json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: (err as any).errors,
    }, 400);
  }
  
  // Unknown error
  logger.error({ err }, 'Unhandled error');
  return c.json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
  }, 500);
};
