import { ErrorCodes } from '../constants/error-codes';
import { ErrorMessages } from '../constants/error-messages';
import { HttpStatusCode } from '../constants/http-status';
import { SuccessCodes, SuccessMessages } from '../constants/success-messages';

export interface SuccessResponse<T> {
  success: true;
  code?: SuccessCodes;
  message?: string;
  data: T;
}

export interface ErrorResponse {
  success: false;
  code: ErrorCodes;
  message: string;
  statusCode: HttpStatusCode;
}

export interface ControllerSuccess<T> {
  data: T;
  successCode?: SuccessCodes;
}

export interface ControllerErrorOptions {
  errorCode: ErrorCodes;
  statusCode: HttpStatusCode;
}

export const buildSuccessResponse = <T>(
  data: T,
  successCode?: SuccessCodes,
): SuccessResponse<T> => {
  const message = successCode ? SuccessMessages[successCode] : undefined;

  return {
    success: true,
    code: successCode,
    message,
    data,
  };
};

export const buildErrorPayload = (options: ControllerErrorOptions): Omit<
  ErrorResponse,
  'message'
> & { rawMessage?: string } => ({
  success: false,
  code: options.errorCode,
  statusCode: options.statusCode,
});

export const buildErrorResponse = (
  errorCode: ErrorCodes,
  statusCode: HttpStatusCode,
  rawMessage?: string,
): ErrorResponse => {
  const message = ErrorMessages[errorCode];

  return {
    success: false,
    code: errorCode,
    message: rawMessage ?? message,
    statusCode,
  };
};

