import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ErrorCodes } from '../constants/error-codes';
import { HttpStatusCode } from '../constants/http-status';
import { buildErrorResponse } from '../utils/response.util';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const responsePayload = exception.getResponse();

      let errorCode = ErrorCodes.INTERNAL_SERVER_ERROR;

      if (typeof responsePayload === 'object' && responsePayload !== null) {
        const payload = responsePayload as {
          errorCode?: ErrorCodes;
          message?: string;
        };

        if (payload.errorCode) {
          errorCode = payload.errorCode;
        }
      }

      const errorResponse = buildErrorResponse(
        errorCode,
        status as HttpStatusCode,
        exception.message,
      );

      response.status(status).json(errorResponse);
      return;
    }

    const errorResponse = buildErrorResponse(
      ErrorCodes.INTERNAL_SERVER_ERROR,
      HttpStatus.INTERNAL_SERVER_ERROR as HttpStatusCode,
      exception?.message,
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
}

