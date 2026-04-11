import { ErrorCodes } from './error-codes';

export const ErrorMessages: Record<ErrorCodes, string> = {
  [ErrorCodes.AUTH_INVALID_CREDENTIALS]: 'Invalid credentials',
  [ErrorCodes.AUTH_UNAUTHORIZED]: 'Unauthorized',
  [ErrorCodes.AUTH_REFRESH_TOKEN_INVALID]: 'Invalid refresh token',
  [ErrorCodes.AUTH_REFRESH_TOKEN_MISSING]: 'Refresh token is missing',
  [ErrorCodes.AUTH_REFRESH_TOKEN_REVOKED]: 'Refresh token has been revoked',

  [ErrorCodes.USER_NOT_FOUND]: 'User not found',
  [ErrorCodes.USER_ALREADY_EXISTS]: 'User with this email already exists',

  [ErrorCodes.ACCESS_DENIED]: 'Access denied',

  [ErrorCodes.INTERNAL_SERVER_ERROR]: 'Internal server error',

  [ErrorCodes.VALIDATION_FAILED]: 'Validation failed',
};

