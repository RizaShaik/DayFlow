import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { isProduction } from '../config/env.js';

export function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const isApiError = err instanceof ApiError;
  const statusCode = isApiError ? err.statusCode : 500;
  const message = isApiError ? err.message : 'Something went wrong';

  if (statusCode >= 500) {
    logger.error(err.stack || err.message);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(err.details ? { details: err.details } : {}),
      ...(!isProduction && !isApiError ? { stack: err.stack } : {}),
    },
  });
}
