import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for standard authentication endpoints (login, register)
 * Max 100 requests per 15 minutes per IP (disabled in test mode)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 10000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
  },
  skip: () => process.env.NODE_ENV === 'test'
});

/**
 * Stricter rate limiter for staff invitation activation and resending
 * Max 30 attempts per 15 minutes per IP (disabled in test mode)
 */
export const invitationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 10000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many activation or invitation requests. Please try again after 15 minutes.'
  },
  skip: () => process.env.NODE_ENV === 'test'
});
