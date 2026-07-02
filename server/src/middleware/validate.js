import { ApiError } from '../utils/ApiError.js';

/**
 * Validates `req.body` against a Zod schema. On success, replaces req.body with the
 * parsed (and coerced) data. On failure, throws a 400 ApiError with field details.
 */
export const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    return next(ApiError.badRequest('Validation failed', details));
  }
  req.body = result.data;
  next();
};

/** Validates `req.query` against a Zod schema and writes parsed values back. */
export const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    return next(ApiError.badRequest('Invalid query parameters', details));
  }
  req.validatedQuery = result.data;
  next();
};
