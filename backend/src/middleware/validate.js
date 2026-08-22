import { ApiError } from '../utils/ApiError.js';

/**
 * Validates req[source] against a zod schema, replacing it with the parsed
 * (and coerced/defaulted) value on success.
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      return next(ApiError.badRequest('Validation failed', details));
    }
    req[source] = result.data;
    next();
  };
}
