import { ApiError } from '../utils/ApiError.js';

/**
 * Restricts a route to the given roles. Must run after `authenticate`.
 * Usage: router.get('/', authenticate, authorize('admin', 'hr'), handler)
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }
    next();
  };
}
