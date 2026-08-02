/**
 * Custom Error Classes
 *
 * Standardized error handling for the application
 */

class AppError extends Error {
  /**
   * Create a new application error
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {boolean} isOperational - Whether the error is operational
   * @param {string} [code] - Custom error code
   */
  constructor(message, statusCode, isOperational = true, code = null) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  /**
   * Create a validation error
   * @param {string} message - Error message
   * @param {Array} errors - Array of validation errors
   */
  constructor(message = 'Validation Error', errors = []) {
    super(message, 400, true, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

class NotFoundError extends AppError {
  /**
   * Create a not found error
   * @param {string} message - Error message
   * @param {string} [resource] - Resource that was not found
   */
  constructor(message = 'Not Found', resource = null) {
    super(message, 404, true, 'NOT_FOUND');
    this.resource = resource;
  }
}

class UnauthorizedError extends AppError {
  /**
   * Create an unauthorized error
   * @param {string} message - Error message
   * @param {string} [reason] - Reason for unauthorized access
   */
  constructor(message = 'Unauthorized', reason = null) {
    super(message, 401, true, 'UNAUTHORIZED');
    this.reason = reason;
  }
}

class ForbiddenError extends AppError {
  /**
   * Create a forbidden error
   * @param {string} message - Error message
   * @param {string} [permission] - Missing permission
   */
  constructor(message = 'Forbidden', permission = null) {
    super(message, 403, true, 'FORBIDDEN');
    this.permission = permission;
  }
}

class ConflictError extends AppError {
  /**
   * Create a conflict error
   * @param {string} message - Error message
   * @param {string} [field] - Field that caused the conflict
   */
  constructor(message = 'Conflict', field = null) {
    super(message, 409, true, 'CONFLICT');
    this.field = field;
  }
}

/**
 * Handle Prisma errors and convert them to AppError instances
 * @param {Error} error - Prisma error
 * @returns {AppError} Converted application error
 */
function handlePrismaError(error) {
  if (error.code) {
    switch (error.code) {
      case 'P2002': // Unique constraint violation
        return new ConflictError(
          `Duplicate entry: ${error.meta?.target?.join(', ')} already exists`,
          error.meta?.target?.[0]
        );
      case 'P2025': // Record not found
        return new NotFoundError(
          error.meta?.cause || 'Resource not found'
        );
      case 'P2003': // Foreign key constraint violation
        return new ConflictError(
          `Cannot delete: related records exist`
        );
      case 'P2000': // Value too long
        return new ValidationError(
          `Value too long for field: ${error.meta?.column_name}`
        );
      default:
        return new AppError(
          error.message || 'Database error',
          500,
          false,
          error.code
        );
    }
  }
  return new AppError(error.message || 'Database error', 500, false);
}

/**
 * Handle Zod validation errors
 * @param {Object} error - Zod error
 * @returns {ValidationError} Validation error with details
 */
function handleZodError(error) {
  const errors = error.errors.map(err => ({
    path: err.path.join('.'),
    message: err.message,
    code: err.code
  }));

  return new ValidationError('Validation failed', errors);
}

/**
 * Create an error response object
 * @param {Error} error - Error to format
 * @returns {Object} Formatted error response in { error: { code, message, details? } } format
 */
function formatErrorResponse(error) {
  if (error instanceof AppError) {
    return {
      error: {
        code: error.code || 'APP_ERROR',
        message: error.message,
        ...(error.errors && { details: error.errors }),
      },
    };
  }

  // Handle non-AppError instances
  return {
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error.message || 'An unexpected error occurred',
    },
  };
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  handlePrismaError,
  handleZodError,
  formatErrorResponse
};