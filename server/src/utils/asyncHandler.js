/**
 * Wraps an async route handler so any rejected promise is forwarded to Express'
 * error-handling middleware instead of crashing the process. Removes the need for
 * try/catch in every controller.
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
