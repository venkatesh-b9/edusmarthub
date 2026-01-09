import rateLimit from 'express-rate-limit';
import { RateLimitError } from '../utils/errors';

export const createRateLimiter = (
  windowMs: number,
  maxRequests: number,
  message?: string
) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    message: message || 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      throw new RateLimitError(
        message || 'Too many requests, please try again later'
      );
    },
  });
};

// Pre-configured rate limiters
export const generalLimiter = createRateLimiter(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
);

export const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 requests per window
  'Too many authentication attempts, please try again later'
);

export const strictLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  10, // 10 requests per hour
  'Too many requests, please try again in an hour'
);
