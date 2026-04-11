import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ErrorCodes } from '../constants/error-codes';
import { ErrorMessages } from '../constants/error-messages';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleRequest(err: any, user: any, info?: any, context?: ExecutionContext): any {
    if (err || !user) {
      throw new UnauthorizedException({
        errorCode: ErrorCodes.AUTH_UNAUTHORIZED,
        message: ErrorMessages[ErrorCodes.AUTH_UNAUTHORIZED],
      });
    }

    return super.handleRequest(err, user, info, context);
  }
}

