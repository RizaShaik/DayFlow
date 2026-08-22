import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { isProduction } from '../config/env.js';

export function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const isApiError = err instanceof ApiError;
  const isMulterError = err instanceof multer.MulterError;
  const statusCode = isApiError ? err.statusCode : isMulterError ? 400 : 500;
  const message = isApiError ? err.message : isMulterError ? err.message : 'Something went wrong';

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
