// مسیر فایل: backend/src/utils/error.test.js
// =============================================================
// Unit tests — custom error classes + Prisma/Zod error translation
// + the formatErrorResponse envelope used by the global error
// handler plugin. High-value target: every controller in the app
// throws AppError subclasses and relies on this file to turn them
// into the right HTTP status/body, and handlePrismaError is the
// single place that decides whether a raw Prisma error becomes a
// 409 (constraint), 404 (not found), 400 (validation) or a generic
// 500 — get one of those branches wrong and a whole class of DB
// errors reports the wrong status code app-wide.
//
// Run with:  node --test
// =============================================================

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  handlePrismaError,
  handleZodError,
  formatErrorResponse,
} = require('./error');

// ── AppError base class ──────────────────────────────────────

test('AppError: sets message, statusCode, isOperational, code, and an ISO timestamp', () => {
  const err = new AppError('Something broke', 500, false, 'BOOM');
  assert.equal(err.message, 'Something broke');
  assert.equal(err.statusCode, 500);
  assert.equal(err.isOperational, false);
  assert.equal(err.code, 'BOOM');
  assert.ok(err instanceof Error);
  assert.doesNotThrow(() => new Date(err.timestamp).toISOString());
});

test('AppError: status is "fail" for 4xx and "error" for anything else', () => {
  assert.equal(new AppError('x', 400).status, 'fail');
  assert.equal(new AppError('x', 404).status, 'fail');
  assert.equal(new AppError('x', 499).status, 'fail');
  assert.equal(new AppError('x', 500).status, 'error');
  assert.equal(new AppError('x', 300).status, 'error');
});

test('AppError: isOperational defaults to true, code defaults to null', () => {
  const err = new AppError('x', 400);
  assert.equal(err.isOperational, true);
  assert.equal(err.code, null);
});

// ── Subclasses — status code + default code + default message ──

test('ValidationError: 400, code=VALIDATION_ERROR, carries an errors[] array', () => {
  const err = new ValidationError('Bad input', [{ path: 'email', message: 'required' }]);
  assert.equal(err.statusCode, 400);
  assert.equal(err.code, 'VALIDATION_ERROR');
  assert.deepEqual(err.errors, [{ path: 'email', message: 'required' }]);
});

test('ValidationError: defaults to an empty errors[] array and a generic message', () => {
  const err = new ValidationError();
  assert.equal(err.message, 'Validation Error');
  assert.deepEqual(err.errors, []);
});

test('NotFoundError: 404, code=NOT_FOUND, carries an optional resource label', () => {
  const err = new NotFoundError('Company not found', 'Company');
  assert.equal(err.statusCode, 404);
  assert.equal(err.code, 'NOT_FOUND');
  assert.equal(err.resource, 'Company');
});

test('UnauthorizedError: 401, code=UNAUTHORIZED', () => {
  const err = new UnauthorizedError('Bad token', 'expired');
  assert.equal(err.statusCode, 401);
  assert.equal(err.code, 'UNAUTHORIZED');
  assert.equal(err.reason, 'expired');
});

test('ForbiddenError: 403, code=FORBIDDEN', () => {
  const err = new ForbiddenError('No access', 'companies.delete');
  assert.equal(err.statusCode, 403);
  assert.equal(err.code, 'FORBIDDEN');
  assert.equal(err.permission, 'companies.delete');
});

test('ConflictError: 409, code=CONFLICT', () => {
  const err = new ConflictError('Duplicate', 'email');
  assert.equal(err.statusCode, 409);
  assert.equal(err.code, 'CONFLICT');
  assert.equal(err.field, 'email');
});

// ── handlePrismaError ─────────────────────────────────────────

test('handlePrismaError: P2002 (unique constraint) -> ConflictError naming the target field', () => {
  const result = handlePrismaError({ code: 'P2002', meta: { target: ['email'] } });
  assert.ok(result instanceof ConflictError);
  assert.equal(result.statusCode, 409);
  assert.match(result.message, /email/);
  assert.equal(result.field, 'email');
});

test('handlePrismaError: P2002 with a multi-column composite key joins all target fields', () => {
  const result = handlePrismaError({ code: 'P2002', meta: { target: ['companyId', 'sku'] } });
  assert.match(result.message, /companyId, sku/);
});

test('handlePrismaError: P2025 (record not found) -> NotFoundError, using meta.cause when present', () => {
  const result = handlePrismaError({ code: 'P2025', meta: { cause: 'Company does not exist' } });
  assert.ok(result instanceof NotFoundError);
  assert.equal(result.message, 'Company does not exist');
});

test('handlePrismaError: P2025 without meta.cause falls back to a generic message', () => {
  const result = handlePrismaError({ code: 'P2025' });
  assert.equal(result.message, 'Resource not found');
});

test('handlePrismaError: P2003 (foreign key violation) -> ConflictError', () => {
  const result = handlePrismaError({ code: 'P2003' });
  assert.ok(result instanceof ConflictError);
  assert.equal(result.statusCode, 409);
});

test('handlePrismaError: P2000 (value too long) -> ValidationError naming the column', () => {
  const result = handlePrismaError({ code: 'P2000', meta: { column_name: 'description' } });
  assert.ok(result instanceof ValidationError);
  assert.match(result.message, /description/);
});

test('handlePrismaError: an unrecognized Prisma error code -> generic 500 AppError, not operational, preserving the code', () => {
  const result = handlePrismaError({ code: 'P9999', message: 'weird db error' });
  assert.equal(result.statusCode, 500);
  assert.equal(result.isOperational, false);
  assert.equal(result.code, 'P9999');
  assert.equal(result.message, 'weird db error');
});

test('handlePrismaError: an error with no .code at all -> generic 500 AppError', () => {
  const result = handlePrismaError({ message: 'connection refused' });
  assert.equal(result.statusCode, 500);
  assert.equal(result.message, 'connection refused');
});

test('handlePrismaError: an error with no .code and no .message falls back to "Database error"', () => {
  const result = handlePrismaError({});
  assert.equal(result.message, 'Database error');
});

// ── handleZodError ────────────────────────────────────────────

test('handleZodError: maps each Zod issue to {path, message, code} and wraps as a ValidationError', () => {
  const zodLikeError = {
    errors: [
      { path: ['email'], message: 'Invalid email', code: 'invalid_string' },
      { path: ['address', 'city'], message: 'Required', code: 'invalid_type' },
    ],
  };
  const result = handleZodError(zodLikeError);
  assert.ok(result instanceof ValidationError);
  assert.equal(result.message, 'Validation failed');
  assert.deepEqual(result.errors, [
    { path: 'email', message: 'Invalid email', code: 'invalid_string' },
    { path: 'address.city', message: 'Required', code: 'invalid_type' },
  ]);
});

// ── formatErrorResponse ───────────────────────────────────────

test('formatErrorResponse: an AppError formats as {error: {code, message}}', () => {
  const result = formatErrorResponse(new NotFoundError('Not here'));
  assert.deepEqual(result, { error: { code: 'NOT_FOUND', message: 'Not here' } });
});

test('formatErrorResponse: an AppError with no code falls back to APP_ERROR', () => {
  const result = formatErrorResponse(new AppError('Oops', 500));
  assert.equal(result.error.code, 'APP_ERROR');
});

test('formatErrorResponse: a ValidationError also includes a `details` array of its errors', () => {
  const result = formatErrorResponse(new ValidationError('Bad', [{ path: 'x', message: 'y' }]));
  assert.deepEqual(result.error.details, [{ path: 'x', message: 'y' }]);
});

test('formatErrorResponse: an AppError with an empty errors[] array still includes `details: []` (arrays are truthy in JS regardless of length)', () => {
  const result = formatErrorResponse(new ValidationError('Bad', []));
  assert.equal('details' in result.error, true);
  assert.deepEqual(result.error.details, []);
});

test('formatErrorResponse: a non-AppError (e.g. a raw thrown Error) becomes a generic INTERNAL_ERROR', () => {
  const original = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';
  try {
    const result = formatErrorResponse(new Error('unexpected TypeError'));
    assert.deepEqual(result, { error: { code: 'INTERNAL_ERROR', message: 'unexpected TypeError' } });
  } finally {
    process.env.NODE_ENV = original;
  }
});

test('formatErrorResponse: in production, a non-AppError message is masked to avoid leaking internals', () => {
  const original = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const result = formatErrorResponse(new Error('leaky stack trace detail'));
    assert.equal(result.error.message, 'Internal server error');
  } finally {
    process.env.NODE_ENV = original;
  }
});

test('formatErrorResponse: an AppError message is NEVER masked in production (only non-AppError is)', () => {
  const original = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const result = formatErrorResponse(new NotFoundError('Company 42 not found'));
    assert.equal(result.error.message, 'Company 42 not found');
  } finally {
    process.env.NODE_ENV = original;
  }
});
