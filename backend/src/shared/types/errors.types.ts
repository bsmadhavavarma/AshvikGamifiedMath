export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'INTERNAL_SERVER_ERROR'
  | 'BAD_REQUEST'
  | 'SESSION_ALREADY_COMPLETE'
  | 'SESSION_ABANDONED'
  | 'QUESTION_ALREADY_ANSWERED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'DATABASE_ERROR';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    code: ErrorCode,
    isOperational = true,
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  static notFound(resource: string, id?: string): AppError {
    const msg = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
    return new AppError(msg, 404, 'NOT_FOUND');
  }

  static conflict(message: string): AppError {
    return new AppError(message, 409, 'CONFLICT');
  }

  static badRequest(message: string): AppError {
    return new AppError(message, 400, 'BAD_REQUEST');
  }

  static validationError(message: string): AppError {
    return new AppError(message, 422, 'VALIDATION_ERROR');
  }

  static internal(message = 'Internal server error'): AppError {
    return new AppError(message, 500, 'INTERNAL_SERVER_ERROR', false);
  }
}
