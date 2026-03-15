export type ErrorCode =
  | 'NOT_FOUND'
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'
  | 'INVALID_PIN';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }

  static notFound(msg: string) { return new AppError(404, 'NOT_FOUND', msg); }
  static badRequest(msg: string) { return new AppError(400, 'BAD_REQUEST', msg); }
  static unauthorized(msg: string) { return new AppError(401, 'UNAUTHORIZED', msg); }
  static forbidden(msg: string) { return new AppError(403, 'FORBIDDEN', msg); }
  static conflict(msg: string) { return new AppError(409, 'CONFLICT', msg); }
  static internal(msg: string) { return new AppError(500, 'INTERNAL_ERROR', msg); }
  static invalidPin(msg: string) { return new AppError(401, 'INVALID_PIN', msg); }
}
